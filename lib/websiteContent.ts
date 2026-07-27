import { supabase } from "@/lib/supabase/client";
import { WebsiteContentEntry, WebsiteContentType } from "@/lib/shared/types/public";

const TABLE = "website_content";

export async function readWebsiteContent(
  sectionKey: string
): Promise<WebsiteContentEntry | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("section_key", sectionKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[readWebsiteContent]", error);
    return null;
  }

  return data;
}

export async function writeWebsiteContent(
  sectionKey: string,
  value: string | Record<string, unknown> | Array<unknown>,
  contentType: WebsiteContentType = "json"
) {
  const content_value =
    typeof value === "string" ? value : JSON.stringify(value);

  const payload = {
    section_key: sectionKey,
    content_type: contentType,
    content_value,
    is_active: true,
    display_order: 0,
  };

  // Upsert requires section_key to be UNIQUE in Supabase
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(payload, {
      onConflict: "section_key",
    })
    .select()
    .single();

  if (error) {
    console.log("SUPABASE WRITE ERROR");
  console.log("message:", error.message);
  console.log("details:", error.details);
  console.log("hint:", error.hint);
  console.log("code:", error.code);
    throw error;
  }

  return data;
}

export async function readWebsiteContentValue<T = unknown>(
  sectionKey: string,
  fallback?: T
): Promise<T | undefined> {
  const entry = await readWebsiteContent(sectionKey);

  if (!entry) return fallback;

  if (entry.content_type === "json") {
    try {
      return JSON.parse(entry.content_value) as T;
    } catch {
      return fallback;
    }
  }

  return entry.content_value as T;
}

export async function readWebsiteContentJson<T = unknown>(
  sectionKey: string,
  fallback?: T
): Promise<T | undefined> {
  return readWebsiteContentValue(sectionKey, fallback);
}

export async function writeWebsiteContentJson(
  sectionKey: string,
  value: Record<string, unknown> | Array<unknown>
) {
  return writeWebsiteContent(sectionKey, value, "json");
}