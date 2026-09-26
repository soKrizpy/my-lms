// app/api/student/shop/equip/route.ts
// Memasang atau melepas aksesori avatar siswa

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const studentId = user.id;

    const { itemId } = await req.json(); // itemId can be string or null to unequip

    if (itemId !== null && typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Parameter itemId tidak valid' }, { status: 400 });
    }

    // Ambil data inventaris siswa untuk memastikan siswa memiliki item tersebut
    const { data: student } = await admin
      .from('students')
      .select('inventory')
      .eq('id', studentId)
      .maybeSingle();

    const inventory: string[] = Array.isArray(student?.inventory) ? student.inventory : [];

    if (itemId !== null && !inventory.includes(itemId)) {
      return NextResponse.json({ error: 'Kamu belum membeli aksesori ini!' }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from('students')
      .update({
        equipped_hat_id: itemId,
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error equipping accessory:', updateError);
      return NextResponse.json({ error: 'Gagal memasang aksesori' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      equippedHatId: itemId,
    });
  } catch (err) {
    console.error('Exception in POST /api/student/shop/equip:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
