"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Check, XCircle, Star, Coins } from "lucide-react";

// ── Sound helpers ─────────────────────────────────────────────────────────────

function playTone(freq: number, type: OscillatorType, dur: number, vol = 0.08) {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch { /* ok */ }
}
const sfx = {
  correct: () => { playTone(523, "sine", 0.1); setTimeout(() => playTone(659, "sine", 0.25), 100); },
  wrong:   () => { playTone(300, "square", 0.15, 0.06); setTimeout(() => playTone(250, "square", 0.2, 0.06), 150); },
  tada:    () => { [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, "sine", 0.15), i * 90)); },
  next:    () => playTone(700, "sine", 0.07, 0.05),
};

// ── Confetti ──────────────────────────────────────────────────────────────────

function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const COLORS = ["#a3e635", "#38bdf8", "#f97316", "#c084fc", "#ef4444", "#fbbf24"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      r: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      drot: (Math.random() - 0.5) * 0.2,
    }));
    let frame = 0;
    let raf: number;
    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.rot += p.drot;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx!.restore();
      }
      frame++;
      if (frame < 120) raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-50" />;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface LessonNode {
  id: string;
  type: string;
  title: string;
  explanation?: string;
  content?: string;
  instruction?: string;
  instructions?: string;
  code?: { language: string; content: string } | string;
  language?: string;
  codeContent?: string;
  options?: string[];
  correctOption?: string;
  interactionType?: string;
  [key: string]: unknown;
}

