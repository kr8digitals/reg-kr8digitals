import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KR8 Digitals — Not Everyone Gets This Opportunity" },
      {
        name: "description",
        content:
          "You've been selected to build real digital skills with Africa's fastest-growing creator community. Free training. Real mentors. Real outcomes.",
      },
      { property: "og:title", content: "KR8 Digitals — Access · Invitation Only" },
      {
        property: "og:description",
        content: "Claim your free spot in KR8 Digitals' digital skills training programme.",
      },
      { property: "og:image", content: "/logo.png" },
      { name: "twitter:image", content: "/logo.png" },
    ],
  }),
  component: Landing,
});

function FeatureCard({
  accent,
  title,
  body,
}: {
  accent: "cyan" | "gold" | "magenta";
  title: string;
  body: string;
}) {
  return (
    <div className={`feature-card accent-${accent}`}>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="bg-space w-full">
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-20 pt-12 text-center sm:pt-16">
        {/* Hero */}
        <div className="fade-in flex flex-col items-center">
          <Logo size={150} withLink={false} />

          <div className="mt-7">
            <span className="access-badge">ACCESS · INVITATION ONLY</span>
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            Not everyone gets <span className="gradient-text-cm">this opportunity.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            You've been selected to build real digital skills with Africa's fastest-growing creator
            community. Free training. Real mentors. Real outcomes.
          </p>

          <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/signup" className="btn-base btn-primary flex-1">
              Sign Up — Claim Your Spot
            </Link>
            <Link to="/signin" className="btn-base btn-secondary flex-1">
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid w-full gap-4 sm:mt-20 sm:grid-cols-3">
          <FeatureCard
            accent="cyan"
            title="Chosen, not crowded"
            body="A curated community of builders, not a free-for-all."
          />
          <FeatureCard
            accent="gold"
            title="One skill. Mastered."
            body="Pick the lane you want to win in. Go deep."
          />
          <FeatureCard
            accent="magenta"
            title="Proof of access"
            body="Your KR8 Unique ID is your key. Guard it."
          />
        </div>

        <p className="mt-14 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          KR8 Digitals — Think it, create it.
        </p>
      </main>
    </div>
  );
}
