import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

export function RegNumberBox({ regNumber, strike = false }: { regNumber: string; strike?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(regNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-cyan">
        Your KR8 Identity Number
      </p>
      <div className="reg-box">
        <span className="reg-number" style={strike ? { textDecoration: "line-through", opacity: 0.6 } : undefined}>
          {regNumber}
        </span>
      </div>
      {!strike ? (
        <button type="button" onClick={copy} className="btn-base btn-ghost mx-auto mt-3 flex text-sm">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy Identity Number"}
        </button>
      ) : null}
    </div>
  );
}

export function WhatsAppButton({ link, label = "Join Your WhatsApp Group" }: { link: string; label?: string }) {
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="btn-base btn-whatsapp mt-4">
      <MessageCircle size={20} />
      {label}
    </a>
  );
}
