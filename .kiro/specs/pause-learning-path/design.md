# Design Document

## Fitur: Pause Learning Path

---

## Overview

Fitur ini memungkinkan admin menjeda (pause) satu learning path siswa dan mengaktifkan learning path lain, tanpa mengganggu skor atau progress yang sudah tersimpan. Perubahan hanya terjadi pada kolom `status` di tabel junction `student_modules`. Semua tabel skor (`topic_progress`, `quiz_attempts`, `xp_earned`) tidak pernah disentuh oleh operasi ini.

**Scope dua repositori:**
- **`bits2bytes-lms`**: Migrasi DB, API baru, perubahan API yang sudah ada, Admin UI (`StudentDetailPanel.tsx`).
- **`bits2bytes-lesson-engine`**: Tampilan visual modul yang dijeda (greyed-out + label "Sedang Dijeda", navigasi dinonaktifkan).

---

## Architecture

### Lapisan dan Aliran Data

```
Admin UI (StudentDetailPanel)
    │  PATCH /api/admin/students/[id]/modules/[moduleId]/status
    │  GET /api/admin/students/[id]/details  (sudah ada, perlu tambah status)
    ▼
LMS API (Next.js Route Handlers)
    │  Supabase service_role
    ▼
Database: student_modules.status  ← satu-satunya tabel yang dimodifikasi
    │
    │  GET /api/student/modules (existing LMS API → Lesson Engine)
    ▼
Lesson Engine (ModuleSwitcher / LearningPath)
    │  field `status` dari LMS API
    ▼
UI: modul active = normal, modul paused = greyed-out + label
```

### Invariant Utama

- **Satu active per siswa:** Pada setiap saat, seorang siswa memiliki paling banyak satu `student_modules` rekord dengan `status = 'active'`.
- **Isolasi skor:** Operasi pause/activate tidak pernah menyentuh `topic_progress`, `quiz_attempts`, atau `xp_earned`.

---

## Database Schema Change

### Migration SQL

```sql
-- Migration: add status column to student_modules
ALTER TABLE student_modules
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'paused'));

-- Back-fill all existing records (DEFAULT handles new rows)
UPDATE student_modules SET status = 'active' WHERE status IS NULL;
```

Migrasi ini:
1. Menambah kolom `status` dengan DEFAULT `'active'` dan CHECK constraint.
2. Back-fill semua rekord lama ke `'active'`.
3. **Tidak menyentuh** `topic_progress`, `quiz_attempts`, atau `xp_earned`.

### Updated Type (LMS)

```typescript
// lib/types.ts (atau inline di route)
export type ModuleStatus = 'active' | 'paused';

export interface StudentModuleRow {
  student_id: string;
  module_id: number;
  status: ModuleStatus;
}
```

---

## Components & Interfaces

### 1. Endpoint Baru: `PATCH /api/admin/students/[id]/modules/[moduleId]/status`

**File:** `app/api/admin/students/[id]/modules/[moduleId]/status/route.ts`

```typescript
// Request body
interface StatusRequestBody {
  action: 'pause' | 'activate';
}

// Response (success)
interface StatusResponse {
  success: true;
  status: 'active' | 'paused';
}

// Response (error)
interface ErrorResponse {
  error: string;
}
```

**Logika:**

- `action = "pause"`:
  1. Cek rekord `(student_id, module_id)` ada → 404 jika tidak.
  2. `UPDATE student_modules SET status = 'paused' WHERE student_id = id AND module_id = moduleId`.
  3. Return 200 `{ success: true, status: 'paused' }`.

- `action = "activate"`:
  1. Cek rekord `(student_id, module_id)` ada → 404 jika tidak.
  2. Dalam **satu RPC / transaction**:
     a. `UPDATE student_modules SET status = 'paused' WHERE student_id = id AND module_id != moduleId`.
     b. `UPDATE student_modules SET status = 'active' WHERE student_id = id AND module_id = moduleId`.
  3. Return 200 `{ success: true, status: 'active' }`.

- Body tidak valid (bukan `"pause"` atau `"activate"`) → 400 `{ error: "Action tidak valid." }`.
- DB error → 500 `{ error: "..." }` dengan full rollback.

**Transaction Strategy (Supabase):**
Karena Supabase JS client tidak mendukung explicit `BEGIN/COMMIT`, gunakan **Postgres function (RPC)** yang dipanggil via `supabase.rpc('activate_learning_path', { p_student_id, p_module_id })`:

```sql
-- Supabase migration: activate_learning_path function
CREATE OR REPLACE FUNCTION activate_learning_path(
  p_student_id UUID,
  p_module_id  INTEGER
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Pause all other modules for this student
  UPDATE student_modules
    SET status = 'paused'
  WHERE student_id = p_student_id
    AND module_id  != p_module_id;

  -- 2. Activate the requested module
  UPDATE student_modules
    SET status = 'active'
  WHERE student_id = p_student_id
    AND module_id  = p_module_id;
END;
$$;
```

