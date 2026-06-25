import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { ErrorAlert } from "@/components/Alerts";
import { RegNumberBox, WhatsAppButton } from "@/components/RegResult";
import { skillName } from "@/lib/skills";
import { recoverRegistration } from "@/lib/registration.functions";

export const Route = createFileRoute("/recover")({
  head: () => ({
    meta: [
      { title: "Recover Your Reg Number — KR8 Digitals" },
      { name: "description", content: "Retrieve your KR8 Registration Number and your skill group link using your email or WhatsApp number." },
      { property: "og:title", content: "Recover Your Reg Number — KR8 Digitals" },
      { property: "og:description", content: "Lost your KR8 Registration Number? Retrieve it and your skill group link in seconds." },
      { property: "og:url", content: "https://reg-kr8digitals.lovable.app/recover" },
    ],
    links: [{ rel: "canonical", href: "https://reg-kr8digitals.lovable.app/recover" }],
  }),
  component: Recover,
});

function Recover() {
  const recover = useServerFn(recoverRegistration);
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reg_number: string; group_link: string; skill_code: string } | null>(null);

  async function handle() {
    setError("");
    if (!identifier.trim()) {
      setError("Enter your email or WhatsApp number.");
      return;
    }
    setLoading(true);
    const res = await recover({ data: { identifier } });
    setLoading(false);
    if (res.status === "ok") {
      setResult({ reg_number: res.reg_number, group_link: res.group_link, skill_code: res.skill_code });
      return;
    }
    if (res.status === "not_found") {
      setError("We couldn't find a registration with those details. Check and try again, or sign up.");
      return;
    }
    setError(("message" in res && res.message) || "Something went wrong. Please try again.");
  }

  return (
    <PageShell>
      {!result ? (
        <div className="glow-card slide-in">
          <h1 className="text-2xl font-extrabold text-foreground">Recover Reg Number</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email or WhatsApp number you registered with.
          </p>

          {error ? (
            <div className="mt-5">
              <ErrorAlert>{error}</ErrorAlert>
            </div>
          ) : null}

          <div className="mt-5">
            <label className="kr8-label">Email or WhatsApp Number</label>
            <input
              className="kr8-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@email.com or +234..."
            />
          </div>

          <button type="button" onClick={handle} disabled={loading} className="btn-base btn-primary mt-6 w-full">
            {loading ? <Spinner /> : "Find My Reg Number"}
          </button>
          <Link to="/signin" className="btn-base btn-ghost mt-3 w-full text-sm">
            Back
          </Link>
        </div>
      ) : (
        <div className="glow-card slide-in text-center">
          <h1 className="text-2xl font-extrabold gradient-text-gc">Found it. 🔍</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Here's your KR8 Reg Number. Screenshot it and keep it safe.
          </p>
          <div className="mt-6">
            <RegNumberBox regNumber={result.reg_number} />
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Skill track: <span className="font-semibold text-cyan">{skillName(result.skill_code)}</span>
          </p>
          <WhatsAppButton link={result.group_link} label="Open Your WhatsApp Group" />
          <Link to="/" className="btn-base btn-ghost mt-4 w-full text-sm">
            Done
          </Link>
        </div>
      )}
    </PageShell>
  );
}
