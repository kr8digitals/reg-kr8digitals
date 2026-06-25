import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign In — KR8 Digitals" },
      { name: "description", content: "Recover your KR8 Reg Number or reset your registration track." },
      { property: "og:title", content: "Sign In — KR8 Digitals" },
      { property: "og:description", content: "Already registered? Recover your KR8 Reg Number or switch your skill track." },
      { property: "og:url", content: "https://reg-kr8digitals.lovable.app/signin" },
    ],
    links: [{ rel: "canonical", href: "https://reg-kr8digitals.lovable.app/signin" }],
  }),
  component: SignIn,
});

function SignIn() {
  return (
    <PageShell>
      <div className="glow-card">
        <h1 className="text-2xl font-extrabold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">What would you like to do?</p>

        <div className="mt-6 space-y-4">
          <Link to="/recover" className="feature-card accent-cyan block">
            <div className="flex items-center gap-3">
              <Search className="shrink-0 text-cyan" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Recover Reg Number</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get your KR8 Reg Number and skill group link back.
                </p>
              </div>
            </div>
          </Link>

          <Link to="/reset" className="feature-card accent-magenta block">
            <div className="flex items-center gap-3">
              <RefreshCw className="shrink-0 text-accent" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Reset Registration</h3>
                <p className="mt-1 text-sm text-muted-foreground">Switch to a different skill track.</p>
              </div>
            </div>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Not registered yet?{" "}
          <Link to="/signup" className="font-semibold text-cyan">
            Claim your spot
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
