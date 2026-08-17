"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import "./landing.css";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Aditya R.",
    level: "Kelas Beginner",
    text: "Materi sangat terstruktur! Saya yang sebelumnya tidak tahu sama sekali tentang coding, sekarang sudah bisa bikin website sendiri.",
    stars: 5,
    color: "#7cc62f",
    initial: "A",
  },
  {
    name: "Siti N.",
    level: "Kelas Intermediate",
    text: "Sistem quiz-nya membantu banget buat ngecek pemahaman. Mentor juga fast-respond kalau ada yang bingung.",
    stars: 5,
    color: "#3b82f6",
    initial: "S",
  },
  {
    name: "Bima P.",
    level: "Kelas Beginner",
    text: "Meeting onlinenya fleksibel dan ada countdown-nya jadi nggak pernah ketinggalan. Recommended banget!",
    stars: 5,
    color: "#f59e0b",
    initial: "B",
  },
  {
    name: "Rina M.",
    level: "Kelas Intensif",
    text: "Progress saya terpantau dengan baik. Unlock materi bertahap bikin saya termotivasi untuk terus belajar.",
    stars: 5,
    color: "#a855f7",
    initial: "R",
  },
  {
    name: "Dimas K.",
    level: "Kelas Intermediate",
    text: "Kurikulum bits2bytes sangat up-to-date. Ilmu yang dipelajari langsung bisa dipraktikkan di dunia kerja.",
    stars: 5,
    color: "#ef4444",
    initial: "D",
  },
  {
    name: "Yuni S.",
    level: "Kelas Beginner",
    text: "Sebagai ibu rumah tangga yang ingin up-skill, bits2bytes sangat ramah pemula. Trima kasih!",
    stars: 5,
    color: "#06b6d4",
    initial: "Y",
  },
  {
    name: "Fajar A.",
    level: "Kelas Intensif",
    text: "Investasi terbaik! Dalam 3 bulan saya sudah bisa freelance dan dapat proyek pertama saya.",
    stars: 5,
    color: "#f97316",
    initial: "F",
  },
  {
    name: "Laila H.",
    level: "Kelas Intermediate",
    text: "Quiz setelah setiap topik bikin materi lebih nempel. Dan invoice bulanannya gampang banget ditagihnya.",
    stars: 5,
    color: "#10b981",
    initial: "L",
  },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "Kurikulum Terstruktur",
    desc: "Materi dirancang dari dasar hingga mahir secara sistematis. Setiap topik saling terhubung membentuk fondasi yang kuat.",
  },
  {
    icon: "📅",
    title: "Meeting Online Terjadwal",
    desc: "Sesi live dengan mentor langsung. Countdown timer otomatis agar kamu tidak pernah ketinggalan kelas.",
  },
  {
    icon: "🧠",
    title: "Quiz & Assessment",
    desc: "Setiap topik diakhiri dengan quiz untuk mengukur pemahaman. Lihat skor dan riwayat belajarmu secara real-time.",
  },
  {
    icon: "📈",
    title: "Pantau Progress",
    desc: "Dashboard personal yang menampilkan progres belajar, pertemuan selesai, dan pencapaianmu.",
  },
  {
    icon: "🔓",
    title: "Materi Unlock Bertahap",
    desc: "Sistem gamifikasi: selesaikan satu topik untuk membuka topik berikutnya. Belajar jadi lebih terarah.",
  },
  {
    icon: "👨‍💻",
    title: "Mentor Berpengalaman",
    desc: "Dibimbing langsung oleh praktisi industri yang aktif. Dapatkan feedback nyata, bukan sekadar teori.",
  },
];

