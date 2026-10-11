// lib/groq.ts
import Groq from "groq-sdk";

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  return new Groq({ apiKey });
}

export const GROQ_MODEL = "openai/gpt-oss-120b";
export const GROQ_FAST_MODEL = "openai/gpt-oss-20b";

const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

async function callGroqWithFallback(
  groq: Groq,
  systemPrompt: string,
  userContent: string,
  temperature: number = 0.2
): Promise<any> {
  let lastError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err: any) {
      lastError = err;
      if (err?.status === 404 || err?.error?.code === "model_not_found") {
        continue;
      }
      if (model === FALLBACK_MODELS[0]) {
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Intelligent parser: transforms messy notices, WhatsApp circulars, syllabi,
 * or assignment deadlines into structured Studidex envelopes.
 */
export async function compileAcademicMaterialWithGroq(
  rawInput: string,
  academicProfileContext?: string
): Promise<any> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const systemPrompt = `You are the Studidex Academic Information Compiler.
Your job is to read raw academic input (e.g. WhatsApp message, exam schedule, syllabus, homework assignment, class notice) and parse it into structured JSON matching the Studidex import format.

${academicProfileContext ? `Student Academic Profile Context:\n${academicProfileContext}\n` : ""}

CRITICAL INSTRUCTIONS:
1. Output valid JSON ONLY. Do not wrap in markdown codeblocks if possible, or provide raw JSON.
2. Structure schema:
{
  "version": 1,
  "input": {
    "type": "message",
    "source": { "type": "department | college | teacher | class", "name": "Source Name or Course Name" },
    "content": "raw or summary content"
  },
  "subjects": [
    { "name": "Subject Name", "code": "Subject code if mentioned" }
  ],
  "topics": [
    { "name": "Topic Name", "subject": "Subject Name", "unit": "Unit 1" }
  ],
  "items": [
    {
      "type": "event | action | update | opportunity",
      "eventType": "class | exam | test | deadline | submission",
      "actionType": "assignment | study | preparation | submission | application",
      "title": "Clear concise title",
      "description": "Details, rooms, syllabus coverage, marking details",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "startAt": "ISO date string if scheduling date/time is provided, otherwise omit",
      "dueAt": "ISO date string for deadlines or homework, otherwise omit",
      "priority": "low | normal | high | urgent",
      "metadata": { "room": "...", "marks": 50 }
    }
  ],
  "materials": [
    {
      "type": "note | pdf | document | syllabus | pyq | mock_test | handout",
      "title": "Material Title",
      "subject": "Subject Name",
      "topics": ["Topic Name"],
      "origin": "personal | teacher | college | library | system",
      "content": "Text content, notes, key points, formula, or problem statement"
    }
  ]
}

3. For dates without an explicit year, assume current academic year 2026.
4. Extract every actionable homework or exam item into items[].
5. Never hallucinate facts not present or implied in the input.`;

      return await callGroqWithFallback(
        groq,
        systemPrompt,
        `Please compile the following academic input:\n\n${rawInput.trim()}`,
        0.1
      );
    } catch (err) {
      console.warn("Groq online call failed, using intelligent local compiler:", err);
    }
  }

  // Resilient Smart Local Extractor (Offline & Free mode fallback)
  return smartLocalCompile(rawInput, academicProfileContext);
}

/**
 * AI Study Plan & Schedule Generator
 */
export async function generateStudyPlanWithGroq(params: {
  targetExam: string;
  subject: string;
  daysAvailable: number;
  topics?: string[];
  hoursPerDay?: number;
}): Promise<any> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const systemPrompt = `You are the Studidex Smart Study Planner.
Generate a structured, realistic daily study schedule for a student preparing for:
Exam: ${params.targetExam}
Subject: ${params.subject}
Days remaining: ${params.daysAvailable}
Topics: ${(params.topics || []).join(", ") || "Full syllabus"}
Study hours per day: ${params.hoursPerDay || 3} hours.

Output JSON matching:
{
  "summary": "Brief encouraging plan summary strategy",
  "dailySchedule": [
    {
      "day": 1,
      "dateOffset": 0,
      "focus": "Topic name",
      "targetGoal": "Specific target to complete",
      "durationHours": 3,
      "tasks": [
        { "title": "Revise Chapter 1 core theorems", "type": "study", "priority": "high" },
        { "title": "Solve 5 practice problems", "type": "assignment", "priority": "normal" }
      ]
    }
  ]
}`;

      return await callGroqWithFallback(
        groq,
        systemPrompt,
        "Generate the study plan JSON now.",
        0.3
      );
    } catch (err) {
      console.warn("Groq study plan failed, falling back to smart schedule:", err);
    }
  }

  return generateSmartStudyPlan(params);
}

