"use client";

// LessonContentEditorModal.tsx
// Modal overlay for editing lesson_content.nodes and lesson_content.post_class_quiz
// stored in the topics table as JSONB.

import React, { useState, useTransition } from "react";
import { X, BookOpen, HelpCircle, Save, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { updateLessonContentAction } from "./actions";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LessonNode {
  id: string;
  type: string;
  title: string;
  content?: string;
  instruction?: string;
  code?: string;
  language?: string;
  [key: string]: unknown;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string;
}

export interface LessonContent {
  nodes?: LessonNode[];
  post_class_quiz?: QuizQuestion[];
  exp_reward?: number;
  coins_reward?: number;
  cypeco_exp_reward?: number;
  [key: string]: unknown;
}

interface LessonContentEditorModalProps {
  topicId: number;
  topicTitle: string;
  moduleId: string;
  lessonContent: LessonContent;
  onClose: () => void;
  onSaved: () => void;
}

// ── Node type badge colours ────────────────────────────────────────────────────

const NODE_TYPE_COLORS: Record<string, string> = {
  lesson: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  code: "bg-slate-800 text-slate-100 dark:bg-slate-900 dark:text-green-400",
  practice: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  challenge: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  quiz: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
};

function nodeTypeColor(type: string) {
  return NODE_TYPE_COLORS[type] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function showContent(node: LessonNode) {
  return node.type === "lesson" || node.content !== undefined;
}
function showInstruction(node: LessonNode) {
  return node.type === "practice" || node.type === "challenge" || node.instruction !== undefined;
}
function showCode(node: LessonNode) {
  return node.type === "code" || node.code !== undefined;
}

// ── Main component ────────────────────────────────────────────────────────────

export function LessonContentEditorModal({
  topicId,
  topicTitle,
  moduleId,
  lessonContent,
  onClose,
  onSaved,
}: LessonContentEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"nodes" | "quiz">("nodes");
  const [nodes, setNodes] = useState<LessonNode[]>(() =>
    deepClone(lessonContent.nodes ?? [])
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    deepClone(lessonContent.post_class_quiz ?? [])
  );
  const [rewards, setRewards] = useState({
    exp_reward: lessonContent.exp_reward ?? 0,
    coins_reward: lessonContent.coins_reward ?? 0,
    cypeco_exp_reward: lessonContent.cypeco_exp_reward ?? 0,
  });
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Node helpers ────────────────────────────────────────────────────────────

  function updateNode(idx: number, patch: Partial<LessonNode>) {
    setNodes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, ...patch } : n))
    );
  }

  function toggleNode(idx: number) {
    setExpandedNodes((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // ── Question helpers ────────────────────────────────────────────────────────

  function updateQuestion(qIdx: number, patch: Partial<QuizQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, ...patch } : q))
    );
  }

  function updateOption(qIdx: number, oIdx: number, text: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) =>
          j === oIdx ? { ...o, text } : o
        );
        return { ...q, options };
      })
    );
  }

  function toggleQuestion(idx: number) {
    setExpandedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  function handleSave() {
    setSaveError(null);

    const updated: LessonContent = {
      ...lessonContent,
      nodes,
      post_class_quiz: questions,
      exp_reward: rewards.exp_reward,
      coins_reward: rewards.coins_reward,
      cypeco_exp_reward: rewards.cypeco_exp_reward,
    };

    const formData = new FormData();
    formData.set("moduleId", moduleId);
    formData.set("topicId", String(topicId));
    formData.set("lessonContent", JSON.stringify(updated));

    startTransition(async () => {
      const result = await updateLessonContentAction(formData);
      if (result && "error" in result && result.error) {
        setSaveError(result.error as string);
        return;
      }
      onSaved();
      onClose();
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] my-4">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              ✏️ Edit Materi &amp; Quiz
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
              {topicTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tab switcher ───────────────────────────────────────────────── */}
        <div className="flex gap-1 px-5 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("nodes")}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === "nodes"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <BookOpen className="w-3.5 h-3.5" />
            📚 Nodes (Materi)
            <span className="ml-1 text-[10px] font-normal opacity-75">
              ({nodes.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors",
              activeTab === "quiz"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ❓ Quiz Post-Class
            <span className="ml-1 text-[10px] font-normal opacity-75">
              ({questions.length} soal)
            </span>
          </button>
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {/* ── NODES TAB ──────────────────────────────────────────────── */}
          {activeTab === "nodes" && (
            <>
              {nodes.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  Topik ini belum memiliki nodes.
                  <br />
                  <span className="text-xs">Upload ulang JSON untuk menambah materi.</span>
                </div>
              ) : (
                nodes.map((node, idx) => {
                  const expanded = expandedNodes[idx] ?? false;
                  return (
                    <div
                      key={node.id ?? idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden"
                    >
                      {/* Node header — always visible */}
                      <button
                        type="button"
                        onClick={() => toggleNode(idx)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${nodeTypeColor(node.type)}`}
                          >
                            {node.type}
                          </span>
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {node.title || <span className="italic text-slate-400">Tanpa judul</span>}
                          </span>
                          <code className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:block">
                            {node.id}
                          </code>
                        </div>
                        {expanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                      </button>

                      {/* Node edit fields — expanded */}
                      {expanded && (
                        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-700">
                          {/* Title */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                              Judul Node
                            </label>
                            <input
                              type="text"
                              value={node.title}
                              onChange={(e) => updateNode(idx, { title: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                          </div>

                          {/* Content */}
                          {showContent(node) && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Konten / Penjelasan
                              </label>
                              <textarea
                                rows={4}
                                value={node.content ?? ""}
                                onChange={(e) => updateNode(idx, { content: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                              />
                            </div>
                          )}

                          {/* Instruction */}
                          {showInstruction(node) && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Instruksi
                              </label>
                              <textarea
                                rows={3}
                                value={node.instruction ?? ""}
                                onChange={(e) => updateNode(idx, { instruction: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                              />
                            </div>
                          )}

                          {/* Code */}
                          {showCode(node) && (
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Bahasa Pemrograman
                                </label>
                                <input
                                  type="text"
                                  value={node.language ?? ""}
                                  onChange={(e) => updateNode(idx, { language: e.target.value })}
                                  placeholder="python / javascript / html / css"
                                  className="w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                  Kode
                                </label>
                                <textarea
                                  rows={6}
                                  value={node.code ?? ""}
                                  onChange={(e) => updateNode(idx, { code: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-900 text-green-400 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                                  spellCheck={false}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ── QUIZ TAB ───────────────────────────────────────────────── */}
          {activeTab === "quiz" && (
            <>
              {questions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                  Topik ini belum memiliki quiz post-class.
                  <br />
                  <span className="text-xs">Upload ulang JSON untuk menambah soal.</span>
                </div>
              ) : (
                <>
                  {questions.map((q, qIdx) => {
                    const expanded = expandedQuestions[qIdx] ?? false;
                    const LABELS = ["A", "B", "C", "D", "E"];

                    return (
                      <div
                        key={q.id ?? qIdx}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden"
                      >
                        {/* Question header */}
                        <button
                          type="button"
                          onClick={() => toggleQuestion(qIdx)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6 flex-shrink-0">
                              {qIdx + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                              {q.question || <span className="italic text-slate-400">Tanpa pertanyaan</span>}
                            </span>
                          </div>
                          {expanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </button>

                        {/* Question edit fields */}
                        {expanded && (
                          <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100 dark:border-slate-700">
                            {/* Question text */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Pertanyaan
                              </label>
                              <textarea
                                rows={3}
                                value={q.question}
                                onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                              />
                            </div>

                            {/* Options */}
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                                Pilihan Jawaban
                              </label>
                              {q.options.map((opt, oIdx) => (
                                <div key={opt.id} className="flex items-center gap-2">
                                  <span
                                    className={[
                                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                      opt.id === q.correct_option_id
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
                                    ].join(" ")}
                                  >
                                    {LABELS[oIdx] ?? opt.id}
                                  </span>
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Correct answer */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Kunci Jawaban (correct_option_id)
                              </label>
                              <select
                                value={q.correct_option_id}
                                onChange={(e) => updateQuestion(qIdx, { correct_option_id: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              >
                                {q.options.map((opt, oIdx) => (
                                  <option key={opt.id} value={opt.id}>
                                    {LABELS[oIdx] ?? opt.id}: {opt.text.slice(0, 60)}{opt.text.length > 60 ? "…" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Explanation */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                Penjelasan (opsional)
                              </label>
                              <textarea
                                rows={2}
                                value={q.explanation ?? ""}
                                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                                placeholder="Ditampilkan ke siswa setelah menjawab salah"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Rewards */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 space-y-3">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      🎁 Reward Topik
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {(["exp_reward", "coins_reward", "cypeco_exp_reward"] as const).map((field) => (
                        <div key={field}>
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                            {field === "exp_reward" ? "⭐ EXP" : field === "coins_reward" ? "🪙 Coins" : "🐾 Cypeco EXP"}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={rewards[field]}
                            onChange={(e) =>
                              setRewards((prev) => ({
                                ...prev,
                                [field]: Math.max(0, Number(e.target.value)),
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {nodes.length} node · {questions.length} soal quiz
          </div>

          <div className="flex items-center gap-2">
            {saveError && (
              <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{saveError}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