const CURRICULUM = [
  {
    title: "Web Development Fundamentals",
    level: "beginner",
    topics: ["HTML5 & Semantic Markup", "CSS3 & Responsive Design", "JavaScript ES6+", "DOM Manipulation"],
  },
  {
    title: "Frontend Intermediate",
    level: "inter",
    topics: ["React.js Dasar & Hooks", "State Management", "API Integration (Fetch/Axios)", "Git & Version Control"],
  },
  {
    title: "Backend Development",
    level: "advanced",
    topics: ["Node.js & Express", "REST API Design", "Database (PostgreSQL / Supabase)", "Authentication & Security"],
  },
];

const PRICING = [
  {
    name: "Starter",
    emoji: "🌱",
    tagline: "Cocok untuk pemula yang baru memulai",
    price: null,
    featured: false,
    features: [
      "Akses 1 modul aktif",
      "4× meeting online / bulan",
      "Quiz & assessment dasar",
      "Progress dashboard",
      "Materi unlock bertahap",
    ],
  },
  {
    name: "Regular",
    emoji: "🚀",
    tagline: "Paling banyak dipilih siswa aktif",
    price: null,
    featured: true,
    features: [
      "Akses semua modul aktif",
      "8× meeting online / bulan",
      "Semua quiz & assessment",
      "Progress dashboard lengkap",
      "Materi unlock bertahap",
      "Rekaman sesi meeting",
    ],
  },
  {
    name: "Intensif",
    emoji: "⭐",
    tagline: "Untuk kamu yang ingin belajar cepat",
    price: null,
    featured: false,
    features: [
      "Semua fitur Regular",
      "Prioritas jadwal meeting",
      "Review project personal",
      "Feedback kode langsung",
      "Konsultasi karier",
      "Sertifikat penyelesaian",
    ],
  },
];

const JOURNEY = [
  { icon: "📝", step: "01", title: "Daftar", desc: "Buat akun dan pilih paket yang sesuai kebutuhanmu" },
  { icon: "📚", step: "02", title: "Pilih Modul", desc: "Akses kurikulum terstruktur sesuai level-mu" },
  { icon: "💻", step: "03", title: "Ikuti Meeting", desc: "Sesi live dengan mentor berpengalaman" },
  { icon: "🧠", step: "04", title: "Kerjakan Quiz", desc: "Uji pemahaman dan unlock topik berikutnya" },
  { icon: "🏆", step: "05", title: "Raih Sertifikat", desc: "Buktikan keahlianmu dengan sertifikat resmi" },
];

const WA_LINK =
  "https://wa.me/6283822194107?text=Hai%20saya%20tertarik%20dengan%20bits2bytes%20dan%20ingin%20mendaftar%2C%20boleh%20minta%20informasi%20harga%20paket%3F";