/**
 * AI Mock Exam & Quiz Question Generator
 */
export async function generateMockQuestionsWithGroq(params: {
  subject: string;
  topics?: string[];
  difficulty?: string;
  questionCount?: number;
}): Promise<any> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const count = params.questionCount || 5;
      const systemPrompt = `You are an expert university & school exam creator.
Create an interactive mock quiz with exactly ${count} multiple choice questions for:
Subject: ${params.subject}
Topics: ${params.topics?.join(", ") || "General curriculum"}
Difficulty: ${params.difficulty || "Standard Exam Level"}

Output valid JSON matching:
{
  "title": "Mock Exam: ${params.subject}",
  "durationMinutes": 15,
  "totalMarks": ${count * 5},
  "questions": [
    {
      "id": "q1",
      "text": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed step-by-step reasoning explaining why option A is correct.",
      "marks": 5
    }
  ]
}`;

      return await callGroqWithFallback(
        groq,
        systemPrompt,
        "Generate mock questions JSON now.",
        0.2
      );
    } catch (err) {
      console.warn("Groq mock questions failed, falling back to smart question bank:", err);
    }
  }

  return generateSmartMockQuestions(params);
}

/**
 * AI Material Summarizer & Concept Extractor
 */
export async function generateMaterialSummaryWithGroq(params: {
  title: string;
  subject?: string;
  content: string;
}): Promise<any> {
  const groq = getGroqClient();

  if (groq) {
    try {
      const systemPrompt = `You are the Studidex Academic Synthesizer.
Summarize the following study material or notes:
Title: ${params.title}
Subject: ${params.subject || "General"}

Output valid JSON:
{
  "summary": "Concise 2-3 paragraph summary of core ideas",
  "keyTakeaways": ["Point 1", "Point 2", "Point 3", "Point 4"],
  "highYieldFormulasOrTerms": [
    { "term": "Term Name", "definition": "Brief definition or formula" }
  ],
  "sampleExamQuestions": [
    "Likely exam question 1",
    "Likely exam question 2"
  ]
}`;

      return await callGroqWithFallback(
        groq,
        systemPrompt,
        params.content,
        0.2
      );
    } catch (err) {
      console.warn("Groq summary failed, falling back to smart concept extractor:", err);
    }
  }

  return generateSmartSummary(params);
}

// =========================================================================
// Resilient Smart Generators (Available when offline or without external key)
// =========================================================================