interface LessonPlayerProps {
  topic: {
    id: number;
    title: string;
    description?: string | null;
    lesson_content?: unknown;
  };
  nodes: LessonNode[];
  questions: unknown[];
  quizId?: number;
  studentId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCode(node: LessonNode): string {
  if (typeof node.code === "string") return node.code;
  if (node.code && typeof node.code === "object") return (node.code as { content: string }).content ?? "";
  if (typeof node.codeContent === "string") return node.codeContent;
  return "";
}

function getLang(node: LessonNode): string {
  if (node.language) return node.language;
  if (node.code && typeof node.code === "object") return (node.code as { language: string }).language ?? "code";
  return "code";
}

function getText(node: LessonNode): string {
  return node.explanation ?? node.content ?? node.instruction ?? node.instructions ?? "";
}

function isInteractive(node: LessonNode): boolean {
  return (
    node.type === "practice" ||
    node.type === "challenge" ||
    node.type === "quiz_fill_blank" ||
    node.type === "code_puzzle" ||
    (!!node.options?.length && !!node.correctOption)
  );
}

// ── Node Card Components ──────────────────────────────────────────────────────

function LessonCard({ node }: { node: LessonNode }) {
  const code = getCode(node);
  const lang = getLang(node);
  const text = getText(node);
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">{node.title}</h2>
      {text && (
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
      )}
      {code && (
        <div className="rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{lang}</span>
          </div>
          <pre className="p-4 text-sm font-mono text-green-400 overflow-x-auto leading-relaxed whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function PracticeCard({
  node,
  onAnswered,
}: {
  node: LessonNode;
  onAnswered: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const text = getText(node);
  const code = getCode(node);
  const options = node.options ?? [];
  const correct = node.correctOption ?? "";

  const isCorrect = selected?.trim().toLowerCase() === correct.trim().toLowerCase();

  function check() {
    if (!selected || checked) return;
    setChecked(true);
    if (isCorrect) { sfx.correct(); onAnswered(true); }
    else { sfx.wrong(); onAnswered(false); }
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{node.title}</h2>
      {text && <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">{text}</p>}
      {code && (
        <pre className="rounded-xl bg-slate-900 text-green-400 text-sm font-mono p-4 overflow-x-auto">
          <code>{code}</code>
        </pre>
      )}
      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const isSelected = selected === opt;
          const isThis = opt.trim().toLowerCase() === correct.trim().toLowerCase();
          let cls = "w-full text-left px-5 py-3.5 rounded-2xl border-2 font-medium text-base transition-all duration-150 ";
          if (!checked) {
            cls += isSelected
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:bg-blue-50/50";
          } else {
            if (isSelected && isThis)  cls += "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-200";
            else if (isSelected && !isThis) cls += "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-200";
            else if (isThis)           cls += "border-green-400 bg-green-50/60 dark:bg-green-950/20 text-green-700 dark:text-green-300";
            else                       cls += "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 opacity-60";
          }
          return (
            <button key={i} disabled={checked} onClick={() => setSelected(opt)} className={cls}>
              <span className="font-bold text-xs mr-2 opacity-60">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {!checked && (
        <button
          onClick={check}
          disabled={!selected}
          className="w-full py-3.5 rounded-2xl font-bold text-base bg-green-500 hover:bg-green-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Cek Jawaban
        </button>
      )}
      {checked && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl font-semibold text-sm ${isCorrect ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"}`}>
          {isCorrect ? <Check className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
          {isCorrect ? "Tepat sekali! 🎉" : `Jawaban yang benar: ${correct}`}
        </div>
      )}
    </div>
  );
}

function CompletionCard({
  topic,
  expReward,
  coinsReward,
}: {
  topic: { title: string };
  expReward: number;
  coinsReward: number;
}) {
  return (
    <div className="text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-7xl animate-bounce">🏆</div>
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Luar Biasa!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-base">
          Kamu telah menyelesaikan semua materi topik:<br />
          <span className="font-bold text-slate-800 dark:text-slate-100">{topic.title}</span>
        </p>
      </div>
      <div className="flex items-center justify-center gap-4">
        {expReward > 0 && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-extrabold text-amber-700 dark:text-amber-300 text-lg">+{expReward} XP</span>
          </div>
        )}
        {coinsReward > 0 && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-yellow-100 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-700/50">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="font-extrabold text-yellow-700 dark:text-yellow-300 text-lg">+{coinsReward} Koin</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Player ───────────────────────────────────────────────────────────────

export function LessonPlayerClient({
  topic,
  nodes,
  studentId,
}: LessonPlayerProps) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const lc = topic.lesson_content as Record<string, unknown> | null;
  const expReward  = typeof lc?.exp_reward    === "number" ? lc.exp_reward    : 0;
  const coinsReward = typeof lc?.coins_reward  === "number" ? lc.coins_reward  : 0;

  const totalNodes = nodes.length;
  const currentNode = nodes[currentIdx];
  const progress = totalNodes > 0 ? Math.round(((currentIdx) / totalNodes) * 100) : 0;

  // Auto-allow continue for non-interactive nodes after a short delay
  useEffect(() => {
    setCanContinue(false);
    if (!currentNode) return;
    if (!isInteractive(currentNode)) {
      const t = setTimeout(() => setCanContinue(true), 800);
      return () => clearTimeout(t);
    }
  }, [currentIdx, currentNode]);

  const handleAnswered = useCallback((_correct: boolean) => {
    setCanContinue(true);
  }, []);

  async function handleContinue() {
    if (!canContinue) return;
    sfx.next();
    if (currentIdx < totalNodes - 1) {
      setCurrentIdx((p) => p + 1);
    } else {
      // Final node — finish
      setFinished(true);
      setShowConfetti(true);
      sfx.tada();
      setSaving(true);
      try {
        await fetch("/api/student/lesson-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: topic.id, expReward, coinsReward }),
        });
      } catch { /* non-fatal */ }
      setSaving(false);
    }
  }

  function handleClose() {
    if (!finished && !confirm("Keluar? Progres kamu belum tersimpan.")) return;
    router.push("/student");
  }

  function handleBackToDashboard() {
    router.push("/student");
  }

  if (!currentNode && !finished) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Materi tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      {showConfetti && <ConfettiCanvas />}

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="w-full max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${finished ? 100 : progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-400 tabular-nums min-w-[48px] text-right">
            {finished ? "✓" : `${currentIdx + 1}/${totalNodes}`}
          </span>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 pt-8 pb-36">
        {finished ? (
          <CompletionCard topic={topic} expReward={expReward} coinsReward={coinsReward} />
        ) : isInteractive(currentNode) ? (
          <PracticeCard key={currentNode.id} node={currentNode} onAnswered={handleAnswered} />
        ) : (
          <LessonCard key={currentNode.id} node={currentNode} />
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className={`fixed bottom-0 left-0 w-full z-20 border-t transition-colors duration-300 ${
        finished ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50" : "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800"
      }`}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          {finished ? (
            <button
              onClick={handleBackToDashboard}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-extrabold text-lg bg-green-500 hover:bg-green-400 text-white transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "🎉 Lanjut ke Dashboard"}
            </button>
          ) : (
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl font-extrabold text-lg bg-green-500 hover:bg-green-400 text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInteractive(currentNode) && !canContinue ? "Pilih Jawaban" : (
                <>Lanjut <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
