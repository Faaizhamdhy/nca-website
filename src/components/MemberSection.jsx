import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

// ─── Constants ────────────────────────────────────────────
const PAGE_SIZE = 8;
const DEBOUNCE_MS = 300;

// Full Unicode/CJK/Emoji font stack — prevents tofu boxes on Japanese/Korean/symbol nicknames
const FONT_STACK = [
  '"Plus Jakarta Sans"',
  '"Noto Sans JP"',
  '"Noto Sans KR"',
  '"Yu Gothic UI"',
  'Meiryo',
  'system-ui',
  '-apple-system',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Noto Color Emoji"',
].join(', ');

// ─── Unicode Math Normalizer ──────────────────────────────
// Converts fancy TikTok mathematical Unicode letters back to readable ASCII
// e.g. 𝙉𝙆-𝙇𝙞𝙩𝙩𝙡𝙚 → NK-Little   𝐍𝐂𝐀 → NCA   ᭄ → (removed)
const MATH_RANGES = [
  [0x1D400,0x1D419,65],[0x1D41A,0x1D433,97], // Bold A-Z a-z
  [0x1D434,0x1D44D,65],[0x1D44E,0x1D467,97], // Italic
  [0x1D468,0x1D481,65],[0x1D482,0x1D49B,97], // Bold Italic
  [0x1D49C,0x1D4B5,65],[0x1D4B6,0x1D4CF,97], // Script
  [0x1D4D0,0x1D4E9,65],[0x1D4EA,0x1D503,97], // Bold Script
  [0x1D504,0x1D51D,65],[0x1D51E,0x1D537,97], // Fraktur
  [0x1D538,0x1D551,65],[0x1D552,0x1D56B,97], // Double-Struck
  [0x1D56C,0x1D585,65],[0x1D586,0x1D59F,97], // Bold Fraktur
  [0x1D5A0,0x1D5B9,65],[0x1D5BA,0x1D5D3,97], // Sans-Serif
  [0x1D5D4,0x1D5ED,65],[0x1D5EE,0x1D607,97], // Sans-Serif Bold
  [0x1D608,0x1D621,65],[0x1D622,0x1D63B,97], // Sans-Serif Italic
  [0x1D63C,0x1D655,65],[0x1D656,0x1D66F,97], // Sans-Serif Bold Italic ← 𝙉𝙆
  [0x1D670,0x1D689,65],[0x1D68A,0x1D6A3,97], // Monospace
  [0x1D7CE,0x1D7D7,48],[0x1D7D8,0x1D7E1,48], // Bold/Double digits 0-9
  [0x1D7E2,0x1D7EB,48],[0x1D7EC,0x1D7F5,48], // Sans/Sans-Bold digits
  [0x1D7F6,0x1D7FF,48],                       // Monospace digits
];

// Fullwidth ASCII: ａ-ｚ (U+FF41-FF5A), Ａ-Ｚ (U+FF21-FF3A), ０-９ (U+FF10-FF19)
function normalizeName(str) {
  if (!str) return str;
  return [...str].map(char => {
    const cp = char.codePointAt(0);
    // Mathematical alphanumeric ranges → plain ASCII
    for (const [s, e, base] of MATH_RANGES) {
      if (cp >= s && cp <= e) return String.fromCharCode(base + (cp - s));
    }
    // Fullwidth Latin → ASCII
    if (cp >= 0xFF21 && cp <= 0xFF3A) return String.fromCharCode(cp - 0xFF21 + 65);
    if (cp >= 0xFF41 && cp <= 0xFF5A) return String.fromCharCode(cp - 0xFF41 + 97);
    if (cp >= 0xFF10 && cp <= 0xFF19) return String.fromCharCode(cp - 0xFF10 + 48);
    // Strip invisible / decorative-only chars (Balinese, zero-width, etc.)
    if (cp >= 0x1B40 && cp <= 0x1B7F) return ''; // Balinese block ᭄
    if ([0x200B,0x200C,0x200D,0xFEFF,0x200F,0x200E].includes(cp)) return '';
    return char;
  }).join('');
}

