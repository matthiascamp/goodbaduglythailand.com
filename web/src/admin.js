import { supabase } from "./supabase.js";

const loginSection = document.querySelector("#admin-login");
const dashboard = document.querySelector("#admin-dashboard");
const setupNote = document.querySelector("#admin-setup-note");
const loginStatus = document.querySelector("#login-status");
const loginForm = document.querySelector("#login-form");
const articleForm = document.querySelector("#article-form");
const priceForm = document.querySelector("#price-form");
let currentArticles = [];

if (!supabase) {
  setupNote.textContent = "The Supabase project is not connected yet. Owner login will be available once its URL and publishable key are configured.";
  loginForm.querySelector("button").disabled = true;
} else {
  void showSession();
}

function textElement(tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}

function setStatus(selector, message) {
  document.querySelector(selector).textContent = message;
}

async function showSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { loginSection.hidden = false; dashboard.hidden = true; return; }
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) {
    await supabase.auth.signOut();
    loginSection.hidden = false;
    dashboard.hidden = true;
    loginStatus.textContent = "This account does not have owner access.";
    return;
  }
  loginSection.hidden = true;
  dashboard.hidden = false;
  document.querySelector("#signed-in-as").textContent = `Signed in as ${user.email}`;
  await Promise.all([loadEnquiries(), loadArticles(), loadPrices()]);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!supabase) return;
  loginStatus.textContent = "Signing in…";
  const input = new FormData(loginForm);
  const { error } = await supabase.auth.signInWithPassword({ email: String(input.get("email")), password: String(input.get("password")) });
  if (error) { loginStatus.textContent = "Sign-in failed. Check your email and password."; return; }
  loginStatus.textContent = "";
  await showSession();
});

document.querySelector("#signout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  loginForm.reset();
  await showSession();
});

document.querySelectorAll(".admin-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".admin-tabs button").forEach((tab) => tab.classList.toggle("active", tab === button));
    document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${button.dataset.tab}`));
  });
});

async function loadEnquiries() {
  const list = document.querySelector("#enquiries-list");
  const { data, error } = await supabase.from("enquiries").select("id,created_at,name,email,service,extension_type,expiry_date,location,message,status").order("created_at", { ascending: false }).limit(200);
  list.replaceChildren();
  if (error) { list.append(textElement("p", "Could not load enquiries. Check the Supabase policies.")); return; }
  document.querySelector("#new-enquiry-count").textContent = String(data.filter((item) => item.status === "NEW").length);
  if (!data.length) { list.append(textElement("p", "No enquiries yet.")); return; }
  for (const item of data) {
    const row = textElement("article", "", "admin-row");
    const copy = document.createElement("div");
    copy.append(textElement("strong", `${item.name} · ${item.service} · ${item.status}`));
    copy.append(textElement("p", new Date(item.created_at).toLocaleString("en-AU")));
    const email = document.createElement("a");
    email.href = `mailto:${item.email}`;
    email.textContent = item.email;
    copy.append(email);
    const details = [item.extension_type && `Extension: ${item.extension_type}`, item.expiry_date && `Permission ends: ${item.expiry_date}`, item.location && `Location: ${item.location}`, item.message].filter(Boolean).join(" · ");
    if (details) copy.append(textElement("p", details));
    row.append(copy);
    if (item.status === "NEW") {
      const done = textElement("button", "Mark replied", "secondary");
      done.type = "button";
      done.addEventListener("click", async () => {
        done.disabled = true;
        const { error: updateError } = await supabase.from("enquiries").update({ status: "REPLIED" }).eq("id", item.id);
        if (updateError) { done.disabled = false; alert("Could not update this enquiry."); return; }
        await loadEnquiries();
      });
      row.append(done);
    }
    list.append(row);
  }
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

async function loadArticles() {
  const list = document.querySelector("#articles-list");
  const { data, error } = await supabase.from("articles").select("id,title,slug,excerpt,body,published,created_at").order("created_at", { ascending: false });
  list.replaceChildren();
  if (error) { list.append(textElement("p", "Could not load articles.")); return; }
  currentArticles = data;
  document.querySelector("#published-article-count").textContent = String(data.filter((article) => article.published).length);
  if (!data.length) { list.append(textElement("p", "No articles yet. Use the editor below to publish Merv’s first story.")); return; }
  for (const article of data) {
    const row = textElement("div", "", "admin-row");
    const copy = document.createElement("div");
    copy.append(textElement("strong", article.title));
    copy.append(textElement("p", article.published ? "Published" : "Draft"));
    const actions = textElement("div", "", "admin-actions");
    const edit = textElement("button", "Edit", "secondary");
    edit.type = "button";
    edit.addEventListener("click", () => {
      articleForm.elements.id.value = article.id;
      articleForm.elements.title.value = article.title;
      articleForm.elements.excerpt.value = article.excerpt;
      articleForm.elements.body.value = article.body;
      articleForm.elements.published.checked = article.published;
      document.querySelector("#article-form-heading").textContent = "Edit article";
      articleForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const remove = textElement("button", "Delete", "secondary");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      if (!confirm(`Delete “${article.title}”? This cannot be undone.`)) return;
      const { error: deleteError } = await supabase.from("articles").delete().eq("id", article.id);
      if (deleteError) { alert("Could not delete this article."); return; }
      await loadArticles();
    });
    actions.append(edit, remove);
    row.append(copy, actions);
    list.append(row);
  }
}

function resetArticleEditor() {
  articleForm.reset();
  articleForm.elements.id.value = "";
  document.querySelector("#article-form-heading").textContent = "Write an article";
  setStatus("#article-status", "");
}

document.querySelector("#reset-article").addEventListener("click", resetArticleEditor);

articleForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = new FormData(articleForm);
  const id = String(input.get("id") || "");
  const title = String(input.get("title") || "").trim();
  const record = {
    title,
    slug: id ? currentArticles.find((article) => article.id === id)?.slug : slugify(title),
    excerpt: String(input.get("excerpt") || "").trim(),
    body: String(input.get("body") || "").trim(),
    published: input.get("published") === "on",
  };
  if (!record.slug) { setStatus("#article-status", "Please use a title with letters or numbers."); return; }
  setStatus("#article-status", "Saving…");
  const result = id ? await supabase.from("articles").update(record).eq("id", id) : await supabase.from("articles").insert(record);
  if (result.error) { setStatus("#article-status", "Could not save. The title may already be in use."); return; }
  resetArticleEditor();
  await loadArticles();
  setStatus("#article-status", "Article saved.");
});

const defaultPrices = { paperwork_price_aud: 300, consultation_price_aud: 79, moving_price_aud: 199, itinerary_price_aud: 69 };

async function loadPrices() {
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error) { setStatus("#price-status", "Could not load prices."); return; }
  const values = Object.fromEntries(data.map((row) => [row.key, row.value]));
  for (const [key, fallback] of Object.entries(defaultPrices)) priceForm.elements[key].value = values[key] ?? fallback;
}

priceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("#price-status", "Saving…");
  const rows = Object.keys(defaultPrices).map((key) => ({ key, value: String(Number(priceForm.elements[key].value)) }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  setStatus("#price-status", error ? "Could not save prices." : "Prices saved. Public pages will show the new values on refresh.");
});
