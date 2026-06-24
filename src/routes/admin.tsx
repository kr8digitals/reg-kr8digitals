import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Lock, Users, Settings as SettingsIcon, ExternalLink, Save } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { ErrorAlert, SuccessAlert } from "@/components/Alerts";
import { skillName, SKILLS } from "@/lib/skills";
import { adminLogin, adminListMembers, adminGetSettings, adminUpdateSetting } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — KR8 Digitals" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

interface Member {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  country: string;
  age: number;
  skill_code: string;
  generated_reg_number: string;
  is_student: boolean;
  school_name: string | null;
  school_level: string | null;
  change_pin: string;
  reset_screenshot_url: string | null;
  proof_url: string | null;
  created_at: string;
}

function Admin() {
  const login = useServerFn(adminLogin);
  const listMembers = useServerFn(adminListMembers);
  const getSettings = useServerFn(adminGetSettings);
  const updateSetting = useServerFn(adminUpdateSetting);

  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"members" | "settings">("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [savedKey, setSavedKey] = useState("");

  async function loadAll(pw: string) {
    const [m, s] = await Promise.all([listMembers({ data: { password: pw } }), getSettings({ data: { password: pw } })]);
    if (m.status === "ok") setMembers(m.members as Member[]);
    if (s.status === "ok") setSettings(s.settings);
  }

  async function handleLogin() {
    setError("");
    setLoading(true);
    const res = await login({ data: { password } });
    if (!res.ok) {
      setLoading(false);
      setError("Incorrect password.");
      return;
    }
    await loadAll(password);
    setLoading(false);
    setAuthed(true);
  }

  async function saveSetting(key: string, value: string) {
    setSavedKey("");
    const res = await updateSetting({ data: { password, key, value } });
    if (res.status === "ok") {
      setSavedKey(key);
      setTimeout(() => setSavedKey(""), 2000);
    } else {
      setError("status" in res && res.status === "unauthorized" ? "Session expired." : "Could not save link.");
    }
  }

  if (!authed) {
    return (
      <PageShell maxWidth="max-w-md">
        <div className="glow-card">
          <div className="flex items-center gap-2">
            <Lock className="text-gold" />
            <h1 className="text-2xl font-extrabold text-foreground">Admin Access</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Restricted area. Enter the admin password.</p>

          {error ? (
            <div className="mt-5">
              <ErrorAlert>{error}</ErrorAlert>
            </div>
          ) : null}

          <div className="mt-5">
            <label className="kr8-label">Password</label>
            <input
              className="kr8-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
            />
          </div>
          <button type="button" onClick={handleLogin} disabled={loading} className="btn-base btn-primary mt-6 w-full">
            {loading ? <Spinner /> : "Enter Dashboard"}
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-5xl" logoSize={70}>
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("members")}
          className={`btn-base text-sm ${tab === "members" ? "btn-primary" : "btn-ghost"}`}
          style={tab === "members" ? { animation: "none" } : undefined}
        >
          <Users size={16} /> Members ({members.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`btn-base text-sm ${tab === "settings" ? "btn-primary" : "btn-ghost"}`}
          style={tab === "settings" ? { animation: "none" } : undefined}
        >
          <SettingsIcon size={16} /> Group Links
        </button>
      </div>

      {error ? (
        <div className="mb-5">
          <ErrorAlert>{error}</ErrorAlert>
        </div>
      ) : null}

      {tab === "members" ? (
        <div className="glow-card overflow-x-auto">
          <h2 className="mb-4 text-xl font-extrabold text-foreground">Registered Members</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Phone</th>
                  <th className="py-2 pr-3">Country</th>
                  <th className="py-2 pr-3">Age</th>
                  <th className="py-2 pr-3">Skill</th>
                  <th className="py-2 pr-3">Reg Number</th>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Change PIN</th>
                  <th className="py-2 pr-3">Proof</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 text-foreground">{m.full_name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{m.email}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{m.whatsapp_number}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{m.country}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{m.age}</td>
                    <td className="py-2 pr-3 text-cyan">{skillName(m.skill_code)}</td>
                    <td className="py-2 pr-3 font-mono text-gold">{m.generated_reg_number}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {m.is_student ? `${m.school_name ?? ""} (${m.school_level ?? ""})` : "No"}
                    </td>
                    <td className="py-2 pr-3 font-mono text-accent">{m.change_pin}</td>
                    <td className="py-2 pr-3">
                      {m.proof_url ? (
                        <a
                          href={m.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan"
                        >
                          View <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="glow-card">
          <h2 className="mb-4 text-xl font-extrabold text-foreground">WhatsApp Group Links</h2>
          <div className="space-y-5">
            {SKILLS.map((s) => {
              const key = `link_${s.code}`;
              const current = settings.find((x) => x.key === key)?.value ?? "";
              return (
                <SettingRow
                  key={key}
                  label={`${s.emoji} ${s.name} (${s.code})`}
                  settingKey={key}
                  value={current}
                  saved={savedKey === key}
                  onSave={saveSetting}
                />
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function SettingRow({
  label,
  settingKey,
  value,
  saved,
  onSave,
}: {
  label: string;
  settingKey: string;
  value: string;
  saved: boolean;
  onSave: (key: string, value: string) => void;
}) {
  const [val, setVal] = useState(value);
  return (
    <div>
      <label className="kr8-label">{label}</label>
      <div className="flex gap-2">
        <input className="kr8-input flex-1" value={val} onChange={(e) => setVal(e.target.value)} />
        <button type="button" onClick={() => onSave(settingKey, val)} className="btn-base btn-secondary shrink-0">
          <Save size={16} /> Save
        </button>
      </div>
      {saved ? (
        <div className="mt-2">
          <SuccessAlert>Link saved.</SuccessAlert>
        </div>
      ) : null}
    </div>
  );
}