// ─── SVG Icons ────────────────────────────────────────────
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconFollowers = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IconLikes = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconVideo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconTikTok = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('id-ID');
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Skeleton Card ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      border: '1px solid rgba(15,23,42,0.07)',
      borderRadius: '1rem',
      padding: '1.25rem',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        {/* Avatar skeleton */}
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(15,23,42,0.07)', flexShrink: 0, animation: 'ncaSkeleton 1.5s ease-in-out infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '13px', width: '60%', borderRadius: '6px', background: 'rgba(15,23,42,0.07)', marginBottom: '6px', animation: 'ncaSkeleton 1.5s ease-in-out infinite' }} />
          <div style={{ height: '11px', width: '40%', borderRadius: '6px', background: 'rgba(15,23,42,0.05)', animation: 'ncaSkeleton 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      {/* Stats skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: '44px', borderRadius: '0.5rem', background: 'rgba(15,23,42,0.05)', animation: 'ncaSkeleton 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      {/* Button skeleton */}
      <div style={{ height: '32px', borderRadius: '0.5rem', background: 'rgba(15,23,42,0.05)', animation: 'ncaSkeleton 1.5s ease-in-out infinite' }} />
    </div>
  );
}

// ─── Member Card ──────────────────────────────────────────
function MemberCard({ member }) {
  const [imgErr, setImgErr] = useState(false);
  // Normalize fancy Unicode math letters → plain ASCII to avoid tofu boxes
  const rawName = normalizeName(member.nickname || member.username || '?');
  const initial = [...rawName].find(c => c.trim() && c !== '') || '?';


  const accentColors = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
  // Deterministic color per member
  const colorIndex = (member.username || '').charCodeAt(0) % accentColors.length;
  const accent = accentColors[colorIndex];

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.65)',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: '1rem',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)';
      }}
    >
      {/* ── Top accent line */}
      <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: '1rem 1rem 0 0' }} />

      {/* ── Avatar + Name */}
      <div style={{ padding: '1.1rem 1.1rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {!imgErr && member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.nickname || member.username}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              style={{
                width: '46px', height: '46px', borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: `0 0 0 2px ${accent}30`,
              }}
            />
          ) : (
            <div style={{
              width: '46px', height: '46px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.05rem', fontWeight: 800, color: '#fff',
              border: '2px solid rgba(255,255,255,0.9)',
              boxShadow: `0 0 0 2px ${accent}30`,
              fontFamily: FONT_STACK,
            }}>
              {initial}
            </div>
          )}
        </div>

        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.8rem', fontWeight: 700, color: '#0F172A',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            fontFamily: FONT_STACK,
            lineHeight: 1.3,
          }}>
            {rawName}
          </div>
          <div style={{
            fontSize: '0.68rem', color: 'rgba(15,23,42,0.38)',
            marginTop: '0.15rem', fontWeight: 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            @{member.username}
          </div>
          {member.generation && (
            <div style={{
              display: 'inline-block', marginTop: '0.3rem',
              padding: '0.1rem 0.45rem', borderRadius: '4px',
              fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: accent, border: `1px solid ${accent}30`, background: `${accent}10`,
            }}>
              Gen {member.generation}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        margin: '0 0.875rem 0.75rem',
        borderRadius: '0.625rem',
        border: '1px solid rgba(15,23,42,0.07)',
        background: 'rgba(15,23,42,0.02)',
        overflow: 'hidden',
      }}>
        {[
          { Icon: IconFollowers, value: fmt(member.followers), label: 'Followers' },
          { Icon: IconLikes,     value: fmt(member.likes),     label: 'Likes'     },
          { Icon: IconVideo,     value: fmt(member.video_count), label: 'Video'   },
        ].map(({ Icon, value, label }, i) => (
          <div key={label} style={{
            padding: '0.55rem 0.2rem', textAlign: 'center',
            borderLeft: i > 0 ? '1px solid rgba(15,23,42,0.07)' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'rgba(15,23,42,0.28)', marginBottom: '0.2rem' }}>
              <Icon />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.56rem', color: 'rgba(15,23,42,0.35)', marginTop: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── TikTok Link */}
      <a
        href={`https://tiktok.com/@${member.username}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
          margin: '0 0.875rem 1rem', padding: '0.45rem',
          borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 600,
          color: 'rgba(15,23,42,0.45)', border: '1px solid rgba(15,23,42,0.08)',
          background: 'transparent', textDecoration: 'none',
          transition: 'all 0.18s',
          fontFamily: FONT_STACK,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = 'rgba(15,23,42,0.04)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(15,23,42,0.45)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; }}
      >
        <IconTikTok /> Lihat Profil TikTok
      </a>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const btnStyle = (active) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: '36px', height: '36px', padding: '0 0.5rem',
    borderRadius: '0.5rem', fontSize: '0.82rem', fontWeight: active ? 700 : 500,
    border: active ? '1px solid transparent' : '1px solid rgba(15,23,42,0.1)',
    background: active ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'rgba(255,255,255,0.7)',
    color: active ? '#fff' : 'rgba(15,23,42,0.55)',
    cursor: 'pointer', transition: 'all 0.18s',
    fontFamily: FONT_STACK,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...btnStyle(false), opacity: currentPage === 1 ? 0.35 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
      >
        <IconChevronLeft />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ color: 'rgba(15,23,42,0.35)', fontSize: '0.8rem', padding: '0 0.25rem' }}>…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)} style={btnStyle(p === currentPage)}>
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...btnStyle(false), opacity: currentPage === totalPages ? 0.35 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
      >
        <IconChevronRight />
      </button>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────
export default function MemberSection() {
  const sectionRef = useRef(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawSearch, setRawSearch] = useState('');
  const [activeGen, setActiveGen] = useState('Semua');
  const [sort, setSort] = useState('followers_desc');
  const [page, setPage] = useState(1);

  // Debounced search — 300ms per PRD
  const search = useDebounce(rawSearch, DEBOUNCE_MS);

  // Fetch all members once
  useEffect(() => {
    supabase.from('members').select('*').then(({ data, error }) => {
      if (!error && data) setMembers(data);
      setLoading(false);
    });
  }, []);

  // Reset to page 1 when filter/search/sort changes
  useEffect(() => { setPage(1); }, [search, activeGen, sort]);

  // Entrance animation
  useEffect(() => {
    if (!sectionRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-member-card]', {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading]);

  // Filtered + Sorted list
  const filtered = useMemo(() => {
    let list = [...members];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        (m.username || '').toLowerCase().includes(q) ||
        (m.nickname || '').toLowerCase().includes(q)
      );
    }
    if (activeGen !== 'Semua') {
      const genNum = parseInt(activeGen.replace('Gen ', ''));
      list = list.filter(m => m.generation === genNum);
    }
    switch (sort) {
      case 'followers_desc': list.sort((a, b) => (b.followers || 0) - (a.followers || 0)); break;
      case 'likes_desc':     list.sort((a, b) => (b.likes || 0) - (a.likes || 0)); break;
      case 'video_desc':     list.sort((a, b) => (b.video_count || 0) - (a.video_count || 0)); break;
      case 'name_asc':       list.sort((a, b) => (a.username || '').localeCompare(b.username || '')); break;
    }
    return list;
  }, [members, search, activeGen, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const GEN_TABS = ['Semua', 'Gen 1', 'Gen 2', 'Gen 3'];
  const SORT_OPTIONS = [
    { value: 'followers_desc', label: 'Followers ↓' },
    { value: 'likes_desc',     label: 'Likes ↓' },
    { value: 'name_asc',       label: 'Nama A–Z' },
    { value: 'video_desc',     label: 'Video ↓' },
  ];

  return (
    <section
      id="section-members"
      ref={sectionRef}
      style={{ padding: '5rem 1.25rem 6rem', position: 'relative' }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes ncaSkeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (min-width: 640px) {
          .member-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 900px) {
          .member-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1100px) {
          .member-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 360px) {
          .member-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Section divider */}
      <div style={{ width: '40px', height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg,#7c3aed,#db2777)', margin: '0 auto 3.5rem' }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
        <span style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(15,23,42,0.35)', fontWeight: 500 }}>
          Our Members
        </span>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0F172A', marginTop: '0.65rem', letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Anggota NCA
        </h2>
        <p style={{ marginTop: '0.5rem', fontSize: '0.88rem', color: 'rgba(15,23,42,0.4)' }}>
          {loading ? 'Memuat data...' : `${members.length} kreator terdaftar`}
        </p>
      </div>

      {/* ── Controls ── */}
      <div style={{ maxWidth: '960px', margin: '0 auto 2rem', display: 'flex', flexDirection: 'column', gap: '0.875rem', alignItems: 'center' }}>

        {/* Search bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '440px' }}>
          <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(15,23,42,0.35)', pointerEvents: 'none', display: 'flex' }}>
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Cari nickname atau username..."
            value={rawSearch}
            onChange={e => setRawSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 2.5rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(15,23,42,0.1)',
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(8px)',
              fontSize: '0.85rem', color: '#0F172A',
              outline: 'none',
              fontFamily: FONT_STACK,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.1)'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
          />
          {rawSearch && (
            <button onClick={() => setRawSearch('')} style={{ position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.35)', display: 'flex', padding: '2px' }}>
              <IconX />
            </button>
          )}
        </div>

        {/* Gen tabs + Sort */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
          {/* Gen tabs */}
          <div style={{ display: 'flex', gap: '0.375rem', background: 'rgba(15,23,42,0.04)', borderRadius: '0.625rem', padding: '3px' }}>
            {GEN_TABS.map(gen => (
              <button
                key={gen}
                onClick={() => setActiveGen(gen)}
                style={{
                  padding: '0.35rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: activeGen === gen ? '#fff' : 'transparent',
                  color: activeGen === gen ? '#0F172A' : 'rgba(15,23,42,0.45)',
                  boxShadow: activeGen === gen ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.18s',
                  fontFamily: FONT_STACK,
                }}
              >
                {gen}
              </button>
            ))}
          </div>

          {/* Sort select */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              padding: '0.4rem 0.875rem',
              borderRadius: '0.625rem', fontSize: '0.78rem', fontWeight: 600,
              border: '1px solid rgba(15,23,42,0.1)',
              background: 'rgba(255,255,255,0.8)',
              color: 'rgba(15,23,42,0.65)',
              cursor: 'pointer', outline: 'none',
              fontFamily: FONT_STACK,
            }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Result count */}
        {!loading && (
          <p style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.35)' }}>
            Menampilkan <strong style={{ color: '#0F172A' }}>{Math.min(page * PAGE_SIZE, filtered.length)}</strong> dari <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> anggota
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      <div
        className="member-grid"
        style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr', // mobile default; overridden by media queries
          gap: '0.875rem',
        }}
      >
        {loading ? (
          // Skeleton loading — 8 placeholder cards
          Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length === 0 ? (
          <div style={{
            gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem',
            color: 'rgba(15,23,42,0.4)', fontSize: '0.9rem',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
            Tidak ada anggota yang cocok
            {search && <span> dengan kata kunci "<strong>{search}</strong>"</span>}
          </div>
        ) : (
          paginated.map(member => (
            <div key={member.id} data-member-card>
              <MemberCard member={member} />
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && filtered.length > PAGE_SIZE && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => {
            setPage(p);
            sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </section>
  );
}
