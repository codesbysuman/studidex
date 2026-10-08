// lib/core/validate.ts
import { ExternalImportEnvelope, ValidationResult } from "./types";

const VALID_ITEM_TYPES = new Set(["event", "action", "update", "opportunity"]);
const VALID_MATERIAL_TYPES = new Set([
    "note",
    "pdf",
    "document",
    "syllabus",
    "pyq",
    "mock_test",
    "sample_paper",
    "handout",
    "reference",
    "link",
    "image",
    "other",
]);

/**
 * Validates external AI JSON input against Studidex import protocol
 */
export function validateImportJson(rawInput: string | unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let parsed: any;

    if (typeof rawInput === "string") {
        const trimmed = rawInput.trim();
        if (!trimmed) {
            return {
                valid: false,
                errors: ["Input is empty. Please paste valid Studidex JSON."],
                warnings: [],
            };
        }
        try {
            parsed = JSON.parse(trimmed);
        } catch (e: any) {
            return {
                valid: false,
                errors: [`Invalid JSON syntax: ${e.message || "Failed to parse JSON"}`],
                warnings: [],
            };
        }
    } else {
        parsed = rawInput;
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {
            valid: false,
            errors: ["Import payload must be a JSON object, not an array or primitive."],
            warnings: [],
        };
    }

    // Normalize empty arrays/objects if missing
    const envelope: ExternalImportEnvelope = {
        version: typeof parsed.version === "number" ? parsed.version : 1,
        input: parsed.input && typeof parsed.input === "object" ? parsed.input : undefined,
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        items: Array.isArray(parsed.items) ? parsed.items : [],
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
    };

    if (
        (!envelope.items || envelope.items.length === 0) &&
        (!envelope.materials || envelope.materials.length === 0) &&
        (!envelope.subjects || envelope.subjects.length === 0)
    ) {
        warnings.push("Payload contains no academic items, materials, or subjects.");
    }

    // Validate Items
    if (envelope.items && envelope.items.length > 0) {
        envelope.items.forEach((item, idx) => {
            if (!item || typeof item !== "object") {
                errors.push(`Item #${idx + 1} must be an object.`);
                return;
            }
            if (!item.title || typeof item.title !== "string" || item.title.trim() === "") {
                errors.push(`Item #${idx + 1} is missing a required 'title'.`);
            }
            if (!item.type || typeof item.type !== "string") {
                errors.push(`Item #${idx + 1} ("${item.title || "Untitled"}") is missing a required 'type'.`);
            } else {
                const normType = item.type.toLowerCase().trim();
                if (!VALID_ITEM_TYPES.has(normType)) {
                    warnings.push(
                        `Item #${idx + 1} ("${item.title}") has non-standard type "${item.type}". It will be mapped to "update".`
                    );
                }
            }

            // Check dates if provided
            if (item.startAt && isNaN(Date.parse(item.startAt))) {
                warnings.push(`Item "${item.title || idx + 1}" has invalid startAt date: "${item.startAt}"`);
            }
            if (item.endAt && isNaN(Date.parse(item.endAt))) {
                warnings.push(`Item "${item.title || idx + 1}" has invalid endAt date: "${item.endAt}"`);
            }
            if (item.dueAt && isNaN(Date.parse(item.dueAt))) {
                warnings.push(`Item "${item.title || idx + 1}" has invalid dueAt date: "${item.dueAt}"`);
            }
        });
    }

    // Validate Materials
    if (envelope.materials && envelope.materials.length > 0) {
        envelope.materials.forEach((mat, idx) => {
            if (!mat || typeof mat !== "object") {
                errors.push(`Material #${idx + 1} must be an object.`);
                return;
            }
            if (!mat.title || typeof mat.title !== "string" || mat.title.trim() === "") {
                errors.push(`Material #${idx + 1} is missing a required 'title'.`);
            }
            if (mat.type && typeof mat.type === "string") {
                const normType = mat.type.toLowerCase().trim();
                if (!VALID_MATERIAL_TYPES.has(normType)) {
                    warnings.push(
                        `Material #${idx + 1} ("${mat.title}") has custom type "${mat.type}". It will be mapped to "other".`
                    );
                }
            }
        });
    }

    // Input provenance warning
    if (!envelope.input || !envelope.input.content) {
        warnings.push("No original input message preserved. Provenance tracking will be minimal.");
    }

    const isValid = errors.length === 0;

    return {
        valid: isValid,
        errors,
        warnings,
        summary: {
            subjectsCount: envelope.subjects?.length || 0,
            topicsCount: envelope.topics?.length || 0,
            itemsCount: envelope.items?.length || 0,
            materialsCount: envelope.materials?.length || 0,
            hasInputProvenance: Boolean(envelope.input?.content),
        },
        normalizedPayload: isValid ? envelope : undefined,
    };
}
