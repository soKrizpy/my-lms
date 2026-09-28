// app/api/admin/modules/bulk-upload-json/route.ts
// POST /api/admin/modules/bulk-upload-json
// Admin only. Validates and inserts a bulk JSON module payload.
//
// Transaction strategy: insert module first, then topics in sequence.
// If any topic insert fails, delete the module to rollback cleanly.

import { NextRequest } from 'next/server';
import { requireAdmin } from '../../../../../lib/auth';
import { validateBulkJson, type BulkJsonPayload } from '../../../../../lib/bulkJsonValidator';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ('error' in auth) return auth.error;
  const supabase = auth.adminClient;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Body bukan JSON yang valid.' }, { status: 400 });
  }

  // 1. Validate schema
  const validation = validateBulkJson(body);
  if (!validation.valid) {
    return Response.json(
      { error: 'Validasi JSON gagal.', errors: validation.errors },
      { status: 422 }
    );
  }

  const payload = body as BulkJsonPayload;
  let moduleId: number | null = null;

  try {
    // 2. Insert module
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .insert({
        title: payload.module_title.trim(),
        description: payload.description?.trim() ?? null,
        level: payload.level,
        gamification_type: payload.gamification_type ?? 'mimo',
      })
      .select('id')
      .single();

    if (moduleError || !moduleData) {
      throw new Error(moduleError?.message ?? 'Gagal membuat modul.');
    }

    moduleId = moduleData.id as number;

    // 3. Insert topics one by one (structured, not using DB transactions via REST)
    const insertedTopicIds: number[] = [];

    for (const topic of payload.topics) {
      const lessonContent = {
        nodes: topic.nodes,
        post_class_quiz: topic.post_class_quiz,
        exp_reward: topic.exp_reward,
        coins_reward: topic.coins_reward,
        cypeco_exp_reward: topic.cypeco_exp_reward,
      };

      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert({
          module_id: moduleId,
          title: topic.title.trim(),
          order_index: topic.order_index,
          description: topic.description?.trim() ?? null,
          lesson_content: lessonContent,
          status: 'draft',
        })
        .select('id')
        .single();

      if (topicError || !topicData) {
        throw new Error(`Gagal menyimpan topik "${topic.title}": ${topicError?.message ?? 'unknown error'}`);
      }

      insertedTopicIds.push(topicData.id as number);
    }

    return Response.json({
      ok: true,
      moduleId,
      topicsInserted: insertedTopicIds.length,
      message: `Modul "${payload.module_title}" berhasil dibuat dengan ${insertedTopicIds.length} topik.`,
    }, { status: 201 });

  } catch (err: unknown) {
    // Rollback: delete the module (cascades to topics via FK)
    if (moduleId !== null) {
      await supabase.from('modules').delete().eq('id', moduleId);
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload.';
    return Response.json({ error: message }, { status: 500 });
  }
}
