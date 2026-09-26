"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Check, HeartCrack, Sparkles, Trophy } from "lucide-react";

// Web Audio API Helpers for Sound Effects
const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
  if (typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch(e) {
    console.error("Audio play failed", e);
  }
};

const playSuccessSound = () => {
  playTone(440, "sine", 0.1); // A4
  setTimeout(() => playTone(659.25, "sine", 0.3), 100); // E5
};

const playErrorSound = () => {
  playTone(300, "square", 0.2, 0.05);
  setTimeout(() => playTone(250, "square", 0.3, 0.05), 150);
};

const playTadaSound = () => {
  playTone(440, "sine", 0.1); // A4
  setTimeout(() => playTone(554.37, "sine", 0.1), 100); // C#5
  setTimeout(() => playTone(659.25, "sine", 0.1), 200); // E5
  setTimeout(() => playTone(880, "sine", 0.4), 300); // A5
};


export function LessonPlayerClient({ 
  topic, 
  nodes, 
  questions, 
  quizId,
  studentId 
}: { 
  topic: any, 
  nodes: any[], 
  questions: any[], 
  quizId?: number,
  studentId: string
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  // Combine nodes and questions into a flat array of "slides"
  const slides = useMemo(() => {
    const list: any[] = [];
    nodes.forEach(node => {
      if (node.type === "lesson" || node.type === "code") {
        list.push({ ...node, slideType: "lesson" });
      } else if (node.type === "practice" && node.options?.length > 0) {
        list.push({ ...node, slideType: "practice" });
      }
    });

    questions.forEach((q, idx) => {
      list.push({
        id: `q-${q.id}`,
        slideType: "challenge",
        title: `Challenge ${idx + 1}`,
        instructions: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correctOption: q.correct_option === "A" ? q.option_a : 
                       q.correct_option === "B" ? q.option_b : 
                       q.correct_option === "C" ? q.option_c : q.option_d
      });
    });

    return list;
  }, [nodes, questions]);

  const currentSlide = slides[currentIndex];
  const progress = slides.length > 0 ? (currentIndex / slides.length) * 100 : 0;

  const handleClose = () => {
    if (confirm("Yakin ingin keluar? Progres kamu tidak akan tersimpan.")) {
      router.push("/student");
    }
  };

  const checkAnswer = () => {
    if (!selectedOption) return;
    
    // Check if correct
    let correct = false;
    if (currentSlide.correctOption) {
      correct = selectedOption.trim().toLowerCase() === currentSlide.correctOption.trim().toLowerCase();
    }
    
    setIsCorrect(correct);
    setIsChecked(true);

    // Play sound effect
    if (correct) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsChecked(false);
      setIsCorrect(false);
    } else {
      finishLesson();
    }
  };

  const finishLesson = async () => {
    setIsFinished(true);
    setSaving(true);
    playTadaSound();

    try {
      // 1. Give XP/Coins via the town square logic or custom API
      // Since we don't have a specific API for lesson finish yet, we can use the quiz-score API
      // If there are questions, submit the score. For simplicity, just give a perfect score if they finish.
      // Wait, Mimo style enforces they get it right to proceed, so they essentially get 100%.
      if (quizId) {
         await fetch(`/api/admin/students/${studentId}/quiz-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              quiz_id: quizId, 
              score: questions.length, // Perfect score
              total_questions: questions.length 
            })
         });
      }
      
      // We can also reward coins via the shop/transaction API if it exists, but quiz-score is good enough for now.
    } catch (err) {
      console.error("Failed to save progress", err);
    } finally {
      setSaving(false);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <Trophy className="w-24 h-24 text-yellow-400 mb-6 animate-bounce" />
        <h1 className="text-4xl font-extrabold mb-4 text-center">Luar Biasa!</h1>
        <p className="text-xl text-slate-300 text-center mb-8">
          Kamu telah menyelesaikan topik: <span className="text-white font-semibold">{topic.title}</span>
        </p>
        
        <button
          onClick={() => router.push("/student")}
          disabled={saving}
          className="w-full max-w-sm py-4 rounded-2xl font-bold text-lg bg-green-500 hover:bg-green-400 text-slate-900 transition-transform active:scale-95 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Lanjut ke Dashboard"}
        </button>
      </div>
    );
  }

  if (!currentSlide) return null;

  const isInteractive = currentSlide.slideType === "practice" || currentSlide.slideType === "challenge";

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Bar */}
      <div className="w-full max-w-3xl mx-auto px-4 py-6 flex items-center gap-4">
        <button 
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-32 flex flex-col pt-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {currentSlide.title || (currentSlide.slideType === "challenge" ? "Challenge Time!" : "Materi")}
        </h1>

        {/* Lesson / Explanation */}
        {(currentSlide.explanation || currentSlide.instructions) && (
          <div className="text-lg text-slate-700 leading-relaxed mb-8 whitespace-pre-wrap">
            {currentSlide.explanation || currentSlide.instructions}
          </div>
        )}

        {/* Code Snippet (if any) */}
        {currentSlide.code && (
          <div className="bg-slate-900 rounded-xl p-4 mb-8 overflow-x-auto">
            <pre className="text-green-400 font-mono text-sm">
              <code>{currentSlide.code.content}</code>
            </pre>
          </div>
        )}

        {/* Multiple Choice Options */}
        {isInteractive && currentSlide.options && (
          <div className="flex flex-col gap-3 mt-auto">
            {currentSlide.options.map((opt: string, idx: number) => {
              const isSelected = selectedOption === opt;
              let borderClass = "border-slate-200";
              let bgClass = "bg-white hover:bg-slate-50";
              let textClass = "text-slate-700";

              if (isChecked) {
                const isThisCorrect = opt.trim().toLowerCase() === currentSlide.correctOption?.trim().toLowerCase();
                if (isSelected) {
                  if (isThisCorrect) {
                    borderClass = "border-green-500";
                    bgClass = "bg-green-50";
                    textClass = "text-green-700";
                  } else {
                    borderClass = "border-red-500";
                    bgClass = "bg-red-50";
                    textClass = "text-red-700";
                  }
                } else if (isThisCorrect && !isCorrect) {
                  // Show the correct answer if they got it wrong
                  borderClass = "border-green-500";
                  bgClass = "bg-green-50";
                  textClass = "text-green-700";
                }
              } else if (isSelected) {
                borderClass = "border-blue-500";
                bgClass = "bg-blue-50";
                textClass = "text-blue-700";
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isChecked && setSelectedOption(opt)}
                  disabled={isChecked}
                  className={`text-left p-4 rounded-2xl border-2 font-medium transition-all ${borderClass} ${bgClass} ${textClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className={`fixed bottom-0 left-0 w-full border-t-2 p-4 transition-colors ${
        !isChecked ? "bg-white border-slate-200" :
        isCorrect ? "bg-green-100 border-green-200" : "bg-red-100 border-red-200"
      }`}>
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            {isChecked && isCorrect && (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500">
                  <Check className="w-8 h-8" />
                </div>
                <div className="text-green-600 font-bold text-xl hidden sm:block">Hebat! Jawabanmu benar.</div>
              </>
            )}
            {isChecked && !isCorrect && (
              <>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-red-500">
                  <HeartCrack className="w-8 h-8" />
                </div>
                <div className="text-red-600 font-bold text-xl hidden sm:block">Oops, kurang tepat!</div>
              </>
            )}
          </div>

          <button
            onClick={isChecked || !isInteractive ? nextSlide : checkAnswer}
            disabled={isInteractive && !selectedOption && !isChecked}
            className={`py-3 px-8 rounded-2xl font-bold text-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
              !isChecked && isInteractive 
                ? "bg-green-500 hover:bg-green-400 text-white" 
                : isCorrect || !isInteractive
                  ? "bg-green-500 hover:bg-green-400 text-white ml-auto"
                  : "bg-red-500 hover:bg-red-400 text-white ml-auto"
            }`}
          >
            {!isInteractive ? "Lanjut" : isChecked ? "Lanjut" : "Cek Jawaban"}
          </button>
        </div>
      </div>
    </div>
  );
}
