// lib/core/normalize.ts
import {
    AcademicItem,
    ExternalImportEnvelope,
    InputProvenance,
    ItemType,
    Material,
    MaterialOrigin,
    MaterialType,
    Priority,
    StudidexState,
    Subject,
    Topic,
} from "./types";
import { generateId, slugify, subjectIdFromName, topicIdFromName } from "./ids";

export interface NormalizedImportResult {
    inputProvenance?: InputProvenance;
    newSubjects: Subject[];
    newTopics: Topic[];
    newItems: AcademicItem[];
    newMaterials: Material[];
    mergedState: StudidexState;
}

/**
 * Normalizes validated external AI payload into canonical Studidex entities
 * and merges them cleanly without duplication.
 */
export function normalizeAndMerge(
    currentState: StudidexState,
    envelope: ExternalImportEnvelope
): NormalizedImportResult {
    const existingSubjects = [...currentState.subjects];
    const existingTopics = [...currentState.topics];
    const existingItems = [...currentState.items];
    const existingMaterials = [...currentState.materials];
    const existingInputs = [...currentState.inputs];

    const addedSubjects: Subject[] = [];
    const addedTopics: Topic[] = [];
    const addedItems: AcademicItem[] = [];
    const addedMaterials: Material[] = [];

    // 1. Process Input Provenance
    let inputProvenance: InputProvenance | undefined;
    if (envelope.input && envelope.input.content) {
        inputProvenance = {
            id: generateId("inp"),
            type: (envelope.input.type as any) || "message",
            source: {
                type: (envelope.input.source?.type as any) || "other",
                name: envelope.input.source?.name || "Imported Source",
            },
            content: envelope.input.content,
            createdAt: new Date().toISOString(),
        };
        existingInputs.unshift(inputProvenance);
    }

    // 2. Helper: Find or Create Subject
    const subjectNameToIdMap = new Map<string, string>();
    for (const s of existingSubjects) {
        subjectNameToIdMap.set(slugify(s.name), s.id);
        if (s.code) subjectNameToIdMap.set(slugify(s.code), s.id);
    }

    const resolveSubject = (nameOrObj?: string | { name: string; code?: string; description?: string }): string | undefined => {
        if (!nameOrObj) return undefined;
        const name = typeof nameOrObj === "string" ? nameOrObj : nameOrObj.name;
        if (!name || !name.trim()) return undefined;

        const slug = slugify(name);
        if (subjectNameToIdMap.has(slug)) {
            return subjectNameToIdMap.get(slug);
        }

        const newId = subjectIdFromName(name);
        const newSubject: Subject = {
            id: newId,
            name: name.trim(),
            code: typeof nameOrObj === "object" ? nameOrObj.code : undefined,
            description: typeof nameOrObj === "object" ? nameOrObj.description : undefined,
            createdAt: new Date().toISOString(),
        };

        existingSubjects.push(newSubject);
        addedSubjects.push(newSubject);
        subjectNameToIdMap.set(slug, newId);
        return newId;
    };

    // Pre-resolve explicitly listed subjects in envelope
    if (envelope.subjects) {
        for (const s of envelope.subjects) {
            resolveSubject(s);
        }
    }

    // 3. Helper: Find or Create Topic
    const topicKeyToIdMap = new Map<string, string>();
    for (const t of existingTopics) {
        topicKeyToIdMap.set(`${t.subjectId}::${slugify(t.name)}`, t.id);
    }

    const resolveTopic = (topicName: string, subjectId?: string, unit?: string, description?: string): string | undefined => {
        if (!topicName || !topicName.trim() || !subjectId) return undefined;
        const slug = slugify(topicName);
        const key = `${subjectId}::${slug}`;

        if (topicKeyToIdMap.has(key)) {
            return topicKeyToIdMap.get(key);
        }

        const newId = topicIdFromName(subjectId, topicName);
        const newTopic: Topic = {
            id: newId,
            subjectId,
            name: topicName.trim(),
            unit,
            description,
            progressPercent: 0,
        };

        existingTopics.push(newTopic);
        addedTopics.push(newTopic);
        topicKeyToIdMap.set(key, newId);
        return newId;
    };

    // Pre-resolve explicit topics
    if (envelope.topics) {
        for (const t of envelope.topics) {
            const subjId = resolveSubject(t.subject);
            if (subjId) {
                resolveTopic(t.name, subjId, t.unit, t.description);
            }
        }
    }

    // 4. Map and Normalize Items
    const titleToItemIdMap = new Map<string, string>();
    for (const item of existingItems) {
        titleToItemIdMap.set(slugify(item.title), item.id);
    }

    const rawItems = envelope.items || [];
    const interimItems: Array<{ raw: any; academicItem: AcademicItem }> = [];

    for (const raw of rawItems) {
        const title = (raw.title || "").trim();
        if (!title) continue;

        const subjectId = resolveSubject(raw.subject);
        const topicIds: string[] = [];

        if (Array.isArray(raw.topics) && subjectId) {
            for (const topName of raw.topics) {
                const topId = resolveTopic(topName, subjectId);
                if (topId) topicIds.push(topId);
            }
        }

        // Normalize item type
        let itemType: ItemType = "update";
        const rawType = (raw.type || "").toLowerCase().trim();
        if (rawType === "event" || rawType === "action" || rawType === "update" || rawType === "opportunity") {
            itemType = rawType;
        } else if (rawType === "class" || rawType === "exam" || rawType === "test" || rawType === "meeting") {
            itemType = "event";
        } else if (rawType === "assignment" || rawType === "task" || rawType === "homework") {
            itemType = "action";
        } else if (rawType === "scholarship" || rawType === "internship") {
            itemType = "opportunity";
        }

        // Normalize priority
        let priority: Priority = "normal";
        const rawPriority = (raw.priority || "").toLowerCase().trim();
        if (rawPriority === "low" || rawPriority === "normal" || rawPriority === "high" || rawPriority === "urgent") {
            priority = rawPriority;
        }

        const id = generateId("item");
        titleToItemIdMap.set(slugify(title), id);

        const academicItem: AcademicItem = {
            id,
            type: itemType,
            title,
            description: raw.description?.trim(),
            subjectId,
            topicIds: topicIds.length > 0 ? topicIds : undefined,
            inputId: inputProvenance?.id,
            startAt: raw.startAt || undefined,
            endAt: raw.endAt || undefined,
            dueAt: raw.dueAt || undefined,
            priority,
            status: "active",
            eventType: raw.eventType as any,
            actionType: raw.actionType as any,
            updateType: raw.updateType as any,
            opportunityType: raw.opportunityType as any,
            metadata: raw.metadata || {},
        };

        interimItems.push({ raw, academicItem });
    }

    // Connect item relationships (prepares_for, supersedes)
    for (const entry of interimItems) {
        const { raw, academicItem } = entry;
        if (raw.preparesForTitle) {
            const targetId = titleToItemIdMap.get(slugify(raw.preparesForTitle));
            if (targetId) academicItem.preparesForItemId = targetId;
        }
        if (raw.supersedesTitle) {
            const targetId = titleToItemIdMap.get(slugify(raw.supersedesTitle));
            if (targetId) academicItem.supersedesItemId = targetId;
        }

        existingItems.unshift(academicItem);
        addedItems.push(academicItem);
    }

    // 5. Map and Normalize Materials
    const rawMaterials = envelope.materials || [];
    for (const raw of rawMaterials) {
        const title = (raw.title || "").trim();
        if (!title) continue;

        const subjectId = resolveSubject(raw.subject);
        const topicIds: string[] = [];

        if (Array.isArray(raw.topics) && subjectId) {
            for (const topName of raw.topics) {
                const topId = resolveTopic(topName, subjectId);
                if (topId) topicIds.push(topId);
            }
        }

        // Material type normalization
        const validTypes = [
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
        ];
        const rawType = (raw.type || "note").toLowerCase().trim();
        const materialType: MaterialType = validTypes.includes(rawType) ? (rawType as MaterialType) : "other";

        // Origin normalization
        const validOrigins = ["personal", "college", "teacher", "library", "community", "web", "system"];
        const rawOrigin = (raw.origin || "personal").toLowerCase().trim();
        const origin: MaterialOrigin = validOrigins.includes(rawOrigin) ? (rawOrigin as MaterialOrigin) : "personal";

        const material: Material = {
            id: generateId("mat"),
            type: materialType,
            title,
            description: raw.description?.trim(),
            subjectId,
            topicIds: topicIds.length > 0 ? topicIds : undefined,
            inputId: inputProvenance?.id,
            origin,
            content: raw.content,
            url: raw.url,
            testData: raw.testData,
            userProgress: {
                completed: false,
                attempts: [],
            },
            metadata: raw.metadata || {},
        };

        existingMaterials.unshift(material);
        addedMaterials.push(material);
    }

    const mergedState: StudidexState = {
        version: 1,
        subjects: existingSubjects,
        topics: existingTopics,
        inputs: existingInputs,
        items: existingItems,
        materials: existingMaterials,
        lastUpdated: new Date().toISOString(),
    };

    return {
        inputProvenance,
        newSubjects: addedSubjects,
        newTopics: addedTopics,
        newItems: addedItems,
        newMaterials: addedMaterials,
        mergedState,
    };
}
