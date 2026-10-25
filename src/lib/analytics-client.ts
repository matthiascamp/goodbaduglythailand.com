import type { ClientEvent } from "@/lib/analytics";

/** Fire-and-forget. Sends only the event name; never include emails, answers or URLs. */
export function reportEvent(event: ClientEvent) {
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon && navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {
    /* analytics must never affect the page */
  }
}
