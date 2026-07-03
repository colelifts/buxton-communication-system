export type CustomerStage =
  | "New Lead"
  | "Quote Sent"
  | "In Progress"
  | "Appointment Scheduled"
  | "Installed"
  | "Closed Won"
  | "Closed Lost"
  | string;

export interface BoardCustomer {
  id: string;
  name: string;
  customerName?: string;
  phone?: string;
  email?: string;
  stage?: CustomerStage;
  automationPaused?: boolean;
  stopAutomation?: boolean;
  lastCustomerReplyAt?: string;
  lastOutboundSmsAt?: string;
  lastOutboundTemplate?: string;
  newLeadConfirmedAt?: string;
  quoteSentAt?: string;
  quoteFollowupStep?: number;
  inProgressLastUpdateAt?: string;
  appointmentAt?: string;
  appointmentReminder24hAt?: string;
  appointmentReminder2hAt?: string;
  installCompletedAt?: string;
  afterInstallThankYouAt?: string;
  reviewRequestSentAt?: string;
  smsLog?: string;
  fields: Record<string, unknown>;
}

export interface OutboundMessage {
  to: string;
  body: string;
  templateKey: string;
  customerId?: string;
}

export interface SmsSendResult {
  provider: string;
  messageId: string;
  testMode: boolean;
}

export interface IncomingSms {
  provider: string;
  from: string;
  to?: string;
  body: string;
  messageId?: string;
  receivedAt: Date;
}

export interface SmsProvider {
  name: string;
  send(message: OutboundMessage): Promise<SmsSendResult>;
}

export interface BoardClient {
  listCustomers(): Promise<BoardCustomer[]>;
  findCustomerByPhone(phone: string): Promise<BoardCustomer | undefined>;
  updateCustomer(id: string, fields: Partial<BoardCustomer>): Promise<void>;
  appendSmsLog(id: string, line: string): Promise<void>;
}
