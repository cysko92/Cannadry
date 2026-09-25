import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

type Email = { to: string | string[]; subject: string; text: string };

/**
 * Sends a plain-text email through Resend. Without RESEND_API_KEY (local development)
 * the message is printed to the server log instead. Failures are logged, never thrown:
 * an email problem must not undo a completed action.
 */
export async function sendEmail({ to, subject, text }: Email) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CannaDry <no-reply@cannadry.example>";
  if (!key) {
    console.info(`[email] to=${[to].flat().join(",")} subject="${subject}"\n${text}`);
    return;
  }
  try {
    const { error } = await new Resend(key).emails.send({ from, to, subject, text });
    if (error) console.error("[email] send failed", error);
  } catch (err) {
    console.error("[email] send failed", err);
  }
}

const signature = "\n\n— The CannaDry team";

export const emails = {
  requestReceived: (to: string, company: string) =>
    sendEmail({
      to,
      subject: "We received your CannaDry access request",
      text:
        `Thank you. We received the access request for ${company.replace(/\.$/, "")}.\n\n` +
        `Our team will verify your licence and email you when your account has been reviewed. ` +
        `Products and prices become visible once your account is approved.` +
        signature,
    }),

  adminNewRequest: (company: string, companyId: string) => {
    const to = process.env.ADMIN_NOTIFY_EMAIL;
    if (!to) return Promise.resolve();
    return sendEmail({
      to,
      subject: `New access request: ${company}`,
      text: `A new access request is waiting for review.\n\n${env.siteUrl()}/admin/companies/${companyId}`,
    });
  },

  approved: (to: string, company: string) =>
    sendEmail({
      to,
      subject: "Your CannaDry account is approved",
      text:
        `The account for ${company} has been approved. You can now sign in to view the catalogue and place purchase orders.\n\n` +
        `${env.siteUrl()}/login` +
        signature,
    }),

  rejected: (to: string, company: string, reason: string) =>
    sendEmail({
      to,
      subject: "Your CannaDry access request",
      text:
        `We could not approve the access request for ${company}.\n\nReason: ${reason}\n\n` +
        `If you believe this is an error, reply to this email with updated licence information.` +
        signature,
    }),

  suspended: (to: string, company: string, reason: string) =>
    sendEmail({
      to,
      subject: "Your CannaDry account has been suspended",
      text: `Access for ${company} has been suspended.\n\nReason: ${reason}` + signature,
    }),

  reactivated: (to: string, company: string) =>
    sendEmail({
      to,
      subject: "Your CannaDry account is active again",
      text: `Access for ${company} has been restored.\n\n${env.siteUrl()}/login` + signature,
    }),
};
