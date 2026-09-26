import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/auth';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const supabaseAdmin = auth.adminClient;

    const resolvedParams = await params;
    const moduleId = Number(resolvedParams.moduleId);

    if (isNaN(moduleId)) {
      return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 });
    }

    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'studentIds must be an array' },
        { status: 400 }
      );
    }

    if (
      !studentIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))
    ) {
      return NextResponse.json(
        { error: 'studentIds must contain valid UUID values' },
        { status: 400 }
      );
    }

    if (studentIds.length > 0) {
      // Determine which students already have an active module assigned
      // so new assignments don't clobber their active status
      const { data: existingActives } = await supabaseAdmin
        .from('student_modules')
        .select('student_id')
        .eq('status', 'active')
        .in('student_id', studentIds);

      const alreadyActiveSet = new Set(
        (existingActives ?? []).map((r: any) => r.student_id as string)
      );

      // An UPSERT replaces supplied columns on conflict. Fetch the existing
      // status for this module so reopening the modal cannot accidentally
      // turn a previously-paused assignment into an active one.
      const { data: existingAssignments, error: existingAssignmentsError } =
        await supabaseAdmin
          .from('student_modules')
          .select('student_id, status')
          .eq('module_id', moduleId)
          .in('student_id', studentIds);

      if (existingAssignmentsError) throw existingAssignmentsError;
      const existingStatusByStudent = new Map(
        (existingAssignments ?? []).map((row: any) => [
          row.student_id as string,
          row.status as 'active' | 'paused',
        ])
      );

      // Build rows: new students get 'active' unless they already have an
      // active module elsewhere (in which case this assignment is 'paused').
      // Existing assignments retain their status.
      const rows = studentIds.map((id: string) => ({
        student_id: id,
        module_id: moduleId,
        status:
          existingStatusByStudent.get(id) ??
          (alreadyActiveSet.has(id) ? 'paused' : 'active'),
      }));

      // Upsert inserts new rows and intentionally retains the status computed
      // above for existing rows.
      const { error: upsertError } = await supabaseAdmin
        .from('student_modules')
        .upsert(rows, { onConflict: 'student_id,module_id' });

      if (upsertError) throw upsertError;

      // Remove assignments for students no longer in the list
      const { error: deleteError } = await supabaseAdmin
        .from('student_modules')
        .delete()
        .eq('module_id', moduleId)
        .not('student_id', 'in', `(${studentIds.join(',')})`);

      if (deleteError) throw deleteError;
    } else {
      // Empty list — remove all assignments for this module
      const { error: deleteError } = await supabaseAdmin
        .from('student_modules')
        .delete()
        .eq('module_id', moduleId);

      if (deleteError) throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assign module' },
      { status: 500 }
    );
  }
}
