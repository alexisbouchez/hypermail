import { Resend } from "resend";
import { getApiKey } from "../config";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("No API key configured");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function resetClient(): void {
  resendClient = null;
}

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams) {
  const client = getResendClient();
  return client.emails.send(params);
}

export async function getEmail(id: string) {
  const client = getResendClient();
  return client.emails.get(id);
}

export async function listDomains() {
  const client = getResendClient();
  return client.domains.list();
}

export async function listApiKeys() {
  const client = getResendClient();
  return client.apiKeys.list();
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const tempClient = new Resend(apiKey);
    await tempClient.domains.list();
    return true;
  } catch {
    return false;
  }
}

export async function listReceivedEmails() {
  const client = getResendClient();
  return client.emails.receiving.list();
}

export async function getReceivedEmail(id: string) {
  const client = getResendClient();
  return client.emails.receiving.get(id);
}

export async function listSentEmails() {
  const client = getResendClient();
  return client.emails.list();
}

export async function getSentEmail(id: string) {
  const client = getResendClient();
  return client.emails.get(id);
}
