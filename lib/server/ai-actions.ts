// lib/server/ai-actions.ts
"use server";

import {
  generateMockQuestionsWithGroq,
  generateStudyPlanWithGroq,
  generateMaterialSummaryWithGroq,
  compileAcademicMaterialWithGroq,
} from "@/lib/groq";
import { validateImportJson } from "@/lib/core/validate";

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Generates interactive mock questions and quizzes using Groq LLM
 */
export async function generateQuizAction(params: {
  subject: string;
  topics?: string[];
  difficulty?: string;
  questionCount?: number;
}): Promise<ActionResult<any>> {
  try {
    const { subject, topics, difficulty, questionCount } = params;
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return { success: false, error: "Subject is required to generate a mock test." };
    }

    const safeSubject = subject.trim().slice(0, 150);
    const safeTopics = Array.isArray(topics)
      ? topics.filter((t): t is string => typeof t === "string" && Boolean(t.trim())).slice(0, 30)
      : [];
    const safeDifficulty = ["easy", "medium", "hard"].includes(difficulty || "")
      ? difficulty
      : "medium";
    const safeQuestionCount = Math.max(1, Math.min(20, Number(questionCount) || 5));

    const testData = await generateMockQuestionsWithGroq({
      subject: safeSubject,
      topics: safeTopics,
      difficulty: safeDifficulty,
      questionCount: safeQuestionCount,
    });

    return { success: true, data: testData };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to generate mock test questions.",
    };
  }
}

/**
 * Server Action: Generates personalized academic study plan using Groq LLM
 */
export async function generateStudyPlanAction(params: {
  targetExam: string;
  subject: string;
  daysAvailable: number;
  topics?: string[];
  hoursPerDay?: number;
}): Promise<ActionResult<any>> {
  try {
    const { targetExam, subject, daysAvailable, topics, hoursPerDay } = params;
    if (!targetExam?.trim() || !subject?.trim()) {
      return {
        success: false,
        error: "Target exam and subject are required to generate a study plan.",
      };
    }

    const safeExam = targetExam.trim().slice(0, 150);
    const safeSubject = subject.trim().slice(0, 150);
    const safeDays = Math.max(1, Math.min(60, Number(daysAvailable) || 5));
    const safeHours = Math.max(1, Math.min(12, Number(hoursPerDay) || 3));
    const safeTopics = Array.isArray(topics)
      ? topics.filter((t): t is string => typeof t === "string" && Boolean(t.trim())).slice(0, 30)
      : [];

    const plan = await generateStudyPlanWithGroq({
      targetExam: safeExam,
      subject: safeSubject,
      daysAvailable: safeDays,
      topics: safeTopics,
      hoursPerDay: safeHours,
    });

    return { success: true, data: plan };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to generate study plan.",
    };
  }
}

/**
 * Server Action: Generates concise summaries & key takeaways for study materials
 */
export async function generateSummaryAction(params: {
  title: string;
  subject?: string;
  content: string;
}): Promise<ActionResult<any>> {
  try {
    const { title, subject, content } = params;
    if (!content?.trim()) {
      return { success: false, error: "Material content is required to generate a summary." };
    }

    const safeTitle = (title || "Study Material").trim().slice(0, 200);
    const safeSubject = subject?.trim().slice(0, 100);
    const safeContent = content.trim().slice(0, 50_000);

    const summary = await generateMaterialSummaryWithGroq({
      title: safeTitle,
      subject: safeSubject,
      content: safeContent,
    });

    return { success: true, data: summary };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to generate material summary.",
    };
  }
}

/**
 * Server Action: Parses messy notices, timetables, and circulars into structured Studidex items
 */
export async function compileInputAction(params: {
  input: string;
  profileContext?: string;
}): Promise<ActionResult<any>> {
  try {
    const { input, profileContext } = params;
    if (!input?.trim()) {
      return { success: false, error: "Academic text input is required." };
    }

    if (input.length > 50_000) {
      return {
        success: false,
        error: "Input text exceeds maximum allowed length (50,000 characters).",
      };
    }

    const safeProfileContext =
      typeof profileContext === "string" ? profileContext.slice(0, 5000) : undefined;

    const compiledJson = await compileAcademicMaterialWithGroq(input, safeProfileContext);
    const validation = validateImportJson(JSON.stringify(compiledJson));

    return {
      success: true,
      data: {
        raw: compiledJson,
        normalizedPayload: validation.normalizedPayload,
        validation,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to compile academic text.",
    };
  }
}