Dengan cara ini kedua UPDATE berjalan dalam satu implicit transaction Postgres.

---

### 2. Perubahan `GET /api/admin/students/[id]/details`

**File:** `app/api/admin/students/[id]/details/route.ts`

Pada query `student_modules` yang sudah ada, tambah field `status`:

```typescript
// Before (existing)
const { data: studentModules } = await supabaseAdmin
  .from("student_modules")
  .select("module_id, modules(id, title, description)")
  .eq("student_id", studentId)
  .order("module_id", { ascending: true });

// After
const { data: studentModules } = await supabaseAdmin
  .from("student_modules")
  .select("module_id, status, modules(id, title, description)")
  .eq("student_id", studentId)
  .order("module_id", { ascending: true });
```

Dan sertakan `status` pada objek modul yang dikembalikan:

```typescript
return {
  id: mod.id,
  title: mod.title,
  description: mod.description,
  status: sm.status as 'active' | 'paused',   // ← tambahan
  topics: modTopics,
  completedCount,
  totalCount: modTopics.length,
};
```

Satu query, nol query tambahan.

---

### 3. Perubahan `POST /api/modules/[moduleId]/assign`

**File:** `app/api/modules/[moduleId]/assign/route.ts`

Assign flow diubah agar kompatibel dengan aturan satu active path:

```typescript
// Determine status for each student being assigned
const existingActives = await supabaseAdmin
  .from("student_modules")
  .select("student_id")
  .eq("status", "active")
  .in("student_id", studentIds);

const alreadyActiveSet = new Set(existingActives.data?.map((r: any) => r.student_id) ?? []);

const rows = studentIds.map((id: string) => ({
  student_id: id,
  module_id: moduleId,
  status: alreadyActiveSet.has(id) ? "paused" : "active",
}));
```

Aturan:
- Siswa **tanpa** active module → modul baru = `'active'`.
- Siswa **sudah punya** active module → modul baru = `'paused'`.
- Status rekord `student_modules` yang sudah ada untuk modul lain **tidak diubah**.

> **Catatan penting:** Assign flow yang ada saat ini melakukan `DELETE` semua rekord untuk `module_id` lalu INSERT ulang. Flow ini menyebabkan kehilangan status. Perubahan desain: **tidak lagi delete semua** — gunakan `upsert` dengan `onConflict('student_id, module_id')` untuk mempertahankan status rekord lama.

```typescript
// Revised assign logic
const { error: upsertError } = await supabaseAdmin
  .from("student_modules")
  .upsert(rows, { onConflict: "student_id,module_id", ignoreDuplicates: false });
```

Untuk siswa yang dihapus dari assignment (tidak ada di `studentIds` baru), tetap perlu delete rekord mereka:

```typescript
const { error: deleteError } = await supabaseAdmin
  .from("student_modules")
  .delete()
  .eq("module_id", moduleId)
  .not("student_id", "in", `(${studentIds.map(() => "?").join(",")})`);
```

---

### 4. Perubahan `StudentDetailPanel.tsx`

**File:** `app/admin/students/StudentDetailPanel.tsx`

#### Type Updates

```typescript
interface ModuleDetail {
  id: number;
  title: string;
  description: string | null;
  status: 'active' | 'paused';   // ← tambahan
  topics: TopicDetail[];
  completedCount: number;
  totalCount: number;
}
```

#### State Management (Optimistic Update)

```typescript
// Tambah state untuk module statuses dan loading per modul
const [moduleStatuses, setModuleStatuses] = useState<Record<number, 'active' | 'paused'>>({});
const [statusLoading, setStatusLoading] = useState<Record<number, boolean>>({});
const [statusError, setStatusError] = useState<string | null>(null);

// Inisialisasi dari data yang dimuat
useEffect(() => {
  if (data) {
    const initial: Record<number, 'active' | 'paused'> = {};
    data.modules.forEach((m) => { initial[m.id] = m.status; });
    setModuleStatuses(initial);
  }
}, [data]);
```

#### Handler

