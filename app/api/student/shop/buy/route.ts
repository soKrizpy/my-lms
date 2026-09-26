// app/api/student/shop/buy/route.ts
// Membeli aksesori avatar dari Toko Wardrobe menggunakan Koin

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { getAccessoryById } from '../../../../../lib/gamification/avatarShopCatalog';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const studentId = user.id;

    const { itemId } = await req.json();
    const item = getAccessoryById(itemId);
    if (!item) {
      return NextResponse.json({ error: 'Item aksesori tidak ditemukan' }, { status: 404 });
    }

    // Ambil data koin dan inventaris siswa saat ini
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('coins, inventory')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Data siswa tidak ditemukan' }, { status: 404 });
    }

    const currentCoins = typeof student.coins === 'number' ? student.coins : 0;
    const currentInventory: string[] = Array.isArray(student.inventory) ? student.inventory : [];

    // Cek apakah sudah punya
    if (currentInventory.includes(item.id)) {
      return NextResponse.json({ error: 'Kamu sudah memiliki aksesori ini!' }, { status: 400 });
    }

    // Cek kecukupan koin
    if (currentCoins < item.price) {
      return NextResponse.json(
        { error: `Koin kamu tidak cukup! Kamu butuh ${item.price} koin, tapi baru punya ${currentCoins} koin.` },
        { status: 400 }
      );
    }

    const newCoins = currentCoins - item.price;
    const newInventory = [...currentInventory, item.id];

    const { error: updateError } = await admin
      .from('students')
      .update({
        coins: newCoins,
        inventory: newInventory,
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('Error buying accessory:', updateError);
      return NextResponse.json({ error: 'Gagal memproses transaksi toko' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `🎉 Berhasil membeli ${item.name}!`,
      coins: newCoins,
      inventory: newInventory,
    });
  } catch (err) {
    console.error('Exception in POST /api/student/shop/buy:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
