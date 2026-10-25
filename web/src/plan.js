import { supabase, contactEmail } from "./supabase.js";

const services = {
  extension: { label: "Extension paperwork", key: "paperwork_price_aud", amount: 300 },
  consultation: { label: "Thailand insider consultation", key: "consultation_price_aud", amount: 79 },
  moving: { label: "Moving to Thailand consultation", key: "moving_price_aud", amount: 199 },
  itinerary: { label: "Custom Thailand itinerary", key: "itinerary_price_aud", amount: 69 },
};

const options = document.querySelector("#plan-options");
const selectionStatus = document.querySelector("#selection-status");
const review = document.querySelector("#plan-review");
const reviewButton = document.querySelector("#review-plan");
const editButton = document.querySelector("#edit-plan");
const lines = document.querySelector("#plan-lines");
const total = document.querySelector("#plan-total");
const note = document.querySelector("#plan-estimate-note");
const form = document.querySelector("#plan-form");
const extensionFields = document.querySelector("#plan-extension-fields");

function selectedServices() {
  return [...options.querySelectorAll('input[name="help"]:checked')].map((input) => input.value);
}

function updateSelection() {
  const count = selectedServices().length;
  selectionStatus.textContent = count ? `${count} ${count === 1 ? "service" : "services"} selected. Review your choices to see the estimate.` : "Choose at least one service to continue.";
  options.querySelectorAll(".plan-option").forEach((option) => {
    const checked = option.querySelector("input").checked;
    option.classList.toggle("selected", checked);
    option.querySelector(".plan-option-mark").textContent = checked ? "✓" : "+";
  });
  if (!review.hidden) review.hidden = true;
}

async function loadPrices() {
  if (!supabase) return;
  const { data, error } = await supabase.from("site_settings").select("key,value").in("key", Object.values(services).map(({ key }) => key));
  if (error || !data) return;
  for (const row of data) {
    const service = Object.values(services).find(({ key }) => key === row.key);
    const amount = Number(row.value);
    if (service && Number.isFinite(amount) && amount > 0) service.amount = amount;
  }
}

const pricesReady = loadPrices();

async function renderReview() {
  await pricesReady;
  const selected = selectedServices();
  if (!selected.length) {
    selectionStatus.textContent = "Choose at least one service first.";
    options.querySelector("input")?.focus();
    return;
  }
  lines.replaceChildren();
  let amount = 0;
  for (const key of selected) {
    const service = services[key];
    const row = document.createElement("div");
    row.className = "plan-line";
    const label = document.createElement("span");
    label.textContent = service.label;
    const price = document.createElement("span");
    price.textContent = `${key === "itinerary" ? "From " : ""}A$${service.amount.toLocaleString("en-AU")}`;
    row.append(label, price);
    lines.append(row);
    amount += service.amount;
  }
  const hasItinerary = selected.includes("itinerary");
  total.textContent = `${hasItinerary ? "From " : ""}A$${amount.toLocaleString("en-AU")}`;
  note.textContent = hasItinerary ? "The itinerary amount is a starting price. Merv will confirm the scope and final price before you decide." : "Merv will confirm availability and exactly what is included before you decide.";
  extensionFields.hidden = !selected.includes("extension");
  review.hidden = false;
  review.scrollIntoView({ behavior: "smooth", block: "start" });
}

function mailtoFallback(details, selected) {
  const list = selected.map((key) => services[key].label).join(", ");
  const body = [
    `Name: ${details.name}`,
    `Email: ${details.email}`,
    `Selected help: ${list}`,
    `Service estimate shown: ${total.textContent}`,
    details.extension_type ? `Extension type: ${details.extension_type}` : "",
    details.expiry_date ? `Permission end date: ${details.expiry_date}` : "",
    details.location ? `Location: ${details.location}` : "",
    `Plans and questions: ${details.message}`,
  ].filter(Boolean).join("\n");
  location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("My Thailand request for Merv")}&body=${encodeURIComponent(body)}`;
}

options.addEventListener("change", updateSelection);
reviewButton.addEventListener("click", renderReview);
editButton.addEventListener("click", () => {
  review.hidden = true;
  options.scrollIntoView({ behavior: "smooth", block: "start" });
  options.querySelector("input:checked")?.focus({ preventScroll: true });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const selected = selectedServices();
  if (!selected.length) return;
  const input = new FormData(form);
  const status = form.querySelector(".form-status");
  if (String(input.get("website") || "")) {
    status.textContent = "Thanks. Your request has been received.";
    status.className = "form-status success";
    return;
  }
  const selectedLabels = selected.map((key) => services[key].label).join(", ");
  const customerMessage = String(input.get("message") || "").trim();
  const message = `Selected help: ${selectedLabels}\nService estimate shown: ${total.textContent}\n\n${customerMessage}`;
  const details = {
    service: selected[0],
    name: String(input.get("name") || "").trim(),
    email: String(input.get("email") || "").trim(),
    extension_type: selected.includes("extension") ? String(input.get("extension_type") || "").trim() : "",
    expiry_date: selected.includes("extension") ? String(input.get("expiry_date") || "").trim() : "",
    location: selected.includes("extension") ? String(input.get("location") || "").trim() : "",
    message,
  };
  if (!supabase) {
    mailtoFallback(details, selected);
    status.textContent = `Your email app should open with a message to ${contactEmail}. Send that email to finish your request.`;
    status.className = "form-status";
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = "Sending…";
  status.className = "form-status";
  try {
    const { error } = await supabase.from("enquiries").insert(details);
    if (error) throw error;
    form.reset();
    status.textContent = "Your request was sent. Merv can reply using the email address you supplied.";
    status.className = "form-status success";
  } catch {
    status.textContent = `The form could not send. Please email ${contactEmail} directly.`;
    status.className = "form-status error";
  } finally {
    button.disabled = false;
  }
});

const requestedService = new URLSearchParams(location.search).get("service");
if (services[requestedService]) options.querySelector(`input[value="${requestedService}"]`).checked = true;
updateSelection();
