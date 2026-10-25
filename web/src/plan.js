import { supabase, contactEmail } from "./supabase.js";

const form = document.querySelector("#plan-form");
const needInputs = [...form.querySelectorAll('input[name="need"]')];
const compareInput = document.querySelector("#compare-membership");
const steps = [...document.querySelectorAll(".plan-step")];
const priceKeys = {
  extension: "paperwork_price_aud",
  moving: "moving_price_aud",
  itinerary: "itinerary_price_aud",
  consultation: "consultation_price_aud",
};
const labels = {
  extension: "Extension paperwork",
  moving: "Moving to Thailand consultation",
  itinerary: "Custom Thailand itinerary",
  consultation: "Insider consultation",
};
const prices = { extension: 300, moving: 199, itinerary: 69, consultation: 79 };

document.querySelector("#year").textContent = String(new Date().getFullYear());
const menuButton = document.querySelector(".menu-toggle");
menuButton.addEventListener("click", () => {
  const open = document.querySelector("#main-nav").classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

if (!supabase) document.querySelector("#plan-submit").firstChild.textContent = "Open an email to Merv ";

async function loadPrices() {
  if (!supabase) return;
  const { data, error } = await supabase.from("site_settings").select("key,value").in("key", Object.values(priceKeys));
  if (error || !data) return;
  for (const row of data) {
    const service = Object.keys(priceKeys).find((key) => priceKeys[key] === row.key);
    const value = Number(row.value);
    if (service && Number.isFinite(value) && value > 0) prices[service] = value;
  }
  if (!steps[2].hidden) renderReview();
}

function selectedNeeds() {
  return needInputs.filter((input) => input.checked).map((input) => input.value);
}

function setStep(number) {
  steps.forEach((step) => { step.hidden = Number(step.dataset.step) !== number; });
  document.querySelectorAll("[data-progress]").forEach((item) => {
    const active = Number(item.dataset.progress) === number;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  document.querySelector(".plan-shell").scrollIntoView({ behavior: "smooth", block: "start" });
  steps[number - 1].querySelector("h2")?.focus({ preventScroll: true });
}

document.querySelector("#needs-next").addEventListener("click", () => {
  if (!selectedNeeds().length) {
    document.querySelector("#needs-error").textContent = "Choose at least one thing you want help with.";
    return;
  }
  document.querySelector("#needs-error").textContent = "";
  setStep(2);
});
document.querySelector("#support-back").addEventListener("click", () => setStep(1));
document.querySelector("#support-next").addEventListener("click", () => {
  const support = form.querySelector('input[name="support"]:checked')?.value;
  if (!support) {
    document.querySelector("#support-error").textContent = "Choose the arrangement you want Merv to quote.";
    return;
  }
  document.querySelector("#support-error").textContent = "";
  compareInput.checked = support === "membership";
  renderReview();
  setStep(3);
});
document.querySelector("#review-back").addEventListener("click", () => setStep(2));
compareInput.addEventListener("change", renderReview);

function money(amount) {
  return `A$${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(amount)}`;
}

function renderReview() {
  const selected = selectedNeeds();
  const list = document.querySelector("#plan-selected-list");
  list.replaceChildren();
  for (const service of selected) {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const price = document.createElement("strong");
    label.textContent = labels[service];
    price.textContent = `${service === "itinerary" ? "From " : ""}${money(prices[service])}`;
    item.append(label, price);
    list.append(item);
  }
  const total = selected.reduce((sum, service) => sum + prices[service], 0);
  document.querySelector("#plan-one-off-total").textContent = `${selected.includes("itinerary") ? "From " : ""}${money(total)}`;
  document.querySelector("#extension-fields").hidden = !selected.includes("extension");
  document.querySelector("#plan-recommendation").textContent = compareInput.checked ? "Compare Thailand Companion" : "Your one-off plan";
  document.querySelector("#plan-recommendation-copy").textContent = compareInput.checked
    ? "Merv will quote ongoing support alongside these individual services, with the term and inclusions stated before you decide."
    : "These are the current one-off prices for the work you chose. Merv will confirm the exact scope and final amount.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.querySelector("#plan-submit-status");
  if (!selectedNeeds().length) { setStep(1); return; }
  if (!form.reportValidity()) { status.textContent = "Please enter your name and a valid email address."; return; }
  const input = new FormData(form);
  if (String(input.get("website") || "")) { status.textContent = "Thank you."; return; }
  const needs = selectedNeeds();
  const memberQuote = compareInput.checked;
  const total = needs.reduce((sum, service) => sum + prices[service], 0);
  const details = {
    service: "plan",
    name: String(input.get("name") || "").trim(),
    email: String(input.get("email") || "").trim(),
    extension_type: "",
    expiry_date: String(input.get("expiry_date") || "").trim(),
    location: String(input.get("location") || "").trim(),
    message: [
      `Selected services: ${needs.map((need) => labels[need]).join(", ")}`,
      `Indicative one-off total: ${needs.includes("itinerary") ? "from " : ""}${money(total)}`,
      `Member comparison requested: ${memberQuote ? "yes" : "no"}`,
      String(input.get("message") || "").trim() ? `Customer note: ${String(input.get("message")).trim()}` : "",
    ].filter(Boolean).join("\n"),
  };
  if (!supabase) {
    const body = [`Name: ${details.name}`, `Email: ${details.email}`, details.message,
      details.expiry_date ? `Permission ends: ${details.expiry_date}` : "",
      details.location ? `Location: ${details.location}` : ""].filter(Boolean).join("\n");
    location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("My Thailand plan for Merv")}&body=${encodeURIComponent(body)}`;
    status.textContent = `Your email app should open. Send the prepared message to ${contactEmail} to finish your enquiry.`;
    return;
  }
  const button = document.querySelector("#plan-submit");
  button.disabled = true;
  status.textContent = "Sending your plan...";
  try {
    const { error } = await supabase.from("enquiries").insert(details);
    if (error) throw error;
    status.textContent = "Your plan is with Merv. He can reply to the email address you gave.";
  } catch {
    status.textContent = `Could not send right now. Please email ${contactEmail} directly.`;
  } finally {
    button.disabled = false;
  }
});

const preset = new URLSearchParams(location.search).get("need");
if (Object.hasOwn(labels, preset)) form.querySelector(`input[name="need"][value="${preset}"]`).checked = true;
void loadPrices();