function smartLocalCompile(rawInput: string, context?: string): any {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  // 1. Identify Subject
  let detectedSubject = "General Studies";
  const subjectsMap = [
    { name: "Economics", pattern: /\b(economics|microeconomics|macroeconomics|econometrics)\b/i },
    { name: "Computer Science", pattern: /\b(computer science|programming|data structures|algorithms|python|database|software)\b/i },
    { name: "Mathematics", pattern: /\b(mathematics|calculus|algebra|linear algebra|statistics|discrete math)\b/i },
    { name: "Physics", pattern: /\b(physics|thermodynamics|mechanics|electromagnetism|quantum)\b/i },
    { name: "Political Science", pattern: /\b(political science|constitution|polity|international relations)\b/i },
    { name: "History", pattern: /\b(history|ancient|medieval|modern history|world history)\b/i },
    { name: "English Literature", pattern: /\b(literature|poetry|drama|fiction|essay)\b/i },
    { name: "Business & Commerce", pattern: /\b(business|finance|accounting|marketing|management)\b/i },
  ];

  for (const item of subjectsMap) {
    if (item.pattern.test(text)) {
      detectedSubject = item.name;
      break;
    }
  }

  // If context has active subject, try matching
  if (context && detectedSubject === "General Studies") {
    const match = context.match(/Active Papers:\s*([^,\n\[]+)/i);
    if (match && match[1]) {
      detectedSubject = match[1].trim();
    }
  }

  // 2. Identify Dates
  let detectedIsoDate: string | undefined = undefined;
  const dateRegex = /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?/i;
  const dateMatch = text.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1];
    const month = dateMatch[2];
    const year = dateMatch[3] || "2026";
    const d = new Date(`${day} ${month} ${year} 10:00:00 UTC`);
    if (!isNaN(d.getTime())) {
      detectedIsoDate = d.toISOString();
    }
  } else if (/tomorrow/i.test(text)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    detectedIsoDate = d.toISOString();
  }

  // 3. Detect Items
  const items: any[] = [];
  const materials: any[] = [];

  // Check for Exam / Test
  if (/\b(exam|examination|test|mid-sem|mid-semester|finals?|quiz|viva|assessment)\b/i.test(text)) {
    const examTitleMatch = text.match(/([A-Z][a-zA-Z0-9\s-]{2,40}\s*(?:Exam|Test|Mid-Semester|Quiz|Assessment))/i);
    const title = examTitleMatch ? examTitleMatch[1].trim() : `${detectedSubject} Exam`;
    items.push({
      type: "event",
      eventType: "exam",
      title: title,
      description: text.slice(0, 220),
      subject: detectedSubject,
      startAt: detectedIsoDate,
      priority: "high",
    });
  }

  // Check for Assignment / Submission
  if (/\b(assignment|submit|submission|essay|homework|project|paper due|problem set)\b/i.test(text)) {
    const assignMatch = text.match(/([A-Z][a-zA-Z0-9\s-]{2,40}\s*(?:Assignment|Essay|Submission|Project|Report))/i);
    const title = assignMatch ? assignMatch[1].trim() : `Submit ${detectedSubject} Assignment`;
    items.push({
      type: "action",
      actionType: "assignment",
      title: title,
      description: text.slice(0, 200),
      subject: detectedSubject,
      dueAt: detectedIsoDate,
      priority: "high",
    });
  }

  // Check for Class / Lecture Reschedule
  if (items.length === 0 && /\b(class|lecture|room|hall|lecture cancelled|rescheduled|timing)\b/i.test(text)) {
    items.push({
      type: "event",
      eventType: "class",
      title: `${detectedSubject} Lecture Session`,
      description: text.slice(0, 200),
      subject: detectedSubject,
      startAt: detectedIsoDate,
      priority: "normal",
    });
  }

  // Check for Study Material / Handout
  if (/\b(notes?|handout|syllabus|slides?|chapter|reading|circular|pdf)\b/i.test(text) || items.length === 0) {
    materials.push({
      type: "handout",
      title: `${detectedSubject}: Study Notice & Key Notes`,
      description: "Extracted reference material from notice.",
      subject: detectedSubject,
      origin: "teacher",
      content: text,
    });
  }

  // Fallback if no specific items matched
  if (items.length === 0 && materials.length === 0) {
    items.push({
      type: "action",
      actionType: "study",
      title: `Review ${detectedSubject} Material`,
      description: text.slice(0, 200),
      subject: detectedSubject,
      priority: "normal",
    });
  }

  return {
    version: 1,
    input: {
      type: "message",
      source: {
        type: "college",
        name: "Academic Announcement",
      },
      content: text,
    },
    subjects: [
      {
        name: detectedSubject,
        code: detectedSubject.slice(0, 3).toUpperCase() + "101",
      },
    ],
    topics: [
      {
        name: "Curriculum Module",
        subject: detectedSubject,
        unit: "Unit 1",
      },
    ],
    items,
    materials,
  };
}

function generateSmartStudyPlan(params: {
  targetExam: string;
  subject: string;
  daysAvailable: number;
  topics?: string[];
  hoursPerDay?: number;
}): any {
  const days = Math.max(1, Math.min(30, params.daysAvailable || 5));
  const hrs = params.hoursPerDay || 3;
  const topics = params.topics?.length
    ? params.topics
    : ["Core Principles & Definitions", "Analytical Frameworks & Theories", "Formulas & Problem Solving", "Past Papers & High-Yield Questions"];

  const stages = [
    { focus: "Diagnostic & Syllabus Mapping", goal: "Audit all chapters, identify high-weightage topics, and organize revision notes." },
    { focus: "Core Concepts & Essential Theories", goal: "Master fundamental definitions, primary models, and foundational mechanisms." },
    { focus: "Deep-Dive Practice & Case Applications", goal: "Solve textbook problems, diagram constructions, and conceptual questions." },
    { focus: "Active Recall & Mock Question Drill", goal: "Self-test with closed-book practice prompts and past year questions." },
    { focus: "Timed Simulation & Error Log Review", goal: "Simulate actual exam environment and review previous mistakes." },
    { focus: "Rapid Formula & Flashcard Revision", goal: "Consolidate summary sheets, review key theorems, and ensure mental clarity." },
  ];

  const dailySchedule = Array.from({ length: days }, (_, i) => {
    const dayNum = i + 1;
    const stage = stages[Math.min(i, stages.length - 1)];
    const topicFocus = topics[i % topics.length] || params.subject;

    return {
      day: dayNum,
      dateOffset: i,
      focus: `${topicFocus} — ${stage.focus}`,
      targetGoal: stage.goal,
      durationHours: hrs,
      tasks: [
        {
          title: `Study session: ${topicFocus}`,
          type: "study",
          priority: dayNum >= days - 1 ? "urgent" : "high",
        },
        {
          title: `Practice drill: 5 review questions on ${topicFocus}`,
          type: "assignment",
          priority: "normal",
        },
      ],
    };
  });

  return {
    summary: `Structured ${days}-day revision timetable for ${params.targetExam} (${params.subject}), dedicating ${hrs} hours per day across syllabus mastery, active recall, and exam simulation.`,
    dailySchedule,
  };
}

