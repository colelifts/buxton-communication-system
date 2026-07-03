import { renderTemplate } from "../messaging/templates.js";
import type { BoardClient, IncomingSms, SmsProvider } from "../types.js";
import { nowIso } from "../utils/dates.js";
import { normalizePhone } from "../utils/phone.js";
import { config } from "../config.js";
import { log } from "../logger.js";

export async function handleIncomingSms(board: BoardClient, sms: SmsProvider, incoming: IncomingSms): Promise<void> {
  const customer = await board.findCustomerByPhone(incoming.from);
  const receivedAt = nowIso(incoming.receivedAt);

  if (!customer) {
    log("warn", "incoming_sms_unmatched_customer", { from: incoming.from, body: incoming.body });
    if (config.INTERNAL_NOTIFICATION_NUMBER) {
      await sms.send({
        to: normalizePhone(config.INTERNAL_NOTIFICATION_NUMBER),
        body: `Unmatched customer SMS from ${incoming.from}: ${incoming.body}`,
        templateKey: "internal_customer_reply"
      });
    }
    return;
  }

  await board.updateCustomer(customer.id, {
    automationPaused: true,
    lastCustomerReplyAt: receivedAt
  });
  await board.appendSmsLog(customer.id, `[${receivedAt}] IN ${incoming.provider}: ${incoming.body}`);

  if (config.INTERNAL_NOTIFICATION_NUMBER) {
    await sms.send({
      to: normalizePhone(config.INTERNAL_NOTIFICATION_NUMBER),
      body: renderTemplate("internal_customer_reply", customer, { body: incoming.body }),
      templateKey: "internal_customer_reply",
      customerId: customer.id
    });
  }
}
