import { supabase, contactEmail } from "./supabase.js";

const priceKeys = ["paperwork_price_aud", "consultation_price_aud", "moving_price_aud", "itinerary_price_aud"];

document.querySelectorAll("#year").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#main-nav");
menuButton?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

async function loadPrices() {
  if (!supabase) return;
  const { data, error } = await supabase.from("site_settings").select("key,value").in("key", priceKeys);
  if (error || !data) return;
  for (const row of data) {
    const amount = Number(row.value);
    if (!Number.isFinite(amount) || amount < 1) continue;
    document.querySelectorAll(`[data-price-key="${row.key}"]`).forEach((el) => { el.textContent = `A$${amount}`; });
  }
}

function makeArticleLink(article) {
  const link = document.createElement("a");
  link.href = `/journal.html?slug=${encodeURIComponent(article.slug)}`;
  const date = document.createElement("small");
  date.textContent = new Date(article.created_at).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });
  const title = document.createElement("span");
  title.textContent = article.title;
  link.append(date, title);
  return link;
}

async function loadArticles() {
  if (!supabase) return;
  const slug = new URLSearchParams(location.search).get("slug");
  if (slug && document.body.dataset.page === "journal") {
    const { data } = await supabase.from("articles").select("title,excerpt,body,slug,created_at").eq("slug", slug).eq("published", true).maybeSingle();
    if (!data) return;
    document.querySelector("#journal-list").hidden = true;
    document.querySelector("#journal-article").hidden = false;
    document.querySelector("#article-title").textContent = data.title;
    document.querySelector("#article-excerpt").textContent = data.excerpt;
    document.querySelector("#article-body").textContent = data.body;
    document.title = `${data.title} | The Good, Bad & Ugly of Thailand`;
    const articleUrl = `${location.origin}/journal.html?slug=${encodeURIComponent(data.slug)}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", articleUrl);
    document.querySelector('meta[name="description"]')?.setAttribute("content", data.excerpt);
    document.querySelector('meta[property="og:type"]')?.setAttribute("content", "article");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", data.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", data.excerpt);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", articleUrl);
    const structuredArticle = document.createElement("script");
    structuredArticle.type = "application/ld+json";
    structuredArticle.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title,
      description: data.excerpt,
      datePublished: data.created_at,
      author: { "@type": "Person", name: "Merv" },
      mainEntityOfPage: articleUrl,
    });
    document.head.append(structuredArticle);
    return;
  }
  const target = document.querySelector(document.body.dataset.page === "home" ? "#latest-articles" : "#journal-list");
  if (!target) return;
  const { data } = await supabase.from("articles").select("title,excerpt,slug,created_at").eq("published", true).order("created_at", { ascending: false }).limit(document.body.dataset.page === "home" ? 3 : 50);
  if (!data?.length) return;
  target.replaceChildren();
  for (const article of data) {
    const link = makeArticleLink(article);
    if (document.body.dataset.page === "journal") {
      const title = link.querySelector("span");
      const heading = document.createElement("h2");
      heading.textContent = title.textContent;
      title.replaceWith(heading);
      const excerpt = document.createElement("p");
      excerpt.textContent = article.excerpt;
      link.append(excerpt);
    }
    target.append(link);
  }
}

function mailtoFallback(details) {
  const subject = details.service === "extension" ? "Thailand extension paperwork enquiry" : "Thailand service enquiry";
  const body = [
    `Name: ${details.name}`,
    `Email: ${details.email}`,
    `Service: ${details.service}`,
    details.extension_type ? `Extension type: ${details.extension_type}` : "",
    details.expiry_date ? `Permission end date: ${details.expiry_date}` : "",
    details.location ? `Location: ${details.location}` : "",
    `Message: ${details.message || ""}`,
  ].filter(Boolean).join("\n");
  location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function wireEnquiryForm(form) {
  const status = form.querySelector(".form-status");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const input = new FormData(form);
    if (String(input.get("website") || "")) {
      status.textContent = "Thanks. Your enquiry has been received.";
      status.className = "form-status success";
      return;
    }
    const details = {
      service: form.id === "extension-form" ? "extension" : String(input.get("service") || "other"),
      name: String(input.get("name") || "").trim(),
      email: String(input.get("email") || "").trim(),
      extension_type: String(input.get("extension_type") || "").trim(),
      expiry_date: String(input.get("expiry_date") || "").trim(),
      location: String(input.get("location") || "").trim(),
      message: String(input.get("message") || "").trim(),
    };
    if (!supabase) {
      mailtoFallback(details);
      status.textContent = `Your email app should open with a message to ${contactEmail}. Please send that email to finish your enquiry.`;
      status.className = "form-status";
      return;
    }
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Sending…";
    status.className = "form-status";
    try {
      const { error } = await supabase.from("enquiries").insert(details);
      if (error) throw error;
      form.reset();
      status.textContent = "Your enquiry has been received. Merv can reply using the email address you supplied.";
      status.className = "form-status success";
    } catch {
      status.textContent = `The form could not send right now. Please email ${contactEmail} directly.`;
      status.className = "form-status error";
    } finally {
      button.disabled = false;
    }
  });
}

document.querySelectorAll("#extension-form,#general-form").forEach(wireEnquiryForm);
void loadPrices();
void loadArticles();
