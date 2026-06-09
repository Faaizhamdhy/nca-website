import { useEffect, useRef, useState, useCallback } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

import 'swiper/css';
import 'swiper/css/pagination';

gsap.registerPlugin(ScrollTrigger);

// ─── Icons ────────────────────────────────────────────────
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconHeart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);
const IconThumbsUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

// ─── Generation data ──────────────────────────────────────
const GENERATIONS = [
  {
    id: 1,
    label: 'Generasi 1',
    subtitle: 'Para Perintis',
    description: 'Generasi pertama yang meletakkan fondasi NCA. Kreator awal yang memulai perjalanan dari nol dan membentuk identitas komunitas.',
    image: '/ncagen1.png',
    accent: '#7c3aed',
    accentLight: '#a78bfa',
  },
  {
    id: 2,
    label: 'Generasi 2',
    subtitle: 'Pengembang Komunitas',
    description: 'Gelombang kreator yang memperluas jangkauan NCA, membawa semangat baru, dan mendorong pertumbuhan yang signifikan.',
    image: '/ncagen2.png',
    accent: '#0ea5e9',
    accentLight: '#38bdf8',
  },
  {
    id: 3,
    label: 'Generasi 3',
    subtitle: 'Generasi Masa Depan',
    description: 'Kreator terbaru yang hadir dengan ide-ide segar, siap membawa NCA ke level berikutnya dengan inovasi dan kreativitas.',
    image: '/ncagen3.png',
    accent: '#f59e0b',
    accentLight: '#fbbf24',
  },
];

// ─── Count-up hook ────────────────────────────────────────
function useCountUp(target, duration = 2200, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || !target) return;
    let frame = 0;
    const totalFrames = Math.round(duration / 16);
    const timer = setInterval(() => {
      frame++;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setCount(Math.floor(eased * target));
      if (frame >= totalFrames) { setCount(target); clearInterval(timer); }
    }, 16);
    return () => clearInterval(timer);
  }, [target, started]);
  return count;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('id-ID');
}

