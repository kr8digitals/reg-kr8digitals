import { createServerFn } from "@tanstack/react-start";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function passwordValid(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (typeof input !== "string" || input.length !== expected.length) return false;
  // Constant-time-ish comparison
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    return { ok: passwordValid(data.password) };
  });

export const adminListMembers = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (!passwordValid(data.password)) return { status: "unauthorized" as const };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows, error } = await supabaseAdmin
        .from("members")
        .select(
          "id, full_name, email, whatsapp_number, country, age, skill_code, generated_reg_number, is_student, school_name, school_level, change_pin, reset_screenshot_url, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[admin-members] error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }

      // Sign reset-proof URLs for members that have one.
      const members = await Promise.all(
        (rows ?? []).map(async (m) => {
          let proof_url: string | null = null;
          if (m.reset_screenshot_url) {
            const { data: signed } = await supabaseAdmin.storage
              .from("reset-proofs")
              .createSignedUrl(m.reset_screenshot_url, 60 * 30);
            proof_url = signed?.signedUrl ?? null;
          }
          return { ...m, proof_url };
        }),
      );

      return { status: "ok" as const, members };
    } catch (e) {
      console.error("[admin-members] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

export const adminGetSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    if (!passwordValid(data.password)) return { status: "unauthorized" as const };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows, error } = await supabaseAdmin.from("settings").select("key, value").order("key");
      if (error) {
        console.error("[admin-settings] error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      return { status: "ok" as const, settings: rows ?? [] };
    } catch (e) {
      console.error("[admin-settings] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

export const adminUpdateSetting = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string; key: string; value: string }) => data)
  .handler(async ({ data }) => {
    if (!passwordValid(data.password)) return { status: "unauthorized" as const };
    try {
      const key = (data.key || "").trim();
      const value = (data.value || "").trim();
      if (!key.startsWith("link_")) return { status: "error" as const, message: "Invalid setting key." };
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin
        .from("settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) {
        console.error("[admin-update-setting] error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      return { status: "ok" as const };
    } catch (e) {
      console.error("[admin-update-setting] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });
