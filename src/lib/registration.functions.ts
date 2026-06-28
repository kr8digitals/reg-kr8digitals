import { createServerFn } from "@tanstack/react-start";

type Json = Record<string, unknown>;

const GENERIC_ERROR = "Something went wrong on our end. Please try again.";

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// ===================== CHECK DUPLICATE (Step 1 gate) =====================
export const checkDuplicate = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; whatsapp_number: string }) => data)
  .handler(async ({ data }) => {
    try {
      const email = clean(data.email).toLowerCase();
      const whatsapp_number = clean(data.whatsapp_number);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rpc, error } = await supabaseAdmin.rpc("check_member_exists", {
        p_email: email,
        p_phone: whatsapp_number,
      });
      if (error) {
        console.error("[check-duplicate] rpc error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      const result = rpc as Json;
      const status = result?.status as string;
      if (status === "email_exists") return { status: "email_exists" as const };
      if (status === "phone_exists") return { status: "phone_exists" as const };
      return { status: "ok" as const };
    } catch (e) {
      console.error("[check-duplicate] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

// ===================== REGISTER =====================
export const registerMember = createServerFn({ method: "POST" })
  .inputValidator((data: {
    full_name: string;
    email: string;
    whatsapp_number: string;
    date_of_birth: string;
    country: string;
    is_student: boolean;
    school_name?: string;
    school_level?: string;
    skill_code: string;
  }) => data)
  .handler(async ({ data }) => {
    try {
      const full_name = clean(data.full_name);
      const email = clean(data.email).toLowerCase();
      const whatsapp_number = clean(data.whatsapp_number);
      const date_of_birth = clean(data.date_of_birth);
      const country = clean(data.country);
      const skill_code = clean(data.skill_code).toUpperCase();
      const is_student = !!data.is_student;

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const validSkills = ["VE", "WD", "FD", "GD", "SM", "MK"];
      if (
        !full_name || !emailOk || whatsapp_number.length < 6 ||
        !date_of_birth || !country || !validSkills.includes(skill_code)
      ) {
        return { status: "error" as const, message: "Please fill in all fields correctly." };
      }
      if (is_student && (!clean(data.school_name) || !clean(data.school_level))) {
        return { status: "error" as const, message: "Please provide your school name and level." };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rpc, error } = await supabaseAdmin.rpc("register_member", {
        p: {
          full_name,
          email,
          whatsapp_number,
          date_of_birth,
          country,
          is_student,
          school_name: clean(data.school_name),
          school_level: clean(data.school_level),
          skill_code,
        },
      });

      if (error) {
        console.error("[register] rpc error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }

      const result = rpc as Json;
      const status = result?.status as string;

      if (status === "email_exists") return { status: "email_exists" as const };
      if (status === "phone_exists") return { status: "phone_exists" as const };
      if (status !== "ok") return { status: "error" as const, message: GENERIC_ERROR };

      const reg_number = result.reg_number as string;
      const skillCode = result.skill_code as string;
      const group_link = (result.group_link as string) || "";

      // Email is fire-and-forget; failure NEVER blocks registration.
      try {
        const { buildRegistrationEmail, sendEmail } = await import("@/lib/email.server");
        const { skillName } = await import("@/lib/skills");
        await sendEmail(
          email,
          buildRegistrationEmail({
            full_name,
            reg_number,
            skill: skillName(skillCode),
            group_link,
          }),
        );
      } catch (e) {
        console.error("[register] email step failed silently:", e);
      }

      return {
        status: "ok" as const,
        reg_number,
        skill_code: skillCode,
        group_link,
      };
    } catch (e) {
      console.error("[register] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

// ===================== RECOVER =====================
export const recoverRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string }) => data)
  .handler(async ({ data }) => {
    try {
      const identifier = clean(data.identifier);
      if (!identifier) return { status: "error" as const, message: "Enter your email or WhatsApp number." };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rpc, error } = await supabaseAdmin.rpc("recover_registration", { identifier });
      if (error) {
        console.error("[recover] rpc error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      const result = rpc as Json;
      if (result?.status !== "ok") return { status: "not_found" as const };

      const reg_number = result.reg_number as string;
      const skill_code = result.skill_code as string;
      const group_link = (result.group_link as string) || "";

      try {
        const { buildRecoveryEmail, sendEmail } = await import("@/lib/email.server");
        const { skillName } = await import("@/lib/skills");
        await sendEmail(
          result.email as string,
          buildRecoveryEmail({
            full_name: result.full_name as string,
            reg_number,
            skill: skillName(skill_code),
            group_link,
          }),
        );
      } catch (e) {
        console.error("[recover] email step failed silently:", e);
      }

      return { status: "ok" as const, reg_number, skill_code, group_link, full_name: result.full_name as string };
    } catch (e) {
      console.error("[recover] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

// ===================== LOOKUP FOR RESET =====================
export const getMemberForReset = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string }) => data)
  .handler(async ({ data }) => {
    try {
      const identifier = clean(data.identifier);
      if (!identifier) return { status: "error" as const, message: "Enter your email or WhatsApp number." };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rpc, error } = await supabaseAdmin.rpc("get_member_for_reset", { identifier });
      if (error) {
        console.error("[reset-lookup] rpc error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      const result = rpc as Json;
      if (result?.status !== "ok") return { status: "not_found" as const };

      return {
        status: "ok" as const,
        identifier,
        reg_number: result.reg_number as string,
        skill_code: result.skill_code as string,
      };
    } catch (e) {
      console.error("[reset-lookup] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

// ===================== UPLOAD RESET PROOF =====================
export const uploadResetProof = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string; fileBase64: string; contentType: string }) => data)
  .handler(async ({ data }) => {
    try {
      const identifier = clean(data.identifier);
      const { fileBase64, contentType } = data;
      if (!identifier || !fileBase64 || !contentType?.startsWith("image/")) {
        return { status: "error" as const, message: "Please upload a valid image." };
      }

      const b64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      const bytes = Buffer.from(b64, "base64");
      if (bytes.length > 6 * 1024 * 1024) {
        return { status: "error" as const, message: "Image is too large (max 6MB)." };
      }

      const ext = contentType.split("/")[1] || "png";
      const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.storage
        .from("reset-proofs")
        .upload(path, bytes, { contentType, upsert: false });

      if (error) {
        console.error("[upload-proof] storage error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      return { status: "ok" as const, path };
    } catch (e) {
      console.error("[upload-proof] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });

// ===================== RESET REGISTRATION =====================
export const resetRegistration = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string; new_skill_code: string; screenshot_url: string }) => data)
  .handler(async ({ data }) => {
    try {
      const identifier = clean(data.identifier);
      const new_skill_code = clean(data.new_skill_code).toUpperCase();
      const screenshot_url = clean(data.screenshot_url);
      const validSkills = ["VE", "WD", "FD", "GD", "SM", "MK"];
      if (!identifier || !validSkills.includes(new_skill_code) || !screenshot_url) {
        return { status: "error" as const, message: "Missing required information for reset." };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rpc, error } = await supabaseAdmin.rpc("reset_registration", {
        identifier,
        new_skill_code,
        screenshot_url,
      });
      if (error) {
        console.error("[reset] rpc error:", error);
        return { status: "error" as const, message: GENERIC_ERROR };
      }
      const result = rpc as Json;
      if (result?.status !== "ok") return { status: "not_found" as const };

      const old_reg_number = result.old_reg_number as string;
      const reg_number = result.reg_number as string;
      const skill_code = result.skill_code as string;
      const group_link = (result.group_link as string) || "";

      try {
        const { buildResetEmail, sendEmail } = await import("@/lib/email.server");
        const { skillName } = await import("@/lib/skills");
        await sendEmail(
          result.email as string,
          buildResetEmail({
            full_name: result.full_name as string,
            old_reg_number,
            reg_number,
            skill: skillName(skill_code),
            group_link,
          }),
        );
      } catch (e) {
        console.error("[reset] email step failed silently:", e);
      }

      return { status: "ok" as const, old_reg_number, reg_number, skill_code, group_link };
    } catch (e) {
      console.error("[reset] fatal:", e);
      return { status: "error" as const, message: GENERIC_ERROR };
    }
  });
