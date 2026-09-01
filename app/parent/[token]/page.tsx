// app/parent/[token]/page.tsx
// Public parent report page — no login required.
// Data is fetched directly via Supabase admin client (no self-fetch HTTP round-trip).
// Styled as a light-mode public-facing page.

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopicProgressItem {
  engine_topic_id: string;
  xp_earned: number;
  best_quiz_score: number;
  completed_at: string;
  topics?: { title: string } | null;
}

interface MeetingItem {
  id: number;
  title: string;
  meeting_date: string;
  has_joined: boolean;
  progress_report: string | null;
}

interface InvoiceItem {
  month_year: string;
  total_meetings: number;
  attended_meetings: number;
  price_per_meeting: number;
  total_amount: number;
  status: string;
  bank_account: string | null;
}

interface ParentReportData {
  student: { full_name: string | null; grade: string | null };
  topicProgress: TopicProgressItem[];
  meetings: MeetingItem[];
  invoice: InvoiceItem | null;
  summary: { totalAttended: number; totalMeetings: number; avgScore: number; totalXp: number };
  expiresAt: string;
}

// ─── Direct Supabase fetch (no HTTP round-trip) ───────────────────────────────
async function fetchParentData(token: string): Promise<ParentReportData | null> {
  const admin = getSupabaseAdmin();

  // 1. Validate token + expiry
  const { data: link } = await admin
    .from('parent_links')
    .select('student_id, invoice_id, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (!link) return null;
  if (new Date(link.expires_at as string) < new Date()) return null;

  const studentId = link.student_id as string;

  // 2. Student name + grade only (no PII)
  const { data: student } = await admin
    .from('students')
    .select('full_name, grade')
    .eq('id', studentId)
    .maybeSingle();

  // 3. Engine lesson progress — best_quiz_score per topic
  const { data: topicProgress } = await admin
    .from('topic_progress')
    .select('engine_topic_id, xp_earned, best_quiz_score, completed_at, topics(title)')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  // 4. Completed meetings with teacher report
  const { data: meetingRows } = await admin
    .from('meetings')
    .select(
      'id, title, meeting_date, is_completed, progress_report, meeting_students!inner(student_id, has_joined)'
    )
    .eq('meeting_students.student_id', studentId)
    .eq('is_completed', true)
    .order('meeting_date', { ascending: false });

  const meetings: MeetingItem[] = ((meetingRows || []) as any[]).map((m: any) => ({
    id: m.id,
    title: m.title,
    meeting_date: m.meeting_date,
    has_joined: m.meeting_students?.[0]?.has_joined ?? false,
    progress_report: m.progress_report ?? null,
  }));

  // 5. Invoice if linked
  let invoice: InvoiceItem | null = null;
  if (link.invoice_id) {
    const { data: inv } = await admin
      .from('invoices')
      .select('month_year, total_meetings, attended_meetings, price_per_meeting, total_amount, status, bank_account')
      .eq('id', link.invoice_id)
      .maybeSingle();
    invoice = (inv as InvoiceItem) ?? null;
  }

  // 6. Summary stats
  const tp = (topicProgress || []) as any[];
  const totalAttended = meetings.filter((m) => m.has_joined).length;
  const totalMeetings = meetings.length;
  const avgScore = tp.length > 0
    ? Math.round(tp.reduce((s: number, t: any) => s + (t.best_quiz_score || 0), 0) / tp.length)
    : 0;
  const totalXp = tp.reduce((s: number, t: any) => s + (t.xp_earned || 0), 0);

  return {
    student: { full_name: (student as any)?.full_name ?? null, grade: (student as any)?.grade ?? null },
    topicProgress: tp as TopicProgressItem[],
    meetings,
    invoice,
    summary: { totalAttended, totalMeetings, avgScore, totalXp },
    expiresAt: link.expires_at as string,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await fetchParentData(token);
  const name = data?.student?.full_name ?? 'Siswa';
  return {
    title: `Laporan Belajar — ${name} | BITS2BYTES`,
    description: 'Laporan perkembangan belajar siswa BITS2BYTES.',
    robots: 'noindex, nofollow',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 70) return '#059669';
  if (score >= 50) return '#ca8a04';
  return '#dc2626';
}

function scoreLabel(score: number): string {
  if (score >= 80) return '● Sangat Baik';
  if (score >= 70) return '● Baik';
  if (score >= 50) return '● Cukup';
  return '● Perlu Peningkatan';
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ParentReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchParentData(token);
  if (!data) notFound();

  const { student, topicProgress, meetings, invoice, summary, expiresAt } = data;
  const attendanceRate = summary.totalMeetings > 0
    ? Math.round((summary.totalAttended / summary.totalMeetings) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#eff6ff 0%,#f0fdf4 50%,#faf5ff 100%)', padding: '2rem 1rem', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Brand header ──────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem 1.5rem', border: '1px solid #e0e7ff', boxShadow: '0 1px 4px rgba(59,130,246,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#2563eb', letterSpacing: '-0.03em' }}>BITS2BYTES</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', background: '#f5f3ff', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid #ddd6fe' }}>Laporan Siswa</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            {student.full_name ?? '—'}
          </h1>
          {student.grade && (
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>{student.grade}</p>
          )}
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Link berlaku hingga {new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Summary stats ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {[
            {
              label: 'Kehadiran', value: `${summary.totalAttended}/${summary.totalMeetings}`,
              sub: `${attendanceRate}%`,
              color: attendanceRate >= 80 ? '#16a34a' : attendanceRate >= 60 ? '#ca8a04' : '#dc2626',
              bg: attendanceRate >= 80 ? '#f0fdf4' : attendanceRate >= 60 ? '#fefce8' : '#fff1f2',
              border: attendanceRate >= 80 ? '#bbf7d0' : attendanceRate >= 60 ? '#fde68a' : '#fecdd3',
            },
            { label: 'Rata-rata Nilai', value: `${summary.avgScore}%`, sub: scoreLabel(summary.avgScore), color: scoreColor(summary.avgScore), bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Total XP', value: `⭐ ${summary.totalXp}`, sub: `${topicProgress.length} lesson`, color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe' },
          ].map(({ label, value, sub, color, bg, border }) => (
            <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '0.875rem', padding: '1rem 0.75rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color, marginTop: '0.2rem', fontWeight: 600 }}>{sub}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Lesson scores ─────────────────────────────────────────── */}
        {topicProgress.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e0e7ff', boxShadow: '0 1px 4px rgba(59,130,246,0.06)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>🎯</span>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Nilai per Topik</h2>
            </div>
            {topicProgress.map((tp, idx) => {
              const score = tp.best_quiz_score;
              const color = scoreColor(score);
              const title = (tp.topics as any)?.title ?? tp.engine_topic_id;
              return (
                <div key={tp.engine_topic_id} style={{ padding: '0.875rem 1.25rem', borderBottom: idx < topicProgress.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{title}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                        {new Date(tp.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {tp.xp_earned > 0 && ` · ⭐ ${tp.xp_earned} XP`}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color }}>{score}%</span>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8' }}>Nilai terbaik</p>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, background: color, borderRadius: '9999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Meeting reports ───────────────────────────────────────── */}
        {meetings.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e0e7ff', boxShadow: '0 1px 4px rgba(59,130,246,0.06)' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>📋</span>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Laporan Pertemuan</h2>
            </div>
            {meetings.map((m, idx) => (
              <div key={m.id} style={{ padding: '0.875rem 1.25rem', borderBottom: idx < meetings.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: m.progress_report ? '0.5rem' : 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{m.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: m.has_joined ? '#dcfce7' : '#fee2e2', color: m.has_joined ? '#15803d' : '#dc2626', border: `1px solid ${m.has_joined ? '#bbf7d0' : '#fecaca'}` }}>
                      {m.has_joined ? '✓ Hadir' : '✗ Tidak Hadir'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      {new Date(m.meeting_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
                {m.progress_report && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.6, background: '#f8fafc', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', whiteSpace: 'pre-wrap' }}>
                    {m.progress_report}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Invoice ───────────────────────────────────────────────── */}
        {invoice && (
          <div style={{ background: 'linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)', borderRadius: '1rem', padding: '1.25rem 1.5rem', color: '#fff', boxShadow: '0 4px 16px rgba(37,99,235,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '1rem' }}>🧾</span>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Tagihan Bulan {invoice.month_year}</h2>
            </div>
            <div style={{ fontSize: '0.875rem', color: '#bfdbfe', marginBottom: '0.5rem' }}>
              {invoice.attended_meetings} Kehadiran × Rp {invoice.price_per_meeting?.toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem' }}>
              Rp {invoice.total_amount?.toLocaleString('id-ID')}
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.75rem', borderRadius: '9999px', background: invoice.status === 'paid' ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.2)', border: `1px solid ${invoice.status === 'paid' ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.35)'}`, color: '#fff' }}>
              {invoice.status === 'paid' ? '✓ Lunas' : invoice.status === 'sent' ? '⏳ Menunggu Pembayaran' : '📝 Draft'}
            </span>
            {invoice.status !== 'paid' && invoice.bank_account && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.625rem', padding: '0.75rem 1rem', marginTop: '0.75rem' }}>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.7rem', color: '#bfdbfe' }}>Transfer ke rekening:</p>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em' }}>{invoice.bank_account}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────── */}
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', margin: '0.5rem 0 1rem' }}>
          Laporan ini dibuat secara otomatis oleh sistem BITS2BYTES LMS.<br />
          Link bersifat pribadi dan berlaku 30 hari sejak diterbitkan.
        </p>
      </div>
    </div>
  );
}