// ─── Helper: useIntersection ───────────────────────────────────────────────────
function useIntersection(ref: React.RefObject<Element | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

// ─── Counter hook ──────────────────────────────────────────────────────────────
function useCounter(target: number, visible: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return count;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav className={`lp-navbar${scrolled ? " scrolled" : ""}`} role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer" }} onClick={() => scrollTo("hero")}>
        <Image
          src={scrolled ? "/b2blight.webp" : "/b2bdark.webp"}
          alt="bits2bytes logo"
          width={40}
          height={40}
          priority
        />
        <span style={{
          fontWeight: 800,
          fontSize: "1.15rem",
          color: scrolled ? "#1a2a4a" : "#fff",
          letterSpacing: "-0.02em",
        }}>
          bits<span style={{ color: "#7cc62f" }}>2</span>bytes
        </span>
      </div>

      {/* Desktop links */}
      <div className="desktop-nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
        {[
          { label: "Fitur", id: "features" },
          { label: "Kurikulum", id: "curriculum" },
          { label: "Paket", id: "pricing" },
          { label: "Testimoni", id: "testimonials" },
        ].map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => scrollTo(item.id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.9rem", fontWeight: 600,
              color: scrolled ? "#334155" : "rgba(255,255,255,0.85)",
              transition: "color 0.2s",
              padding: 0,
            }}
            onMouseOver={(e) => { (e.target as HTMLButtonElement).style.color = "#7cc62f"; }}
            onMouseOut={(e) => { (e.target as HTMLButtonElement).style.color = scrolled ? "#334155" : "rgba(255,255,255,0.85)"; }}
          >
            {item.label}
          </button>
        ))}
        <Link href="/login" id="nav-login" className="btn-lime" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
          Masuk →
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        id="mobile-menu-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        style={{
          display: "none",
          background: "none", border: "none",
          cursor: "pointer", padding: "0.25rem",
          color: scrolled ? "#1a2a4a" : "#fff",
          fontSize: "1.5rem",
        }}
        className="mobile-menu-btn"
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: "absolute", top: "68px", left: 0, right: 0,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(26,42,74,0.10)",
          padding: "1rem 1.5rem",
          display: "flex", flexDirection: "column", gap: "0.75rem",
        }}>
          {[
            { label: "Fitur", id: "features" },
            { label: "Kurikulum", id: "curriculum" },
            { label: "Paket", id: "pricing" },
            { label: "Testimoni", id: "testimonials" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "1rem", fontWeight: 600, color: "#1a2a4a",
                textAlign: "left", padding: "0.25rem 0",
              }}
            >
              {item.label}
            </button>
          ))}
          <Link href="/login" className="btn-lime" style={{ textAlign: "center", marginTop: "0.5rem" }}>
            Masuk →
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav-links { display: none !important; }
          .mobile-menu-btn   { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" className="hero-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: "68px" }}>
      {/* Particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className={`particle p${i + 1}`} aria-hidden="true" />
      ))}

      <div className="lp-container" style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center", padding: "4rem 1.5rem" }}>
        {/* Left: text */}
        <div>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(124,198,47,0.15)", border: "1px solid rgba(124,198,47,0.4)",
            borderRadius: "999px", padding: "6px 16px", marginBottom: "1.5rem",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7cc62f", display: "inline-block", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#a8e063", letterSpacing: "0.05em" }}>
              Platform Belajar Coding #1
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: "1.25rem",
            letterSpacing: "-0.03em",
          }}>
            Dari <span style={{ color: "#7cc62f" }}>Bits</span> ke{" "}
            <span style={{ color: "#7cc62f" }}>Bytes</span>,<br />
            Dari Pemula ke<br />
            <span className="typing-line" style={{ color: "#fff" }}>Developer Profesional</span>
          </h1>

          <p style={{
            fontSize: "1.05rem", color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7, marginBottom: "2rem", maxWidth: "480px",
          }}>
            Kuasai coding dengan kurikulum terstruktur, bimbingan mentor aktif,
            dan sistem belajar yang terbukti menghasilkan developer siap kerja.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" id="hero-cta-primary" className="btn-lime">
              Mulai Belajar Sekarang →
            </a>
            <button
              id="hero-cta-secondary"
              className="btn-outline-white"
              onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}
            >
              Lihat Kurikulum
            </button>
          </div>

          {/* Mini stats */}
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {[
              { value: "500+", label: "Siswa Aktif" },
              { value: "4.9★", label: "Rating" },
              { value: "95%", label: "Lulus Quiz" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#7cc62f" }}>{s.value}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: dashboard mockup card */}
        <div style={{ display: "flex", justifyContent: "center" }} className="hero-mockup-wrapper">
          <div style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(124,198,47,0.3)",
            borderRadius: "24px",
            padding: "1.75rem",
            backdropFilter: "blur(8px)",
            maxWidth: "380px",
            width: "100%",
            animation: "float-card 5s ease-in-out infinite",
          }}>
            {/* Mock header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7cc62f,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff" }}>A</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>Aditya Rahmat</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.75rem" }}>Web Development · Beginner</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem" }}>Progress Modul</span>
                <span style={{ color: "#7cc62f", fontWeight: 700, fontSize: "0.8rem" }}>65%</span>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.15)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "65%", background: "linear-gradient(90deg, #7cc62f, #a8e063)", borderRadius: "999px" }} />
              </div>
            </div>

            {/* Topic list */}
            {[
              { title: "HTML5 & Semantik", done: true },
              { title: "CSS3 Responsive", done: true },
              { title: "JavaScript ES6+", done: false, active: true },
              { title: "DOM Manipulation", done: false },
            ].map((t) => (
              <div key={t.title} style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                padding: "0.5rem 0.75rem", borderRadius: "10px", marginBottom: "0.375rem",
                background: t.active ? "rgba(124,198,47,0.15)" : "rgba(255,255,255,0.05)",
                border: t.active ? "1px solid rgba(124,198,47,0.4)" : "1px solid transparent",
              }}>
                <span style={{ fontSize: "0.9rem" }}>{t.done ? "✅" : t.active ? "▶️" : "🔒"}</span>
                <span style={{ color: t.done ? "rgba(255,255,255,0.55)" : "#fff", fontSize: "0.82rem", fontWeight: t.active ? 600 : 400, textDecoration: t.done ? "line-through" : "none" }}>
                  {t.title}
                </span>
              </div>
            ))}

            {/* Next meeting badge */}
            <div style={{
              marginTop: "1rem", padding: "0.75rem 1rem",
              background: "rgba(124,198,47,0.12)", border: "1px solid rgba(124,198,47,0.35)",
              borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.625rem",
            }}>
              <span style={{ fontSize: "1.1rem" }}>📅</span>
              <div>
                <div style={{ color: "#7cc62f", fontSize: "0.78rem", fontWeight: 700 }}>Meeting Berikutnya</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>Senin, 18 Agt · 19:00 WIB</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-12px); }
        }
        @media (max-width: 900px) {
          #hero > .lp-container { grid-template-columns: 1fr !important; padding: 2rem 1rem !important; }
          .hero-mockup-wrapper { display: none !important; }
        }
      `}</style>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  const stats = [
    { target: 500, suffix: "+", label: "Siswa Bergabung", icon: "👥" },
    { target: 12, suffix: "+", label: "Modul Tersedia", icon: "📚" },
    { target: 95, suffix: "%", label: "Lulus Quiz", icon: "🧠" },
    { target: 49, suffix: "", label: "Rating Rata-rata", icon: "⭐", display: "4.9" },
  ];

  const c0 = useCounter(stats[0].target, visible);
  const c1 = useCounter(stats[1].target, visible);
  const c2 = useCounter(stats[2].target, visible);

  return (
    <section style={{ background: "#fff", borderTop: "1px solid rgba(26,42,74,0.08)", borderBottom: "1px solid rgba(26,42,74,0.08)" }}>
      <div className="lp-container" style={{ padding: "3.5rem 1.5rem" }}>
        <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }} className="stats-grid">
          {stats.map((s, i) => {
            const counts = [c0, c1, c2];
            const val = s.display ?? `${counts[i] ?? s.target}${s.suffix}`;
            return (
              <div key={s.label} className={`stat-card fade-up${visible ? " visible" : ""} fade-up-delay-${i + 1}`}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                <div className="stat-number">{val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 640px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section id="features" className="lp-section" style={{ background: "#f8faff" }}>
      <div className="lp-container">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="lp-section-label">Keunggulan</span>
          <h2 className="lp-section-title">
            Kenapa <span>bits2bytes?</span>
          </h2>
          <p className="lp-section-sub" style={{ margin: "0.75rem auto 0" }}>
            Bukan sekadar kursus online biasa — ekosistem belajar yang dirancang untuk menghasilkan developer nyata.
          </p>
        </div>

        <div
          ref={ref}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}
          className="features-grid"
        >
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`feature-card fade-up${visible ? " visible" : ""} fade-up-delay-${i + 1}`}>
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>{f.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 900px)  { .features-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px)  { .features-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ─── Curriculum ───────────────────────────────────────────────────────────────
function CurriculumSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  const LEVEL_LABEL: Record<string, string> = { beginner: "Beginner", inter: "Intermediate", advanced: "Advanced" };

  return (
    <section id="curriculum" className="lp-section" style={{ background: "#fff" }}>
      <div className="lp-container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "4rem", alignItems: "start" }} className="curriculum-grid">
          {/* Left info */}
          <div ref={ref} className={`fade-up${visible ? " visible" : ""}`}>
            <span className="lp-section-label">Kurikulum</span>
            <h2 className="lp-section-title">
              Pelajari <span>ilmu nyata</span> yang dipakai industri
            </h2>
            <p className="lp-section-sub">
              Dari HTML hingga deployment — setiap modul disusun bersama praktisi agar relevan dengan kebutuhan dunia kerja saat ini.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "✅", text: "Update rutin mengikuti tren industri" },
                { icon: "✅", text: "Proyek nyata di setiap modul" },
                { icon: "✅", text: "Modul baru terus ditambahkan" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.9rem", color: "#334155" }}>
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" id="curriculum-cta" className="btn-lime" style={{ marginTop: "2rem", display: "inline-flex" }}>
              Daftar & Mulai Belajar →
            </a>
          </div>

          {/* Right accordion */}
          <div>
            {CURRICULUM.map((mod, i) => (
              <div key={mod.title} className="curriculum-item">
                <button
                  id={`curriculum-toggle-${i}`}
                  className="curriculum-header"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  aria-expanded={openIdx === i}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>
                      {i === 0 ? "🌱" : i === 1 ? "🚀" : "⚡"}
                    </span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{mod.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                        {mod.topics.length} topik
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <span className={`level-badge level-${mod.level}`}>{LEVEL_LABEL[mod.level]}</span>
                    <span style={{ color: "#7cc62f", fontSize: "1.1rem", transition: "transform 0.3s", transform: openIdx === i ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                  </div>
                </button>
                <div className={`curriculum-body${openIdx === i ? " open" : ""}`}>
                  {mod.topics.map((t, ti) => (
                    <div key={t} className="curriculum-topic">
                      <span style={{ color: "#7cc62f" }}>▸</span>
                      <span>{t}</span>
                      {ti >= 2 && <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#94a3b8" }}>🔒 unlock setelah topik sebelumnya</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "1rem", textAlign: "center" }}>
              * Modul terus bertambah. Siswa otomatis mendapat akses modul baru.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .curriculum-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section id="pricing" className="lp-section" style={{ background: "#f8faff" }}>
      <div className="lp-container">
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="lp-section-label">Paket Belajar</span>
          <h2 className="lp-section-title">
            Pilih <span>paket</span> yang sesuai
          </h2>
          <p className="lp-section-sub" style={{ margin: "0.75rem auto 0" }}>
            Semua paket menggunakan sistem tagihan bulanan via invoice.{" "}
            <strong style={{ color: "#1a2a4a" }}>Tagihan bulan ini dikirim di awal bulan berikutnya.</strong>
          </p>
        </div>

        <div
          ref={ref}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", alignItems: "start" }}
          className="pricing-grid"
        >
          {PRICING.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`pricing-card fade-up${visible ? " visible" : ""} fade-up-delay-${i + 1}${pkg.featured ? " featured" : ""}`}
            >
              {pkg.featured && <div className="pricing-badge">⭐ Paling Populer</div>}

              <div style={{ textAlign: "center", marginBottom: "1.5rem", paddingTop: pkg.featured ? "0.5rem" : "0" }}>
                <div style={{ fontSize: "2.25rem", marginBottom: "0.5rem" }}>{pkg.emoji}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>{pkg.name}</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.25rem" }}>{pkg.tagline}</div>

                <div style={{
                  marginTop: "1.25rem", padding: "0.875rem",
                  background: pkg.featured ? "rgba(124,198,47,0.1)" : "#f8faff",
                  borderRadius: "12px",
                  border: pkg.featured ? "1px solid rgba(124,198,47,0.3)" : "1px solid rgba(26,42,74,0.08)",
                }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Mulai dari</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: pkg.featured ? "#5fa020" : "#1a2a4a" }}>
                    Hubungi Kami
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "2px" }}>
                    Invoice dikirim tiap awal bulan
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(26,42,74,0.08)", paddingTop: "1.25rem", marginBottom: "1.5rem" }}>
                {pkg.features.map((f) => (
                  <div key={f} className="pricing-check">{f}</div>
                ))}
              </div>

              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                id={`pricing-cta-${pkg.name.toLowerCase()}`}
                className={pkg.featured ? "btn-lime" : "btn-outline-navy"}
                style={{ display: "block", textAlign: "center", width: "100%", boxSizing: "border-box" }}
              >
                💬 Tanya via WhatsApp
              </a>
            </div>
          ))}
        </div>

        {/* Invoice info box */}
        <div style={{
          marginTop: "2.5rem", padding: "1.25rem 1.5rem",
          background: "rgba(26,42,74,0.05)", border: "1px solid rgba(26,42,74,0.12)",
          borderRadius: "16px", display: "flex", alignItems: "flex-start", gap: "0.875rem",
        }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>📄</span>
          <div>
            <div style={{ fontWeight: 700, color: "#1a2a4a", marginBottom: "0.25rem" }}>Tentang Sistem Invoice</div>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
              Pembayaran dilakukan secara bulanan. Invoice untuk kegiatan belajar bulan ini akan dikirimkan
              kepada siswa pada awal bulan berikutnya. Tidak ada biaya tersembunyi.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; } }
      `}</style>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection() {
  // Duplicate for seamless loop
  const row1 = [...TESTIMONIALS.slice(0, 4), ...TESTIMONIALS.slice(0, 4)];
  const row2 = [...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(4)];

  const Card = ({ t }: { t: typeof TESTIMONIALS[0] }) => (
    <div className="testimonial-card">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
        <div className="testimonial-avatar" style={{ background: t.color }}>{t.initial}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{t.name}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{t.level}</div>
        </div>
      </div>
      <div className="testimonial-stars">{"★".repeat(t.stars)}</div>
      <p style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.65, marginTop: "0.5rem" }}>
        "{t.text}"
      </p>
    </div>
  );

  return (
    <section id="testimonials" className="lp-section" style={{ background: "#fff", overflow: "hidden" }}>
      <div className="lp-container" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <span className="lp-section-label">Testimoni</span>
        <h2 className="lp-section-title">
          Kata mereka yang sudah <span>bergabung</span>
        </h2>
        <p className="lp-section-sub" style={{ margin: "0.75rem auto 0" }}>
          Lebih dari 500 siswa telah memulai perjalanan coding mereka bersama bits2bytes.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Row 1 — scroll left */}
        <div className="testimonial-track-wrapper">
          <div className="testimonial-track">
            {row1.map((t, i) => <Card key={`r1-${i}`} t={t} />)}
          </div>
        </div>
        {/* Row 2 — scroll right */}
        <div className="testimonial-track-wrapper">
          <div className="testimonial-track reverse">
            {row2.map((t, i) => <Card key={`r2-${i}`} t={t} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Journey ──────────────────────────────────────────────────────────────────
function JourneySection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section className="lp-section" style={{ background: "#f8faff" }}>
      <div className="lp-container">
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span className="lp-section-label">Cara Kerja</span>
          <h2 className="lp-section-title">
            Perjalanan belajarmu <span>dimulai di sini</span>
          </h2>
        </div>

        <div
          ref={ref}
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}
          className="journey-container"
        >
          {JOURNEY.map((j, i) => (
            <div
              key={j.step}
              className={`journey-step fade-up${visible ? " visible" : ""} fade-up-delay-${i + 1}`}
              style={{ minWidth: "140px", maxWidth: "180px", flex: "1" }}
            >
              <div className="journey-icon">{j.icon}</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7cc62f", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>
                STEP {j.step}
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.375rem" }}>{j.title}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", lineHeight: 1.55 }}>{j.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section className="cta-section lp-section">
      <div className="cta-glow" aria-hidden="true" />
      <div className="lp-container" style={{ textAlign: "center", position: "relative" }}>
        <div ref={ref} className={`fade-up${visible ? " visible" : ""}`}>
          <h2 style={{
            fontSize: "clamp(1.75rem, 4vw, 3rem)",
            fontWeight: 900, color: "#fff",
            lineHeight: 1.2, marginBottom: "1rem",
          }}>
            Siap memulai perjalananmu<br />
            sebagai <span style={{ color: "#7cc62f" }}>Developer</span>?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", marginBottom: "2rem", maxWidth: "480px", margin: "0 auto 2rem" }}>
            Ribuan developer memulai dari nol bersama bits2bytes. Giliran kamu!
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              id="cta-final-primary"
              className="btn-lime"
              style={{ fontSize: "1.05rem", padding: "0.875rem 2rem" }}
            >
              💬 Daftar via WhatsApp
            </a>
            <button
              id="cta-final-secondary"
              className="btn-outline-white"
              onClick={() => document.getElementById("curriculum")?.scrollIntoView({ behavior: "smooth" })}
            >
              Lihat Kurikulum
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="lp-footer" style={{ padding: "3.5rem 0 2rem" }}>
      <div className="lp-container">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }} className="footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
              <Image src="/b2bdark.webp" alt="bits2bytes" width={36} height={36} />
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>
                bits<span style={{ color: "#7cc62f" }}>2</span>bytes
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.7, maxWidth: "280px", color: "#64748b" }}>
              Platform belajar coding terstruktur untuk pemula hingga professional.
              Belajar nyata, bimbingan nyata, hasil nyata.
            </p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              id="footer-wa"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                marginTop: "1.25rem", color: "#7cc62f",
                fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
              }}
            >
              <span>💬</span> +62 838-2219-4107
            </a>
          </div>

          {/* Nav links */}
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Platform
            </div>
            {[
              { label: "Fitur", id: "features" },
              { label: "Kurikulum", id: "curriculum" },
              { label: "Paket Harga", id: "pricing" },
              { label: "Testimoni", id: "testimonials" },
            ].map((l) => (
              <div key={l.label} style={{ marginBottom: "0.5rem" }}>
                <button
                  onClick={() => document.getElementById(l.id)?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: "0.875rem", color: "#64748b", padding: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseOver={(e) => { (e.target as HTMLButtonElement).style.color = "#7cc62f"; }}
                  onMouseOut={(e) => { (e.target as HTMLButtonElement).style.color = "#64748b"; }}
                >
                  {l.label}
                </button>
              </div>
            ))}
          </div>

          {/* Akun */}
          <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
              Akun
            </div>
            <div style={{ marginBottom: "0.5rem" }}>
              <Link href="/login" id="footer-login" style={{ fontSize: "0.875rem", color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#7cc62f"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#64748b"; }}
              >
                Masuk / Login
              </Link>
            </div>
            <div style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#475569" }}>
              <div style={{ fontWeight: 700, color: "#64748b", marginBottom: "0.5rem" }}>Jam Operasional</div>
              <div>Senin – Jumat: 08.00 – 20.00</div>
              <div>Sabtu – Minggu: 09.00 – 17.00</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#475569", margin: 0 }}>
            © {new Date().getFullYear()} bits2bytes. All rights reserved.
          </p>
          <p style={{ fontSize: "0.8rem", color: "#334155", margin: 0 }}>
            Made with <span style={{ color: "#7cc62f" }}>♥</span> for future developers
          </p>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr !important; gap: 2rem !important; } }
      `}</style>
    </footer>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="landing-root">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <CurriculumSection />
        <PricingSection />
        <TestimonialsSection />
        <JourneySection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
