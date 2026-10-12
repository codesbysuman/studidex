// lib/server/studidex-server.ts
import { getAuthSession } from "@/lib/auth";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { StudidexState } from "@/lib/core/types";
import { INITIAL_STUDIDEX_STATE } from "@/lib/core/sample-data";
import { AuthUser } from "@/lib/use-studidex";

export interface ServerStudidexData {
  user: AuthUser | null;
  state: StudidexState;
  isDbConnected: boolean;
}

/**
 * Server Component data loader: Fetches user session and academic state
 * directly from Prisma and cookies on the server, eliminating client-side
 * fetch waterfall delays and hydration flashes.
 */
export async function getServerStudidexData(): Promise<ServerStudidexData> {
  try {
    const session = await getAuthSession();
    if (!session) {
      return {
        user: null,
        state: INITIAL_STUDIDEX_STATE,
        isDbConnected: false,
      };
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return {
        user: {
          id: session.userId,
          email: session.email,
          name: session.name || null,
        },
        state: INITIAL_STUDIDEX_STATE,
        isDbConnected: false,
      };
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subjects: true,
        topics: true,
        items: true,
        materials: true,
        testAttempts: true,
      },
    });

    if (!userRecord) {
      return {
        user: null,
        state: INITIAL_STUDIDEX_STATE,
        isDbConnected: true,
      };
    }

    const papers = Array.isArray(userRecord.papers) ? (userRecord.papers as any) : [];

    const formattedState: StudidexState = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      profile: {
        name: userRecord.name || "Student",
        stage: (userRecord.stage as any) || "ug",
        className: userRecord.className || undefined,
        degree: userRecord.degree || undefined,
        examiningBody: userRecord.examiningBody || undefined,
        board: userRecord.board || undefined,
        medium: userRecord.medium || "English",
        institutionName: userRecord.institutionName || undefined,
        center: userRecord.center || undefined,
        stream: userRecord.stream || undefined,
        specialization: userRecord.specialization || undefined,
        minorSpecialization: userRecord.minorSpecialization || undefined,
        hasCompletedOnboarding: userRecord.hasCompletedOnboarding,
        enrolledSubjectIds: userRecord.subjects.map((s) => s.id),
        papers,
      },
      subjects: userRecord.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code || undefined,
        description: s.description || undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      topics: userRecord.topics.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        name: t.name,
        unit: t.unit || undefined,
        progressPercent: t.progress,
      })),
      inputs: [],
      items: userRecord.items.map((i) => ({
        id: i.id,
        type: i.type as any,
        title: i.title,
        description: i.description || undefined,
        subjectId: i.subjectId || undefined,
        topicIds: (Array.isArray(i.topicIds) ? i.topicIds : []) as string[],
        startAt: i.startAt ? i.startAt.toISOString() : undefined,
        endAt: i.endAt ? i.endAt.toISOString() : undefined,
        dueAt: i.dueAt ? i.dueAt.toISOString() : undefined,
        priority: (i.priority as any) || "normal",
        status: (i.status as any) || "pending",
        eventType: (i.eventType as any) || undefined,
        actionType: (i.actionType as any) || undefined,
        metadata: (i.metadata as any) || undefined,
        preparesForItemId: i.preparesForItemId || undefined,
      })),
      materials: userRecord.materials.map((m) => {
        const matAttempts = userRecord.testAttempts
          .filter((a) => a.materialId === m.id)
          .map((a) => ({
            id: a.id,
            timestamp: a.timestamp.toISOString(),
            score: a.score,
            totalMarks: a.totalMarks,
            selectedAnswers: (a.selectedAnswers as any) || {},
            timeSpentSeconds: a.timeSpentSeconds || 0,
          }));

        return {
          id: m.id,
          type: m.type as any,
          origin: m.origin as any,
          title: m.title,
          description: m.description || undefined,
          subjectId: m.subjectId || undefined,
          topicIds: Array.isArray(m.topicIds) ? (m.topicIds as string[]) : undefined,
          content: m.content || undefined,
          testData: (m.testData as any) || undefined,
          metadata: (m.metadata as any) || undefined,
          userProgress:
            matAttempts.length > 0
              ? {
                  completed: true,
                  lastAttemptScore: matAttempts[matAttempts.length - 1].score,
                  totalMarks: matAttempts[matAttempts.length - 1].totalMarks,
                  attempts: matAttempts,
                }
              : undefined,
        };
      }),
    };

    const user: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      stage: userRecord.stage,
      className: userRecord.className,
      examiningBody: userRecord.examiningBody,
      board: userRecord.board,
      institutionName: userRecord.institutionName,
      specialization: userRecord.specialization,
    };

    return {
      user,
      state: formattedState,
      isDbConnected: true,
    };
  } catch (error) {
    console.error("getServerStudidexData error:", error);
    return {
      user: null,
      state: INITIAL_STUDIDEX_STATE,
      isDbConnected: false,
    };
  }
}
