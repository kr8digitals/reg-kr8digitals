import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { StepIndicator } from "@/components/StepIndicator";
import { SkillCard } from "@/components/SkillCard";
import { Spinner } from "@/components/Spinner";
import { ErrorAlert } from "@/components/Alerts";
import { Confetti } from "@/components/Confetti";
import { RegNumberBox, WhatsAppButton } from "@/components/RegResult";
import { SKILLS, skillName } from "@/lib/skills";
import { COUNTRIES } from "@/lib/countries";
import { checkDuplicate, registerMember } from "@/lib/registration.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Claim Your Spot — KR8 Digitals" },
      { name: "description", content: "Complete your registration for free KR8 Digitals skills training and choose your skill track." },
      { property: "og:title", content: "Claim Your Spot — KR8 Digitals" },
      { property: "og:description", content: "Register for free KR8 Digitals skills training and pick the one skill you want to master." },
      { property: "og:url", content: "https://reg-kr8digitals.lovable.app/signup" },
    ],
    links: [{ rel: "canonical", href: "https://reg-kr8digitals.lovable.app/signup" }],
  }),
  component: SignUp,
});

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

interface Form {
  fullName: string;
  email: string;
  whatsapp: string;
  dob: string;
  country: string;
  isStudent: boolean;
  schoolName: string;
  schoolLevel: string;
}

