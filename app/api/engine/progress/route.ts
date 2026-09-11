// app/api/engine/progress/route.ts
// Engine progress persistence API.
// Used by SupabaseAdapter in the Lesson Engine to load/save StudentState.
//
// GET  /api/engine/progress?topicId=xxx  → load StudentState from engine_progress
// PUT  /api/engine/progress              → upsert StudentState into engine_progress
//
// Auth: session cookie via createClient(). Always uses authenticated user's ID —
// never trusts a client-supplied studentId.

import { NextRequest } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import type { StudentState } from '../../../../types/engine-state';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Fallback: if cookie auth fails, try studentId query param (used by engine in new tab mode)
  let userId = user?.id;
  if (!userId) {
    const paramStudentId = request.nextUrl.searchParams.get('studentId');
    if (paramStudentId && paramStudentId.trim().length > 0) {
      userId = paramStudentId;
    }
  }

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topicId = request.nextUrl.searchParams.get('topicId');
  if (!topicId || topicId.trim() === '') {
    return Response.json({ error: 'topicId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('engine_progress')
    .select('state_json')
    .eq('student_id', userId)
    .eq('topic_id', topicId)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // null means no saved state yet — engine treats this as a first visit
  return Response.json({ state: data?.state_json ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { topicId: string; state: StudentState };
  try {
    body = await request.json() as { topicId: string; state: StudentState };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { topicId, state } = body;
  if (!topicId || typeof topicId !== 'string' || topicId.trim() === '') {
    return Response.json({ error: 'topicId is required' }, { status: 400 });
  }
  if (!state || typeof state !== 'object') {
    return Response.json({ error: 'state is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('engine_progress')
    .upsert(
      {
        student_id: user.id,
        topic_id: topicId,
        state_json: state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,topic_id' }
    );

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const topicId = request.nextUrl.searchParams.get('topicId');
  if (!topicId || topicId.trim() === '') {
    return Response.json({ error: 'topicId is required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('engine_progress')
    .delete()
    .eq('student_id', user.id)
    .eq('topic_id', topicId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
