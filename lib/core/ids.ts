// lib/core/ids.ts

/**
 * Clean slugify for name matching & deterministic fallback keys
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Generate a clean, typed ID for Studidex entities
 */
export function generateId(prefix: "subj" | "top" | "inp" | "item" | "mat" | "att" | "paper" = "item"): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${randomPart}`;
}

/**
 * Deterministic subject ID from subject name to avoid redundant subjects
 */
export function subjectIdFromName(name: string): string {
    const slug = slugify(name);
    return `subj_${slug}`;
}

/**
 * Deterministic topic ID from subject and topic name
 */
export function topicIdFromName(subjectId: string, topicName: string): string {
    const slug = slugify(topicName);
    return `top_${subjectId.replace("subj_", "")}_${slug}`;
}