```typescript
async function handleStatusChange(moduleId: number, action: 'pause' | 'activate') {
  const previous = moduleStatuses;

  // Optimistic update
  setStatusLoading((prev) => ({ ...prev, [moduleId]: true }));
  setStatusError(null);
  setModuleStatuses((prev) => {
    const next = { ...prev };
    if (action === 'pause') {
      next[moduleId] = 'paused';
    } else {
      // All others become paused, target becomes active
      Object.keys(next).forEach((id) => { next[Number(id)] = 'paused'; });
      next[moduleId] = 'active';
    }
    return next;
  });

  try {
    const res = await fetch(
      `/api/admin/students/${studentId}/modules/${moduleId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }
    );
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal mengubah status.');
    }
  } catch (e: any) {
    // Rollback on failure
    setModuleStatuses(previous);
    setStatusError(e.message);
  } finally {
    setStatusLoading((prev) => ({ ...prev, [moduleId]: false }));
  }
}
```

#### UI Rendering (Tab Learning Path)

Pada setiap modul header, tambah:
- **Badge status**: hijau "Aktif" atau amber "Dijeda".
- **Tombol aksi**: "Jeda" (untuk active) atau "Aktifkan" (untuk paused).

```tsx
{/* Module header — extended */}
<div className="px-4 py-3 bg-[var(--glass-bg)] border-b border-[var(--glass-border)]">
  <div className="flex items-center justify-between mb-1.5">
    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
        {mod.title}
      </h3>
      {/* Status badge */}
      {moduleStatuses[mod.id] === 'active' ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Aktif
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Dijeda
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs font-medium text-[var(--text-muted)]">
        {mod.completedCount}/{mod.totalCount} topik
      </span>
      {/* Action button */}
      {moduleStatuses[mod.id] === 'active' ? (
        <button
          onClick={() => handleStatusChange(mod.id, 'pause')}
          disabled={statusLoading[mod.id]}
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition-colors disabled:opacity-50"
        >
          {statusLoading[mod.id] ? (
            <span className="w-3 h-3 border border-amber-600 border-t-transparent rounded-full animate-spin" />
          ) : '⏸'} Jeda
        </button>
      ) : (
        <button
          onClick={() => handleStatusChange(mod.id, 'activate')}
          disabled={statusLoading[mod.id]}
          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 transition-colors disabled:opacity-50"
        >
          {statusLoading[mod.id] ? (
            <span className="w-3 h-3 border border-emerald-600 border-t-transparent rounded-full animate-spin" />
          ) : '▶'} Aktifkan
        </button>
      )}
    </div>
  </div>
  <ProgressBar value={mod.completedCount} max={mod.totalCount} />
</div>
```

Error toast di atas tab content:

```tsx
{statusError && (
  <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
    <span>⚠️ {statusError}</span>
    <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
  </div>
)}
```

---

### 5. Lesson Engine: Tampilan Modul Dijeda

Lesson Engine menerima daftar modul dari LMS via parameter URL atau API. Perlu ditambah dukungan untuk field `status` pada data modul.

#### Data Model Extension

```typescript
// src/types/module.ts (file baru)
export interface LmsModule {
  id: number;
  title: string;
  status: 'active' | 'paused';
  topics: LmsTopic[];
}

export interface LmsTopic {
  id: number;
  title: string;
  engine_topic_id: string | null;
  isUnlocked: boolean;
}
```

#### Komponen Baru: `ModuleSwitcher`

**File:** `src/components/ModuleSwitcher/ModuleSwitcher.tsx`

Komponen ini ditampilkan sebelum atau di samping `LessonEngine` untuk memungkinkan navigasi antar modul. Menampilkan daftar semua modul siswa dengan status visual.

```tsx
interface ModuleSwitcherProps {
  modules: LmsModule[];
  activeModuleId: number | null;
  onSelectModule: (moduleId: number) => void;
}

export function ModuleSwitcher({ modules, activeModuleId, onSelectModule }: ModuleSwitcherProps) {
  return (
    <nav aria-label="Learning Paths" className="flex flex-col gap-2 p-4">
      {modules.map((mod) => {
        const isPaused = mod.status === 'paused';
        const isSelected = mod.id === activeModuleId;
        return (
          <div
            key={mod.id}
            className={[
              "rounded-xl border p-3 transition-all",
              isPaused
                ? "opacity-50 border-white/10 bg-white/5 cursor-not-allowed"
                : isSelected
                ? "border-primary/50 bg-primary/10 cursor-pointer"
                : "border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer",
            ].join(" ")}
            onClick={() => !isPaused && onSelectModule(mod.id)}
            role={isPaused ? undefined : "button"}
            aria-disabled={isPaused}
            tabIndex={isPaused ? -1 : 0}
            onKeyDown={(e) => {
              if (!isPaused && (e.key === 'Enter' || e.key === ' ')) {
                onSelectModule(mod.id);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${isPaused ? "text-text-muted" : "text-text-base"}`}>
                {mod.title}
              </span>
              {isPaused && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-text-muted">
                  Sedang Dijeda
                </span>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
```

#### Translation Keys (Tambahan)

Tambah ke `messages/id.json` dan `messages/en.json`:

```json
// id.json
"module": {
  "paused": "Sedang Dijeda",
  "active": "Aktif",
  "switcher": {
    "aria": "Daftar Learning Path"
  }
}

// en.json
"module": {
  "paused": "Paused",
  "active": "Active",
  "switcher": {
    "aria": "Learning Path List"
  }
}
```

---

## Data Models

### `student_modules` (after migration)

| Kolom | Tipe | Constraint |
|-------|------|-----------|
| `student_id` | UUID | FK → students |
| `module_id` | INTEGER | FK → modules |
| `status` | TEXT | NOT NULL DEFAULT 'active', CHECK IN ('active','paused') |

### API Response: `GET /api/admin/students/[id]/details`

```typescript
interface ModuleDetail {
  id: number;
  title: string;
  description: string | null;
  status: 'active' | 'paused';   // ← BARU
  topics: TopicDetail[];
  completedCount: number;
  totalCount: number;
}
```

### API Request/Response: `PATCH .../modules/[moduleId]/status`

```typescript
// Request
{ "action": "pause" | "activate" }

// 200 OK
{ "success": true, "status": "paused" | "active" }

// 400 Bad Request
{ "error": "Action tidak valid." }

// 404 Not Found
{ "error": "Penugasan modul tidak ditemukan." }

// 500 Internal Server Error
{ "error": "<message>" }
```

---

## Error Handling

| Skenario | Respons |
|----------|---------|
| Body tidak mengandung `action` valid | HTTP 400 `"Action tidak valid."` |
| Rekord `student_modules` tidak ditemukan | HTTP 404 `"Penugasan modul tidak ditemukan."` |
| DB error / RPC error | HTTP 500 `<error.message>` |
| Optimistic update gagal (Client) | Rollback state, tampilkan error toast |
| Lesson Engine menerima `status = 'paused'` | Greyed-out, navigasi dinonaktifkan |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Activate Enforces Single-Active Invariant

*For any* student with any number of assigned modules, calling `activate(moduleId)` — via the Module_Status_API — should result in exactly one module having `status = 'active'` (the target module) and all other modules having `status = 'paused'`.

**Validates: Requirements 2.1, 3.3**

---

### Property 2: Pause Sets Exactly One Record

*For any* `(studentId, moduleId)` pair that exists in `student_modules`, calling `pause(moduleId)` should set `status = 'paused'` on exactly that one record, leaving all other records for the same student unchanged.

**Validates: Requirements 3.2**

---

### Property 3: Invalid Action Returns 400

*For any* request body where `action` is not the string `"pause"` or `"activate"` (including missing field, null, numbers, empty string, or other strings), the Module_Status_API should return HTTP 400.

**Validates: Requirements 3.5**

---

### Property 4: Status Operations Preserve Score Integrity

*For any* student with any records in `topic_progress`, `quiz_attempts`, or `xp_earned`, performing any sequence of `pause` and `activate` operations via Module_Status_API should leave those records byte-identical before and after the operations.

**Validates: Requirements 3.6, 8.1**

---

### Property 5: Details API Always Includes Status Field

*For any* student with any number of assigned modules, every module object in the `modules` array returned by `GET /api/admin/students/[id]/details` should have a `status` field with value `'active'` or `'paused'`.

**Validates: Requirements 4.1**

---

### Property 6: Module Status Renders Correct Badge and Button

*For any* array of `ModuleDetail` objects with arbitrary `status` values, rendering the Learning Path tab in `StudentDetailPanel` should produce exactly one "Jeda" button for each `active` module and exactly one "Aktifkan" button for each `paused` module, along with the corresponding status badge.

**Validates: Requirements 5.1, 5.6**

---

### Property 7: Paused Module Renders Greyed-Out With Navigation Disabled

*For any* list of LMS modules containing at least one module with `status = 'paused'`, the `ModuleSwitcher` component in Lesson Engine should render that module with reduced opacity, display the "Sedang Dijeda" label, and ensure no click handler or keyboard interaction can navigate to its topics.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 8: Assign Flow Respects Single-Active Rule

*For any* student, after executing `POST /api/modules/[moduleId]/assign`:
- If the student had no prior `active` module, the newly assigned module must have `status = 'active'`.
- If the student already had an `active` module, the newly assigned module must have `status = 'paused'`.
- All pre-existing `student_modules` records for other modules retain their previous `status` values unchanged.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 9: Pause-Resume is a Round-Trip for Score Data

*For any* student with any set of `topic_progress`, `quiz_attempts`, and `xp_earned` records for a given module, pausing that module and then activating it again should leave those records identical to their state before the pause. The scores and progress survive the pause-resume cycle unchanged.

**Validates: Requirements 8.2, 8.3**
