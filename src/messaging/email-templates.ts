import { config } from "../config.js";
import type { BoardCustomer } from "../types.js";
import type { TemplateKey } from "./templates.js";

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function firstName(customer: BoardCustomer): string {
  return customer.customerName?.split(" ")[0] || customer.name?.split(" ")[0] || "there";
}

function wrap(text: string): string {
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">${text
    .split("\n")
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("")}</div>`;
}

export function renderEmailTemplate(key: TemplateKey, customer: BoardCustomer): RenderedEmail {
  const name = firstName(customer);
  const officePhone = config.BUXTON_OFFICE_PHONE || "our office";
  const reviewUrl = config.GOOGLE_REVIEW_URL;

  const emails: Record<TemplateKey, RenderedEmail> = {
    new_lead_confirmation: {
      subject: "Thanks for contacting Buxton Blinds",
      text: `Hi ${name},\n\nThanks for contacting Buxton Blinds. We received your request and will follow up soon.\n\nReply to this email or text us anytime with questions.`,
      html: ""
    },
    quote_followup_1: {
      subject: "Following up on your Buxton Blinds quote",
      text: `Hi ${name},\n\nJust checking in on your Buxton Blinds quote. Happy to answer questions or help with next steps whenever you are ready.`,
      html: ""
    },
    quote_followup_2: {
      subject: "Any questions on your quote?",
      text: `Hi ${name},\n\nFollowing up again on your quote. If you would like to adjust anything or schedule the work, reply here and we can help.`,
      html: ""
    },
    quote_followup_3: {
      subject: "Last automatic quote follow-up",
      text: `Hi ${name},\n\nLast automatic follow-up on your Buxton Blinds quote. We are here whenever you are ready. You can also call ${officePhone}.`,
      html: ""
    },
    weekly_in_progress: {
      subject: "Your Buxton Blinds project is still in progress",
      text: `Hi ${name},\n\nQuick update: your project is still in progress. We will keep you posted and reach out as soon as the next step is ready.`,
      html: ""
    },
    appointment_reminder_24h: {
      subject: "Appointment reminder from Buxton Blinds",
      text: `Hi ${name},\n\nReminder: your Buxton Blinds appointment is coming up. Reply here if you need anything changed.`,
      html: ""
    },
    appointment_reminder_2h: {
      subject: "Your appointment is coming up soon",
      text: `Hi ${name},\n\nYour Buxton Blinds appointment is coming up soon. See you then.`,
      html: ""
    },
    after_install_thank_you: {
      subject: "Thank you from Buxton Blinds",
      text: `Hi ${name},\n\nThank you for choosing Buxton Blinds. We hope you love the finished installation. Reply here if anything needs attention.`,
      html: ""
    },
    google_review_request: {
      subject: "Would you leave Buxton Blinds a review?",
      text: `Hi ${name},\n\nIf you had a good experience with Buxton Blinds, would you mind leaving us a Google review?\n\n${reviewUrl}`,
      html: ""
    },
    internal_customer_reply: {
      subject: "Customer replied to Buxton Blinds",
      text: `Customer reply from ${customer.name || name} (${customer.phone || "unknown phone"}).`,
      html: ""
    }
  };

  const email = emails[key];
  return { ...email, html: email.html || wrap(email.text) };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
