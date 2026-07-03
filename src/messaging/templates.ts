import type { BoardCustomer } from "../types.js";
import { config } from "../config.js";

export type TemplateKey =
  | "new_lead_confirmation"
  | "quote_followup_1"
  | "quote_followup_2"
  | "quote_followup_3"
  | "weekly_in_progress"
  | "appointment_reminder_24h"
  | "appointment_reminder_2h"
  | "after_install_thank_you"
  | "google_review_request"
  | "internal_customer_reply";

function firstName(customer: BoardCustomer): string {
  return customer.customerName?.split(" ")[0] || customer.name?.split(" ")[0] || "there";
}

function appointmentText(customer: BoardCustomer): string {
  if (!customer.appointmentAt) return "your appointment";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(new Date(customer.appointmentAt));
}

export function renderTemplate(key: TemplateKey, customer: BoardCustomer, extra: Record<string, string> = {}): string {
  const name = firstName(customer);
  const officePhone = config.BUXTON_OFFICE_PHONE || "our office";

  const templates: Record<TemplateKey, string> = {
    new_lead_confirmation: `Hi ${name}, thanks for contacting Buxton Blinds. We received your request and will follow up soon. Reply here anytime with questions.`,
    quote_followup_1: `Hi ${name}, just checking in on your Buxton Blinds quote. Happy to answer questions or help with next steps whenever you are ready.`,
    quote_followup_2: `Hi ${name}, following up again on your quote. If you would like to adjust anything or schedule the work, reply here and we can help.`,
    quote_followup_3: `Hi ${name}, last automatic follow-up on your Buxton Blinds quote. We are here whenever you are ready. You can also call ${officePhone}.`,
    weekly_in_progress: `Hi ${name}, quick Buxton Blinds update: your project is still in progress. We will keep you posted and reach out as soon as the next step is ready.`,
    appointment_reminder_24h: `Hi ${name}, reminder from Buxton Blinds: your appointment is scheduled for ${appointmentText(customer)}. Reply here if you need anything changed.`,
    appointment_reminder_2h: `Hi ${name}, Buxton Blinds reminder: your appointment is coming up soon at ${appointmentText(customer)}. See you then.`,
    after_install_thank_you: `Hi ${name}, thank you for choosing Buxton Blinds. We hope you love the finished installation. Reply here if anything needs attention.`,
    google_review_request: `Hi ${name}, if you had a good experience with Buxton Blinds, would you mind leaving us a Google review? ${config.GOOGLE_REVIEW_URL}`,
    internal_customer_reply: `Customer reply from ${customer.name || name} (${customer.phone || "unknown phone"}): ${extra.body || ""}`
  };

  return templates[key];
}
