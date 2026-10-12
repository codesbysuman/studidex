// app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma, checkDatabaseConnection } from "@/lib/prisma";
import { StudidexState } from "@/lib/core/types";
import {
  rateLimit,
  getClientIp,
  createRateLimitResponse,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

function safeDate(value: any): Date | null {
  if (!value || typeof value !== "string") return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`sync-get:${ip}`, {
      limit: 60,
      windowMs: 60 * 1000,
      keyPrefix: "sync",
    });

    if (!limit.success) {
      return createRateLimitResponse(limit);
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to sync." },
        { status: 401, headers: getRateLimitHeaders(limit) }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database offline", databaseOffline: true },
        { status: 503, headers: getRateLimitHeaders(limit) }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        subjects: true,
        topics: true,
        items: true,
        materials: true,
        testAttempts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: getRateLimitHeaders(limit) }
      );
    }

    const papers = Array.isArray(user.papers) ? (user.papers as any) : [];

    const formattedState: StudidexState = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      profile: {
        name: user.name || "Student",
        stage: (user.stage as any) || "ug",
        className: user.className || undefined,
        degree: user.degree || undefined,
        examiningBody: user.examiningBody || undefined,
        board: user.board || undefined,
        medium: user.medium || "English",
        institutionName: user.institutionName || undefined,
        center: user.center || undefined,
        stream: user.stream || undefined,
        specialization: user.specialization || undefined,
        minorSpecialization: user.minorSpecialization || undefined,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        enrolledSubjectIds: user.subjects.map((s) => s.id),
        papers,
      },
      subjects: user.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code || undefined,
        description: s.description || undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      topics: user.topics.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        name: t.name,
        unit: t.unit || undefined,
        progressPercent: t.progress,
      })),
      items: user.items.map((i) => ({
        id: i.id,
        type: i.type as any,
        eventType: (i.eventType as any) || undefined,
        actionType: (i.actionType as any) || undefined,
        title: i.title,
        description: i.description || undefined,
        subjectId: i.subjectId || undefined,
        topicIds: Array.isArray(i.topicIds) ? (i.topicIds as string[]) : undefined,
        startAt: i.startAt?.toISOString(),
        endAt: i.endAt?.toISOString(),
        dueAt: i.dueAt?.toISOString(),
        priority: (i.priority as any) || "normal",
        status: (i.status as any) || "active",
        metadata: (i.metadata as any) || undefined,
        preparesForItemId: i.preparesForItemId || undefined,
      })),
      materials: user.materials.map((m) => {
        const matAttempts = user.testAttempts
          .filter((a) => a.materialId === m.id)
          .map((a) => ({
            id: a.id,
            timestamp: a.timestamp.toISOString(),
            score: a.score,
            totalMarks: a.totalMarks,
            selectedAnswers: (a.selectedAnswers as any) || {},
            timeSpentSeconds: a.timeSpentSeconds || 0,
          }));

        const meta = (m.metadata as any) || {};
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
          metadata: meta,
          isPublic: Boolean(meta.isPublic),
          isPaid: Boolean(meta.isPaid),
          price: typeof meta.price === "number" ? meta.price : 0,
          downloadCount: typeof meta.downloadCount === "number" ? meta.downloadCount : 0,
          stage: meta.stage || undefined,
          board: meta.board || undefined,
          stream: meta.stream || undefined,
          specialization: meta.specialization || undefined,
          subjectName: meta.subjectName || undefined,
          authorName: meta.authorName || undefined,
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
      inputs: [],
    };

    return NextResponse.json(
      { success: true, state: formattedState },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("Sync GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cloud state." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(`sync-post:${ip}`, {
      limit: 45,
      windowMs: 60 * 1000,
      keyPrefix: "sync",
    });

    if (!limit.success) {
      return createRateLimitResponse(limit);
    }

    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to sync." },
        { status: 401, headers: getRateLimitHeaders(limit) }
      );
    }

    const dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      return NextResponse.json(
        { error: "Database offline", databaseOffline: true },
        { status: 503, headers: getRateLimitHeaders(limit) }
      );
    }

    let clientState: StudidexState;
    try {
      clientState = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON sync payload." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    if (!clientState || typeof clientState !== "object" || !clientState.profile) {
      return NextResponse.json(
        { error: "Invalid state structure." },
        { status: 400, headers: getRateLimitHeaders(limit) }
      );
    }

    const userId = session.userId;

    // Sanitize arrays with bounded capacity to prevent memory/DB denial-of-service
    const subjects = Array.isArray(clientState.subjects) ? clientState.subjects.slice(0, 100) : [];
    const topics = Array.isArray(clientState.topics) ? clientState.topics.slice(0, 300) : [];
    const items = Array.isArray(clientState.items) ? clientState.items.slice(0, 500) : [];
    const materials = Array.isArray(clientState.materials) ? clientState.materials.slice(0, 200) : [];

    await prisma.$transaction(async (tx) => {
      // 1. Update user profile
      const prof = clientState.profile;
      await tx.user.update({
        where: { id: userId },
        data: {
          name: typeof prof.name === "string" ? prof.name.slice(0, 100) : undefined,
          stage: typeof prof.stage === "string" ? prof.stage.slice(0, 20) : undefined,
          className: typeof prof.className === "string" ? prof.className.slice(0, 100) : undefined,
          degree: typeof prof.degree === "string" ? prof.degree.slice(0, 100) : undefined,
          examiningBody: typeof prof.examiningBody === "string" ? prof.examiningBody.slice(0, 150) : undefined,
          board: typeof prof.board === "string" ? prof.board.slice(0, 150) : undefined,
          medium: typeof prof.medium === "string" ? prof.medium.slice(0, 50) : undefined,
          institutionName: typeof prof.institutionName === "string" ? prof.institutionName.slice(0, 150) : undefined,
          center: typeof prof.center === "string" ? prof.center.slice(0, 100) : undefined,
          stream: typeof prof.stream === "string" ? prof.stream.slice(0, 100) : undefined,
          specialization: typeof prof.specialization === "string" ? prof.specialization.slice(0, 150) : undefined,
          minorSpecialization: typeof prof.minorSpecialization === "string" ? prof.minorSpecialization.slice(0, 150) : undefined,
          hasCompletedOnboarding: prof.hasCompletedOnboarding ?? true,
          papers: Array.isArray(prof.papers) ? (prof.papers as any) : [],
        },
      });

      // 2. Reconcile records deleted on client with safe relational deletion order
      const payloadSubjectIds = subjects.map((s) => String(s.id)).filter(Boolean);
      const payloadTopicIds = topics.map((t) => String(t.id)).filter(Boolean);
      const payloadItemIds = items.map((i) => String(i.id)).filter(Boolean);
      const payloadMaterialIds = materials.map((m) => String(m.id)).filter(Boolean);

      if (payloadItemIds.length > 0) {
        await tx.academicItem.deleteMany({ where: { userId, id: { notIn: payloadItemIds } } });
      } else {
        await tx.academicItem.deleteMany({ where: { userId } });
      }

      if (payloadMaterialIds.length > 0) {
        await tx.material.deleteMany({ where: { userId, id: { notIn: payloadMaterialIds } } });
      } else {
        await tx.material.deleteMany({ where: { userId } });
      }

      if (payloadTopicIds.length > 0) {
        await tx.topic.deleteMany({ where: { userId, id: { notIn: payloadTopicIds } } });
      } else {
        await tx.topic.deleteMany({ where: { userId } });
      }

      if (payloadSubjectIds.length > 0) {
        await tx.subject.deleteMany({ where: { userId, id: { notIn: payloadSubjectIds } } });
      } else {
        await tx.subject.deleteMany({ where: { userId } });
      }

      // 3. Upsert subjects with strict tenant isolation (IDOR protection)
      const validUserSubjectIds = new Set<string>();

      for (const subj of subjects) {
        if (!subj.id || !subj.name) continue;
        const safeSubjId = String(subj.id);

        const existing = await tx.subject.findUnique({
          where: { id: safeSubjId },
          select: { id: true, userId: true },
        });

        if (existing) {
          // If subject exists and belongs to this user, update it
          if (existing.userId === userId) {
            await tx.subject.update({
              where: { id: safeSubjId },
              data: {
                name: subj.name.slice(0, 150),
                code: subj.code ? subj.code.slice(0, 50) : null,
                description: subj.description ? subj.description.slice(0, 1000) : null,
              },
            });
            validUserSubjectIds.add(safeSubjId);
          }
          // If it belongs to another user, DO NOT overwrite!
        } else {
          // Create new record owned by current user
          await tx.subject.create({
            data: {
              id: safeSubjId,
              userId,
              name: subj.name.slice(0, 150),
              code: subj.code ? subj.code.slice(0, 50) : null,
              description: subj.description ? subj.description.slice(0, 1000) : null,
            },
          });
          validUserSubjectIds.add(safeSubjId);
        }
      }

      // 3. Upsert topics with verified subject ownership
      for (const topic of topics) {
        if (!topic.id || !topic.name || !topic.subjectId) continue;
        const safeTopicId = String(topic.id);
        const safeSubjectId = String(topic.subjectId);

        // Verify subject belongs to this user to avoid FK error or cross-tenant linking
        if (!validUserSubjectIds.has(safeSubjectId)) continue;

        const existing = await tx.topic.findUnique({
          where: { id: safeTopicId },
          select: { id: true, userId: true },
        });

        const progressPercent =
          typeof topic.progressPercent === "number"
            ? Math.min(100, Math.max(0, topic.progressPercent))
            : 0;

        if (existing) {
          if (existing.userId === userId) {
            await tx.topic.update({
              where: { id: safeTopicId },
              data: {
                name: topic.name.slice(0, 150),
                unit: topic.unit ? topic.unit.slice(0, 50) : null,
                progress: progressPercent,
              },
            });
          }
        } else {
          await tx.topic.create({
            data: {
              id: safeTopicId,
              userId,
              subjectId: safeSubjectId,
              name: topic.name.slice(0, 150),
              unit: topic.unit ? topic.unit.slice(0, 50) : null,
              progress: progressPercent,
            },
          });
        }
      }

      // 4. Upsert academic items with date safety and tenant isolation
      for (const item of items) {
        if (!item.id || !item.title) continue;
        const safeItemId = String(item.id);

        const assignedSubjectId =
          item.subjectId && validUserSubjectIds.has(String(item.subjectId))
            ? String(item.subjectId)
            : null;

        const existing = await tx.academicItem.findUnique({
          where: { id: safeItemId },
          select: { id: true, userId: true },
        });

        const safePriority = ["low", "normal", "high", "urgent"].includes(item.priority as string)
          ? item.priority
          : "normal";
        const safeStatus = ["active", "pending", "in_progress", "completed", "cancelled", "archived"].includes(
          item.status as string
        )
          ? item.status
          : "active";
        const safeType = ["event", "action", "update", "opportunity"].includes(item.type as string)
          ? item.type
          : "action";

        const startAt = safeDate(item.startAt);
        const endAt = safeDate(item.endAt);
        const dueAt = safeDate(item.dueAt);

        if (existing) {
          if (existing.userId === userId) {
            await tx.academicItem.update({
              where: { id: safeItemId },
              data: {
                title: item.title.slice(0, 200),
                description: item.description ? item.description.slice(0, 3000) : null,
                subjectId: assignedSubjectId,
                startAt,
                endAt,
                dueAt,
                priority: safePriority,
                status: safeStatus,
                metadata: (item.metadata as any) || null,
                topicIds: Array.isArray(item.topicIds) ? (item.topicIds as any) : [],
              },
            });
          }
        } else {
          await tx.academicItem.create({
            data: {
              id: safeItemId,
              userId,
              subjectId: assignedSubjectId,
              type: safeType,
              eventType: item.eventType ? String(item.eventType).slice(0, 50) : null,
              actionType: item.actionType ? String(item.actionType).slice(0, 50) : null,
              title: item.title.slice(0, 200),
              description: item.description ? item.description.slice(0, 3000) : null,
              startAt,
              endAt,
              dueAt,
              priority: safePriority,
              status: safeStatus,
              metadata: (item.metadata as any) || null,
              topicIds: Array.isArray(item.topicIds) ? (item.topicIds as any) : [],
              preparesForItemId: item.preparesForItemId ? String(item.preparesForItemId) : null,
            },
          });
        }
      }

      // 5. Upsert materials with tenant isolation
      for (const mat of materials) {
        if (!mat.id || !mat.title) continue;
        const safeMatId = String(mat.id);

        const assignedSubjectId =
          mat.subjectId && validUserSubjectIds.has(String(mat.subjectId))
            ? String(mat.subjectId)
            : null;

        const existing = await tx.material.findUnique({
          where: { id: safeMatId },
          select: { id: true, userId: true, metadata: true },
        });

        const existingMeta = (existing?.metadata as any) || {};
        const incomingMeta = (mat.metadata as any) || {};
        const mergedMeta = {
          ...existingMeta,
          ...incomingMeta,
          isPublic: mat.isPublic !== undefined ? mat.isPublic : (incomingMeta.isPublic !== undefined ? incomingMeta.isPublic : existingMeta.isPublic || false),
          isPaid: mat.isPaid !== undefined ? mat.isPaid : (incomingMeta.isPaid !== undefined ? incomingMeta.isPaid : existingMeta.isPaid || false),
          price: mat.price !== undefined ? mat.price : (incomingMeta.price !== undefined ? incomingMeta.price : existingMeta.price || 0),
          downloadCount: mat.downloadCount !== undefined ? mat.downloadCount : (incomingMeta.downloadCount !== undefined ? incomingMeta.downloadCount : existingMeta.downloadCount || 0),
          stage: mat.stage || incomingMeta.stage || existingMeta.stage || null,
          board: mat.board || incomingMeta.board || existingMeta.board || null,
          stream: mat.stream || incomingMeta.stream || existingMeta.stream || null,
          specialization: mat.specialization || incomingMeta.specialization || existingMeta.specialization || null,
          subjectName: mat.subjectName || incomingMeta.subjectName || existingMeta.subjectName || null,
          authorName: mat.authorName || incomingMeta.authorName || existingMeta.authorName || null,
        };

        if (existing) {
          if (existing.userId === userId) {
            await tx.material.update({
              where: { id: safeMatId },
              data: {
                title: mat.title.slice(0, 200),
                description: mat.description ? mat.description.slice(0, 3000) : null,
                subjectId: assignedSubjectId,
                content: mat.content ? mat.content.slice(0, 100_000) : null,
                testData: (mat.testData as any) || null,
                metadata: mergedMeta,
              },
            });
          }
        } else {
          await tx.material.create({
            data: {
              id: safeMatId,
              userId,
              subjectId: assignedSubjectId,
              type: mat.type ? String(mat.type).slice(0, 50) : "note",
              origin: mat.origin ? String(mat.origin).slice(0, 50) : "personal",
              title: mat.title.slice(0, 200),
              description: mat.description ? mat.description.slice(0, 3000) : null,
              content: mat.content ? mat.content.slice(0, 100_000) : null,
              testData: (mat.testData as any) || null,
              metadata: mergedMeta,
              topicIds: Array.isArray(mat.topicIds) ? (mat.topicIds as any) : [],
            },
          });
        }
      }
    });

    return NextResponse.json(
      { success: true, message: "Synced successfully with your cloud space." },
      { headers: getRateLimitHeaders(limit) }
    );
  } catch (error: any) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      { error: "Unable to sync with cloud right now. Your work is saved locally." },
      { status: 500 }
    );
  }
}