function SignUp() {
  const router = useRouter();
  const checkDup = useServerFn(checkDuplicate);
  const register = useServerFn(registerMember);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>({
    fullName: "",
    email: "",
    whatsapp: "",
    dob: "",
    country: "",
    isStudent: false,
    schoolName: "",
    schoolLevel: "",
  });
  const [skill, setSkill] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [dupKind, setDupKind] = useState<"email" | "phone" | "">("");
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<{ reg_number: string; group_link: string; skill_code: string } | null>(null);

  const age = useMemo(() => calcAge(form.dob), [form.dob]);
  const regYear = new Date().getFullYear();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const step1Valid =
    form.fullName.trim() &&
    emailValid &&
    form.whatsapp.trim().length >= 6 &&
    form.dob &&
    age !== null &&
    form.country &&
    (!form.isStudent || (form.schoolName.trim() && form.schoolLevel.trim()));

  async function handleStep1() {
    setError("");
    setDupKind("");
    if (!step1Valid) {
      setError("Please complete every field correctly before continuing.");
      return;
    }
    setLoading(true);
    const res = await checkDup({ data: { email: form.email, whatsapp_number: form.whatsapp } });
    setLoading(false);
    if (res.status === "email_exists") {
      setDupKind("email");
      return;
    }
    if (res.status === "phone_exists") {
      setDupKind("phone");
      return;
    }
    if (res.status === "error") {
      setError(res.message);
      return;
    }
    setStep(2);
  }

  async function handleSubmit() {
    setError("");
    if (!skill) {
      setError("Select one skill to continue.");
      return;
    }
    setLoading(true);
    const res = await register({
      data: {
        full_name: form.fullName,
        email: form.email,
        whatsapp_number: form.whatsapp,
        date_of_birth: form.dob,
        country: form.country,
        is_student: form.isStudent,
        school_name: form.schoolName,
        school_level: form.schoolLevel,
        skill_code: skill,
      },
    });
    setLoading(false);

    if (res.status === "ok") {
      setResult({ reg_number: res.reg_number, group_link: res.group_link, skill_code: res.skill_code });
      setStep(3);
      return;
    }
    if (res.status === "email_exists") {
      setDupKind("email");
      setStep(1);
      return;
    }
    if (res.status === "phone_exists") {
      setDupKind("phone");
      setStep(1);
      return;
    }
    setError(("message" in res && res.message) || "Something went wrong. Please try again.");
  }

  return (
    <PageShell>
      <h1 className="sr-only">Join KR8 Digitals — Free Digital Skills Registration</h1>
      {step < 3 ? <StepIndicator current={step} total={3} /> : null}

      {dupKind ? (
        <div className="mb-5">
          <ErrorAlert>
            <p className="font-semibold text-foreground">
              {dupKind === "email"
                ? "This email is already registered."
                : "This phone number is already in our system."}
            </p>
            <p className="mt-1">Please Sign In instead.</p>
            <Link to="/signin" className="btn-base btn-secondary mt-3 text-sm">
              Go to Sign In
            </Link>
          </ErrorAlert>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      ) : null}

      {/* STEP 1 */}
      {step === 1 ? (
        <div key="s1" className="glow-card slide-in">
          <h2 className="text-2xl font-extrabold text-foreground">Personal details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us who's claiming this spot.</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="kr8-label">Full Name</label>
              <input
                className="kr8-input"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="kr8-label">Email</label>
              <input
                className="kr8-input"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="kr8-label">WhatsApp Number</label>
              <input
                className="kr8-input"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="+234..."
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="kr8-label">Date of Birth</label>
              <input
                className="kr8-input"
                type="date"
                value={form.dob}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => set("dob", e.target.value)}
              />
              {age !== null ? <p className="mt-1.5 text-sm font-semibold text-cyan">Age: {age}</p> : null}
            </div>
            <div>
              <label className="kr8-label">Country</label>
              <select className="kr8-input" value={form.country} onChange={(e) => set("country", e.target.value)}>
                <option value="">Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="kr8-label">Are you a student?</label>
              <div className="flex gap-3">
                {[
                  { label: "Yes", val: true },
                  { label: "No", val: false },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => set("isStudent", o.val)}
                    className={`btn-base flex-1 ${form.isStudent === o.val ? "btn-primary" : "btn-ghost"}`}
                    style={form.isStudent === o.val ? { animation: "none" } : undefined}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {form.isStudent ? (
              <div className="space-y-5 fade-in">
                <div>
                  <label className="kr8-label">School Name</label>
                  <input
                    className="kr8-input"
                    value={form.schoolName}
                    onChange={(e) => set("schoolName", e.target.value)}
                    placeholder="Your school / institution"
                  />
                </div>
                <div>
                  <label className="kr8-label">Current Level</label>
                  <input
                    className="kr8-input"
                    value={form.schoolLevel}
                    onChange={(e) => set("schoolLevel", e.target.value)}
                    placeholder="e.g. SS1, Year 2, 100L"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="kr8-label">Registration Year</label>
              <input className="kr8-input" value={regYear} disabled readOnly />
            </div>
          </div>

          <button type="button" onClick={handleStep1} disabled={loading} className="btn-base btn-primary mt-7 w-full">
            {loading ? <Spinner /> : "Continue to Skill Selection"}
          </button>
          <Link to="/" className="btn-base btn-ghost mt-3 w-full text-sm">
            Back home
          </Link>
        </div>
      ) : null}

      {/* STEP 2 */}
      {step === 2 ? (
        <div key="s2" className="slide-in">
          <div className="glow-card">
            <h2 className="text-2xl font-extrabold text-foreground">Pick one skill</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the single lane you want to master. You can only select one.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {SKILLS.map((s) => (
                <SkillCard key={s.code} skill={s} selected={skill === s.code} onSelect={() => setSkill(s.code)} />
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !skill}
              className="btn-base btn-primary mt-7 w-full"
            >
              {loading ? <Spinner /> : "Secure My Spot"}
            </button>
            <button type="button" onClick={() => setStep(1)} className="btn-base btn-ghost mt-3 w-full text-sm">
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* STEP 3 — SUCCESS */}
      {step === 3 && result ? (
        <div key="s3" className="slide-in">
          <Confetti />
          <div className="glow-card text-center">
            <h2 className="text-4xl font-extrabold gradient-text-gc">Access Granted. 🔓</h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Your free training spot has been secured. This is your KR8 Reg Number — it's your proof of access.
              Screenshot it, guard it.
            </p>

            <div className="mt-7">
              <RegNumberBox regNumber={result.reg_number} />
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Your skill track: <span className="font-semibold text-cyan">{skillName(result.skill_code)}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              Tap below to join your skill group and begin your journey.
            </p>

            <WhatsAppButton link={result.group_link} label="Join Your WhatsApp Training Group" />

            <button
              type="button"
              onClick={() => router.navigate({ to: "/" })}
              className="btn-base btn-ghost mt-4 w-full text-sm"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
