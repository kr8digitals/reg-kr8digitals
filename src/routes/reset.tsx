import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { ErrorAlert, SuccessAlert } from "@/components/Alerts";
import { SkillCard } from "@/components/SkillCard";
import { RegNumberBox, WhatsAppButton } from "@/components/RegResult";
import { SKILLS, skillName } from "@/lib/skills";
import { getMemberForReset, uploadResetProof, resetRegistration } from "@/lib/registration.functions";

export const Route = createFileRoute("/reset")({
  head: () => ({
    meta: [
      { title: "Reset Registration — KR8 Digitals" },
      { name: "description", content: "Switch your KR8 Digitals skill track." },
    ],
  }),
  component: Reset,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Reset() {
  const lookup = useServerFn(getMemberForReset);
  const upload = useServerFn(uploadResetProof);
  const doReset = useServerFn(resetRegistration);

  const [stage, setStage] = useState<"lookup" | "form" | "done">("lookup");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [member, setMember] = useState<{ reg_number: string; skill_code: string } | null>(null);
  const [skill, setSkill] = useState("");
  const [proofPath, setProofPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [final, setFinal] = useState<{
    old_reg_number: string;
    reg_number: string;
    group_link: string;
    skill_code: string;
  } | null>(null);

  async function handleLookup() {
    setError("");
    if (!identifier.trim()) {
      setError("Enter your email or WhatsApp number.");
      return;
    }
    setLoading(true);
    const res = await lookup({ data: { identifier } });
    setLoading(false);
    if (res.status === "ok") {
      setMember({ reg_number: res.reg_number, skill_code: res.skill_code });
      setStage("form");
      return;
    }
    if (res.status === "not_found") {
      setError("No registration found with those details.");
      return;
    }
    setError(("message" in res && res.message) || "Something went wrong. Please try again.");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await upload({ data: { identifier, fileBase64: b64, contentType: file.type } });
      if (res.status === "ok") {
        setProofPath(res.path);
      } else {
        setError(("message" in res && res.message) || "Upload failed. Try again.");
      }
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    if (!proofPath) {
      setError("Please upload a screenshot proving you left your current group.");
      return;
    }
    if (!skill) {
      setError("Select your new skill.");
      return;
    }
    setLoading(true);
    const res = await doReset({ data: { identifier, new_skill_code: skill, screenshot_url: proofPath } });
    setLoading(false);
    if (res.status === "ok") {
      setFinal({
        old_reg_number: res.old_reg_number,
        reg_number: res.reg_number,
        group_link: res.group_link,
        skill_code: res.skill_code,
      });
      setStage("done");
      return;
    }
    setError(("message" in res && res.message) || "Something went wrong. Please try again.");
  }

  return (
    <PageShell>
      {error ? (
        <div className="mb-5">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      ) : null}

      {stage === "lookup" ? (
        <div className="glow-card slide-in">
          <h1 className="text-2xl font-extrabold text-foreground">Reset Registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the email or WhatsApp number you registered with.
          </p>
          <div className="mt-5">
            <label className="kr8-label">Email or WhatsApp Number</label>
            <input
              className="kr8-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@email.com or +234..."
            />
          </div>
          <button type="button" onClick={handleLookup} disabled={loading} className="btn-base btn-primary mt-6 w-full">
            {loading ? <Spinner /> : "Continue"}
          </button>
          <Link to="/signin" className="btn-base btn-ghost mt-3 w-full text-sm">
            Back
          </Link>
        </div>
      ) : null}

      {stage === "form" && member ? (
        <div className="glow-card slide-in">
          <h1 className="text-2xl font-extrabold text-foreground">Reset your track</h1>

          <div className="mt-5 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Current registration</p>
            <p className="mt-1 font-mono text-sm font-bold text-gold">{member.reg_number}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Skill: <span className="font-semibold text-cyan">{skillName(member.skill_code)}</span>
            </p>
          </div>

          <div className="mt-5">
            <ErrorAlert>
              <span className="font-semibold text-foreground">Before you reset:</span> You must exit your current
              WhatsApp group before resetting your registration.
            </ErrorAlert>
          </div>

          <div className="mt-5">
            <label className="kr8-label">Upload screenshot proving you left the group</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-base btn-ghost w-full"
            >
              {uploading ? <Spinner /> : <UploadCloud size={18} />}
              {uploading ? "Uploading..." : proofPath ? "Replace screenshot" : "Choose screenshot"}
            </button>
            {proofPath ? (
              <div className="mt-3">
                <SuccessAlert>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Screenshot uploaded.
                  </span>
                </SuccessAlert>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <p className="kr8-label">Select your new skill</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SKILLS.map((s) => (
                <SkillCard key={s.code} skill={s} selected={skill === s.code} onSelect={() => setSkill(s.code)} />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !proofPath || !skill}
            className="btn-base btn-primary mt-7 w-full"
          >
            {loading ? <Spinner /> : "Confirm Reset"}
          </button>
          <button type="button" onClick={() => setStage("lookup")} className="btn-base btn-ghost mt-3 w-full text-sm">
            Back
          </button>
        </div>
      ) : null}

      {stage === "done" && final ? (
        <div className="glow-card slide-in text-center">
          <h1 className="text-3xl font-extrabold gradient-text-gc">Registration Updated. 🔄</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Your skill track has been switched. Here are your updated details.
          </p>

          <div className="mt-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Previous Reg Number
            </p>
            <RegNumberBox regNumber={final.old_reg_number} strike />
          </div>

          <div className="mt-6">
            <RegNumberBox regNumber={final.reg_number} />
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            New skill track: <span className="font-semibold text-cyan">{skillName(final.skill_code)}</span>
          </p>

          <div className="mt-4">
            <ErrorAlert>
              Make sure you have already left your previous group before joining the new one.
            </ErrorAlert>
          </div>

          <WhatsAppButton link={final.group_link} label="Join Your New WhatsApp Group" />
          <Link to="/" className="btn-base btn-ghost mt-4 w-full text-sm">
            Done
          </Link>
        </div>
      ) : null}
    </PageShell>
  );
}