// ─── Stat Card ────────────────────────────────────────────
function StatCard({ Icon, value, label, loading }) {
  return (
    <div style={{
      flex: 1, minWidth: '120px',
      padding: '1.25rem 1rem',
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(15,23,42,0.08)',
      borderRadius: '0.875rem',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      textAlign: 'center',
      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: '#7c3aed', marginBottom: '0.5rem' }}>
        <Icon />
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {loading ? '—' : fmt(value)}
      </div>
      <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

// ─── 3D Gen Slide Card ────────────────────────────────────────────────────
function GenCard3D({ gen, loading, genMemberCounts }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    const rotX = -dy * 10;
    const rotY =  dx * 14;
    el.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`;
    if (glowRef.current) {
      const gx = 45 + dx * 30;
      const gy = 45 + dy * 30;
      glowRef.current.style.background = `radial-gradient(ellipse 60% 50% at ${gx}% ${gy}%, ${gen.accent}35 0%, transparent 70%)`;
      glowRef.current.style.opacity = '1';
    }
  }, [gen.accent]);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (glowRef.current) glowRef.current.style.opacity = '0';
  }, []);

  return (
    <div
      ref={cardRef}
      className="gen-slide-inner"
      style={{
        position: 'relative',
        background: '#1e1b4b',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        transformStyle: 'preserve-3d',
        cursor: 'crosshair',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background image */}
      <img
        src={gen.image}
        alt={gen.label}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
      />

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,32,0.97) 0%, rgba(10,8,32,0.55) 55%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top left, ${gen.accent}15 0%, transparent 60%)` }} />

      {/* Dynamic glow overlay — follows mouse */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0,
          transition: 'opacity 0.3s',
          borderRadius: '1.25rem',
        }}
      />

      {/* Content — with translateZ for depth */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(1.25rem, 3vw, 2rem)',
        transform: 'translateZ(20px)',
      }}>
        {/* Gen badge */}
        <div style={{
          display: 'inline-block',
          padding: '0.22rem 0.7rem', borderRadius: '4px',
          fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
          marginBottom: '0.65rem',
          color: gen.accentLight,
          border: `1px solid ${gen.accent}50`,
          background: `${gen.accent}20`,
          backdropFilter: 'blur(8px)',
          transform: 'translateZ(8px)',
        }}>
          {gen.label}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.875rem)', fontWeight: 800, color: '#fff', marginBottom: '0.45rem', letterSpacing: '-0.01em', fontFamily: '"Plus Jakarta Sans", sans-serif', transform: 'translateZ(6px)' }}>
          {gen.subtitle}
        </h3>

        {/* Description */}
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(0.78rem, 1.5vw, 0.9rem)', lineHeight: 1.65, maxWidth: '520px', marginBottom: '0.875rem' }}>
          {gen.description}
        </p>

        {/* Member count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', transform: 'translateZ(10px)' }}>
          <div style={{ display: 'flex', color: gen.accentLight }}><IconUsers /></div>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            <span style={{ color: gen.accentLight, fontWeight: 700 }}>
              {loading ? '—' : (genMemberCounts[gen.id] || '—')}
            </span>
            {' '}anggota aktif
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function GenerationSlider() {
  const sectionRef = useRef(null);
  const statsRef = useRef(null);
  const [genMemberCounts, setGenMemberCounts] = useState({ 1: 0, 2: 0, 3: 0 });
  const [stats, setStats] = useState({ members: 0, followers: 0, likes: 0, videos: 0 });
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const m = useCountUp(stats.members, 2000, started);
  const f = useCountUp(stats.followers, 2200, started);
  const v = useCountUp(stats.videos, 2300, started);
  const l = useCountUp(stats.likes, 2400, started);

  // Fetch stats
  useEffect(() => {
    supabase.from('members').select('followers, likes, video_count, generation')
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const counts = { 1: 0, 2: 0, 3: 0 };
        data.forEach(m => { if (m.generation) counts[m.generation] = (counts[m.generation] || 0) + 1; });
        setGenMemberCounts(counts);
        setStats({
          members: data.length,
          followers: data.reduce((s, r) => s + (r.followers || 0), 0),
          likes: data.reduce((s, r) => s + (r.likes || 0), 0),
          videos: data.reduce((s, r) => s + (r.video_count || 0), 0),
        });
        setLoading(false);
      });
  }, []);

  // Scroll trigger for stats animation + section entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header fade in
      gsap.from('[data-gen-anim]', {
        y: 24, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' },
      });
      // Counter start
      if (statsRef.current) {
        ScrollTrigger.create({
          trigger: statsRef.current, start: 'top 82%', once: true,
          onEnter: () => setStarted(true),
        });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const activeGen = GENERATIONS[activeIndex];

  return (
    <section
      id="section-generation"
      ref={sectionRef}
      style={{ padding: '5rem 0 6rem', position: 'relative', overflow: 'hidden' }}
    >
      {/* Section divider */}
      <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg,#7c3aed,#db2777)', margin: '0 auto 3.5rem' }} />

      {/* Header */}
      <div data-gen-anim style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1.5rem' }}>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7c3aed', fontWeight: 600 }}>
          Our Journey
        </span>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0F172A', marginTop: '0.65rem', letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Perjalanan Generasi NCA
        </h2>
        <p style={{ marginTop: '0.65rem', fontSize: '0.92rem', color: '#475569', maxWidth: '380px', margin: '0.65rem auto 0', lineHeight: 1.65 }}>
          Dari generasi ke generasi, semangat berkarya terus menyala.
        </p>
      </div>

      {/* ── Swiper Slider — centered peek effect ── */}
      <div data-gen-anim style={{ marginBottom: '2.5rem' }}>
        <style>{`
          .gen-swiper .swiper-pagination-bullet {
            width: 7px !important;
            height: 7px !important;
            background: rgba(15,23,42,0.25) !important;
          }
          .gen-swiper .swiper-pagination-bullet-active {
            background: #7c3aed !important;
            width: 22px !important;
            border-radius: 4px !important;
            transition: width 0.3s, background 0.3s !important;
          }
          .gen-swiper .swiper-slide {
            transition: transform 0.45s cubic-bezier(0.25,1,0.5,1), opacity 0.45s ease !important;
            opacity: 0.4;
            transform: scale(0.88);
          }
          .gen-swiper .swiper-slide-active {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
          /* Responsive aspect ratio for slide cards */
          .gen-slide-inner { padding-top: 95%; }
          @media (min-width: 480px)  { .gen-slide-inner { padding-top: 80%; } }
          @media (min-width: 768px)  { .gen-slide-inner { padding-top: 65%; } }
          @media (min-width: 1024px) { .gen-slide-inner { padding-top: 56%; } }
        `}</style>

        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <Swiper
          className="gen-swiper"
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true, dynamicBullets: false }}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={false}
          centeredSlides
          slidesPerView={1.12}
          spaceBetween={16}
          breakpoints={{
            480:  { slidesPerView: 1.18, spaceBetween: 20 },
            768:  { slidesPerView: 1.25, spaceBetween: 24 },
            1024: { slidesPerView: 1.35, spaceBetween: 28 },
          }}
          onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
          style={{ paddingBottom: '2.5rem' }}
        >
          {GENERATIONS.map((gen, idx) => (
            <SwiperSlide key={gen.id} style={{ borderRadius: '1.25rem', overflow: 'visible' }}>
              <GenCard3D gen={gen} loading={loading} genMemberCounts={genMemberCounts} />
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      </div>

      {/* ── Aggregate Stats ── */}
      <div ref={statsRef} data-gen-anim style={{ padding: '0 1.5rem', maxWidth: '850px', margin: '0 auto 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.875rem' }}>
          <StatCard Icon={IconUsers}    value={m} label="Total Member"    loading={loading} />
          <StatCard Icon={IconUsers}    value={f} label="Total Followers" loading={loading} />
          <StatCard Icon={IconThumbsUp} value={l} label="Total Likes"     loading={loading} />
          <StatCard Icon={IconVideo}    value={v} label="Total Video"     loading={loading} />
        </div>
      </div>

      {/* ── CTA Button ── */}
      <div data-gen-anim style={{ textAlign: 'center', padding: '0 1.5rem' }}>
        <Link
          to="/join"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 2rem', borderRadius: '0.75rem',
            fontWeight: 700, fontSize: '0.9rem', color: '#fff', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            boxShadow: '0 4px 20px rgba(124,58,237,0.28)',
            textDecoration: 'none', transition: 'opacity 0.2s, transform 0.2s',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Bergabung ke NCA <IconArrowRight />
        </Link>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
          Daftarkan diri dan mulai berkarya bersama kami.
        </p>
      </div>
    </section>
  );
}
