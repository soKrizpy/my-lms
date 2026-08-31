// app/api/lesson-content/[topicId]/route.ts
// GET /api/lesson-content/:topicId
//
// Public endpoint — returns lesson_content JSONB for a given engine_topic_id.
// Used by the Lesson Engine (via lmsOrigin URL param) to resolve LMS-authored content.
//
// Security model:
// - lesson_content is PUBLISHED lesson data, intended to be student-facing.
// - This endpoint ONLY returns lessons with status = 'published'.
// - Draft lessons are NOT returned — they return 404.
// - No auth required (lesson content is public once published).
// - Uses service_role client server-side — RLS is bypassed intentionally here
//   because RLS only restricts anonymous browser-direct Supabase access.
//   The endpoint itself enforces the status = 'published' filter.
// - CORS: allows requests from any origin so the Lesson Engine can fetch
//   regardless of whether it runs on a different domain.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ topicId: string }> }
) {
  const { topicId } = await params;

  if (!topicId || typeof topicId !== 'string') {
    return NextResponse.json({ error: 'Invalid topicId' }, { status: 400, headers: CORS_HEADERS });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('topics')
    .select('lesson_content, status, engine_topic_id')
    .eq('engine_topic_id', topicId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  if (!data || !data.lesson_content) {
    return NextResponse.json(
      { error: `No published lesson content found for topic "${topicId}"` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // Return the raw lesson JSON — the engine validates it against its own schema
  return NextResponse.json(data.lesson_content, { headers: CORS_HEADERS });
}
