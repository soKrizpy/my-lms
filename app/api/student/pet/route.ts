// app/api/student/pet/route.ts
// Mengelola data Cyber Pet Companion (CyPeCo) siswa di Supabase

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { determineHatchedPet, BABY_PETS_CATALOG } from '../../../../lib/pet/cypecoCatalog';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const studentId = user.id;

    // 1. Ambil data pet siswa
    let { data: pet, error } = await admin
      .from('student_pets')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('Error querying student_pets:', error);
    }

    // 2. Jika belum ada, buatkan baris telur baru
    if (!pet) {
      const initialPet = {
        student_id: studentId,
        pet_name: 'Telur CyPeCo',
        stage: 'EGG',
        hatch_progress: 25, // Starter progress agar anak tidak mulai dari 0
        logic_data: 30,
        creative_data: 25,
        spatial_data: 20,
      };

      const { data: inserted, error: insertError } = await admin
        .from('student_pets')
        .insert(initialPet)
        .select()
        .single();

      if (insertError) {
        console.warn('Could not insert default student_pet:', insertError);
        // Fallback in-memory
        pet = { ...initialPet, id: 'temp-pet-id' };
      } else {
        pet = inserted;
      }
    }

    // Sambungkan metadata spesies jika sudah menetas
    const speciesData = pet.species_id ? BABY_PETS_CATALOG[pet.species_id] : null;

    return NextResponse.json({
      ok: true,
      pet: {
        ...pet,
        species: speciesData,
      },
    });
  } catch (err) {
    console.error('Exception in GET /api/student/pet:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const studentId = user.id;
    const body = await req.json();

    const { action } = body;

    // Ambil data pet saat ini
    const { data: pet } = await admin
      .from('student_pets')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!pet) {
      return NextResponse.json({ error: 'Pet tidak ditemukan' }, { status: 404 });
    }

    // Aksi 1: BERI MAKAN DATA FRAGMENT
    if (action === 'feed') {
      const fragmentType = body.fragmentType as 'logic' | 'creative' | 'spatial';
      const feedAmount = 10;

      const currentProgress = pet.hatch_progress || 0;
      const newProgress = Math.min(100, currentProgress + 15);

      const updatePayload: Record<string, any> = {
        hatch_progress: newProgress,
        updated_at: new Date().toISOString(),
      };

      if (fragmentType === 'logic') updatePayload.logic_data = (pet.logic_data || 0) + feedAmount;
      if (fragmentType === 'creative') updatePayload.creative_data = (pet.creative_data || 0) + feedAmount;
      if (fragmentType === 'spatial') updatePayload.spatial_data = (pet.spatial_data || 0) + feedAmount;

      if (newProgress >= 100 && pet.stage === 'EGG') {
        updatePayload.stage = 'READY_TO_HATCH';
      }

      const { data: updated, error: updateErr } = await admin
        .from('student_pets')
        .update(updatePayload)
        .eq('id', pet.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Update pet error:', updateErr);
        return NextResponse.json({ error: 'Gagal memberi makan pet' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: 'Nyam! CyPeCo menyerap fragment data koding!',
        pet: updated,
      });
    }

    // Aksi 2: MENETASKAN TELUR (HATCH) DENGAN KUIS KEPRIBADIAN
    if (action === 'hatch') {
      const { choiceId } = body;
      const logic = pet.logic_data || 0;
      const creative = pet.creative_data || 0;
      const spatial = pet.spatial_data || 0;

      const hatchedSpecies = determineHatchedPet(choiceId, logic, creative, spatial);

      const updatePayload = {
        stage: 'BABY_PET',
        species_id: hatchedSpecies.id,
        pet_name: hatchedSpecies.name,
        hatch_progress: 100,
        updated_at: new Date().toISOString(),
      };

      const { data: updated, error: hatchErr } = await admin
        .from('student_pets')
        .update(updatePayload)
        .eq('id', pet.id)
        .select()
        .single();

      if (hatchErr) {
        console.error('Hatch pet error:', hatchErr);
        return NextResponse.json({ error: 'Gagal menetaskan telur' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        hatchedSpecies,
        pet: {
          ...updated,
          species: hatchedSpecies,
        },
      });
    }

    // Aksi 3: GANTI NAMA PET
    if (action === 'rename') {
      const { newName } = body;
      if (!newName || typeof newName !== 'string') {
        return NextResponse.json({ error: 'Nama tidak valid' }, { status: 400 });
      }

      const { data: updated } = await admin
        .from('student_pets')
        .update({ pet_name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', pet.id)
        .select()
        .single();

      return NextResponse.json({ ok: true, pet: updated });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err) {
    console.error('Exception in POST /api/student/pet:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