function generateSmartMockQuestions(params: {
  subject: string;
  topics?: string[];
  difficulty?: string;
  questionCount?: number;
}): any {
  const count = params.questionCount || 5;
  const topicLabel = params.topics?.[0] || params.subject;

  const mockTemplates = [
    {
      text: `Which of the following best defines the primary principle of ${topicLabel}?`,
      options: [
        `The fundamental relationship governing state equilibrium and standard dynamics.`,
        `A static condition that exists only under theoretical isolation without real application.`,
        `An empirical metric used exclusively for retrospective verification.`,
        `A secondary guideline with no direct bearing on overall system outcomes.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Option A correctly states the foundational definition. In ${params.subject}, this core principle governs key outcomes and theoretical frameworks.`,
    },
    {
      text: `When evaluating standard conditions in ${params.subject}, what is the expected outcome of an exogenous increase in constraints?`,
      options: [
        `An immediate shift toward suboptimal equilibrium unless counterbalanced by adaptive efficiency.`,
        `Zero perceptible change across all observable metrics.`,
        `An exponential unconstrained expansion regardless of initial capacity.`,
        `Random divergence with no systematic regularity.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Option A represents the standard theoretical prediction under constrained conditions in academic ${params.subject}.`,
    },
    {
      text: `What primary assumption underlies the standard analytical model for ${topicLabel}?`,
      options: [
        `Rational allocation, consistent boundary conditions, and symmetrical information flow.`,
        `Unbounded randomness with arbitrary decision parameters.`,
        `Constant static friction with no feedback mechanisms.`,
        `Complete independence from empirical observation.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Option A is the primary baseline assumption standardly tested in university-level examinations for this module.`,
    },
    {
      text: `Which of the following steps is crucial when solving multi-part examination problems in ${topicLabel}?`,
      options: [
        `Stating explicit assumptions, establishing governing equations, and verifying boundary conditions.`,
        `Skipping conceptual framing to immediately write qualitative impressions.`,
        `Assuming all variable parameters remain constant regardless of context.`,
        `Ignoring units, dimensions, and standard definitions.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Option A ensures complete academic credit by demonstrating formal analytical methodology.`,
    },
    {
      text: `How does the contemporary view of ${topicLabel} differ from classical introductory formulations?`,
      options: [
        `It incorporates non-linear feedback, dynamic adaptation, and empirical nuances.`,
        `It completely rejects all mathematical and conceptual foundations.`,
        `It restricts analysis to trivial tautologies.`,
        `It eliminates the need for experimental or analytical verification.`,
      ],
      correctAnswerIndex: 0,
      explanation: `Option A represents the modern consensus and advanced syllabus expectations in higher education.`,
    },
  ];

  const questions = mockTemplates.slice(0, count).map((q, idx) => ({
    id: `q${idx + 1}`,
    text: q.text,
    options: q.options,
    correctAnswerIndex: q.correctAnswerIndex,
    explanation: q.explanation,
    marks: 5,
  }));

  return {
    title: `Mock Examination Drill: ${params.subject}`,
    durationMinutes: Math.max(10, count * 3),
    totalMarks: count * 5,
    questions,
  };
}

function generateSmartSummary(params: {
  title: string;
  subject?: string;
  content: string;
}): any {
  const lines = params.content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  const takeaways = lines.slice(0, 4).map((l) => l.replace(/^[-*•\d.]\s*/, ""));
  if (takeaways.length < 3) {
    takeaways.push(`Core conceptual grounding and theoretical definitions for ${params.title}.`);
    takeaways.push(`High-yield exam applications and structural mechanics in ${params.subject || "this topic"}.`);
    takeaways.push(`Key review points and analytical takeaways for exam preparation.`);
  }

  return {
    summary: `Comprehensive study breakdown of "${params.title}". This material covers the core principles, essential definitions, and practical problem-solving applications relevant to your upcoming assessments.`,
    keyTakeaways: takeaways,
    highYieldFormulasOrTerms: [
      {
        term: params.title.split(/[:—–-]/)[0].trim(),
        definition: "Primary concept covered in this lecture and syllabus module.",
      },
      {
        term: "Core Equilibrium / Governing Law",
        definition: "The fundamental operational condition required for optimal analytical evaluation.",
      },
      {
        term: "Exam Application Principle",
        definition: "Step-by-step method for structuring written responses and problem proofs.",
      },
    ],
    sampleExamQuestions: [
      `Explain the core mechanism of ${params.title} and discuss its primary implications in ${params.subject || "this course"}.`,
      `How would you evaluate and solve typical numerical or essay problems based on this material in a timed examination?`,
    ],
  };
}

