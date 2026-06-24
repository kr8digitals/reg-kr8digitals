// Server-only email module. Never imported into the client bundle (filename *.server.ts
// is blocked, and callers dynamic-import it inside handlers). All Resend logic lives here.

const LOGO_URL = "https://regkr8digitals.com/logo.png";

interface BasePayload {
  preheader: string;
  heading: string;
  bodyHtml: string;
}

function baseLayout({ preheader, heading, bodyHtml }: BasePayload): string {
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#0A0A1A;font-family:Arial,Helvetica,sans-serif;color:#E0E0E0;">
    <span style="display:none;opacity:0;color:#0A0A1A;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A1A;padding:28px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#0F0822;border-radius:16px;overflow:hidden;">
          <tr><td align="center" style="padding:28px 24px 20px;border-bottom:2px solid #00E5FF;">
            <img src="${LOGO_URL}" alt="KR8 Digitals" width="96" height="96" style="border-radius:50%;display:block;" />
          </td></tr>
          <tr><td style="padding:30px 28px 8px;">
            <h1 style="margin:0 0 18px;font-size:22px;color:#FFD700;font-weight:bold;text-align:center;">${heading}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:24px 28px 30px;border-top:1px solid #2A1A4A;">
            <p style="margin:0;font-size:12px;color:#8A7AB0;text-align:center;line-height:1.6;">
              KR8 Digitals — Think it, create it.<br/>
              kr8digitals01@gmail.com &nbsp;|&nbsp; kr8digitals.com
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function regBox(reg: string, strike = false): string {
  const inner = strike
    ? `<span style="text-decoration:line-through;color:#8A7AB0;">${reg}</span>`
    : reg;
  return `<div style="background:#0A0A1A;border:2px solid #FFD700;border-radius:12px;padding:18px;text-align:center;margin:18px 0;box-shadow:0 0 20px #FFD700;">
    <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;color:#FFD700;letter-spacing:1px;word-break:break-all;">${inner}</div>
  </div>`;
}

function ctaButton(link: string, label: string): string {
  return `<div style="text-align:center;margin:22px 0 6px;">
    <a href="${link}" style="display:inline-block;background:#FFD700;color:#0A0A1A;font-weight:bold;text-decoration:none;padding:14px 26px;border-radius:9999px;font-size:15px;">${label}</a>
  </div>`;
}

const p = (txt: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#E0E0E0;">${txt}</p>`;

interface EmailContent {
  subject: string;
  html: string;
}

export function buildRegistrationEmail(d: {
  full_name: string;
  reg_number: string;
  skill: string;
  group_link: string;
}): EmailContent {
  return {
    subject: "🔓 Access Granted — Your KR8 Reg Number Inside",
    html: baseLayout({
      preheader: "Your free training spot has been secured.",
      heading: "Your free training spot has been secured.",
      bodyHtml: `
        ${p(`Hey <strong style="color:#fff;">${d.full_name}</strong>, you didn't just sign up — you were selected.`)}
        <p style="margin:0 0 6px;font-size:13px;color:#00E5FF;text-align:center;letter-spacing:0.05em;">Your KR8 Registration Number</p>
        ${regBox(d.reg_number)}
        ${p(`Screenshot this and keep it safe. This is your proof of access.`)}
        ${p(`<strong style="color:#fff;">Your Skill Track:</strong> ${d.skill}`)}
        ${ctaButton(d.group_link, "Join Your WhatsApp Training Group →")}
        ${p(`<span style="font-size:13px;color:#8A7AB0;">This link is specific to your skill track. Do not share your Reg Number.</span>`)}
      `,
    }),
  };
}

export function buildResetEmail(d: {
  full_name: string;
  old_reg_number: string;
  reg_number: string;
  skill: string;
  group_link: string;
}): EmailContent {
  return {
    subject: "🔄 Your KR8 Registration Has Been Updated",
    html: baseLayout({
      preheader: "Your KR8 registration has been updated.",
      heading: "Your registration has been updated.",
      bodyHtml: `
        ${p(`Hey <strong style="color:#fff;">${d.full_name}</strong>, here are your updated details.`)}
        <p style="margin:0 0 6px;font-size:13px;color:#8A7AB0;text-align:center;">Previous Reg Number</p>
        ${regBox(d.old_reg_number, true)}
        <p style="margin:0 0 6px;font-size:13px;color:#00E5FF;text-align:center;letter-spacing:0.05em;">Your New KR8 Registration Number</p>
        ${regBox(d.reg_number)}
        ${p(`<strong style="color:#fff;">Your New Skill Track:</strong> ${d.skill}`)}
        ${ctaButton(d.group_link, "Join Your New WhatsApp Group →")}
        ${p(`<span style="font-size:13px;color:#8A7AB0;">Make sure you have already left your previous group before joining the new one.</span>`)}
      `,
    }),
  };
}

export function buildRecoveryEmail(d: {
  full_name: string;
  reg_number: string;
  skill: string;
  group_link: string;
}): EmailContent {
  return {
    subject: "🔍 Here's Your KR8 Reg Number",
    html: baseLayout({
      preheader: "Here's your KR8 Reg Number.",
      heading: "Here's your KR8 Reg Number.",
      bodyHtml: `
        ${p(`Hey <strong style="color:#fff;">${d.full_name}</strong>, as requested — guard this carefully.`)}
        <p style="margin:0 0 6px;font-size:13px;color:#00E5FF;text-align:center;letter-spacing:0.05em;">Your KR8 Registration Number</p>
        ${regBox(d.reg_number)}
        ${p(`<strong style="color:#fff;">Your Skill Track:</strong> ${d.skill}`)}
        ${ctaButton(d.group_link, "Open Your WhatsApp Training Group →")}
      `,
    }),
  };
}

// Sends an email via Resend. NEVER throws — returns true/false and logs silently.
export async function sendEmail(to: string, content: EmailContent): Promise<boolean> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[email] RESEND_API_KEY not set — skipping send.");
      return false;
    }
    const recipient = process.env.TEST_EMAIL_OVERRIDE || to;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KR8 Digitals <noreply@regkr8digitals.com>",
        to: [recipient],
        subject: content.subject,
        html: content.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[email] Resend responded ${res.status}: ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}
