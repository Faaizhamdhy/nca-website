import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { supabase } from '../lib/supabase';

gsap.registerPlugin(ScrollTrigger);

const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';

// ─── Tier definitions — ordered exactly by hierarchy ──────
// Detection: first match wins (order matters!)
const TIER_DEFS = [
  {
    // Tier 0: Owner (Paling atas)
    id: 0, label: 'Owner', color: '#eab308', grad: 'linear-gradient(135deg,#facc15,#eab308)', size: 96,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('owner') || k.includes('pemilik');
    },
  },
  {
    // Tier 1: Leader
    id: 1, label: 'Leader', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#ef4444)', size: 86,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      // "Leader Admin" matches, but NOT "Co Leader" or "AllGen"
      return (k.includes('leader') || k.includes('ketua') || k.includes('founder'))
        && !k.includes('co') && !k.includes('allgen') && !k.includes('all');
    },
  },
  {
    // Tier 2: Co-Leader / Wakil
    id: 2, label: 'Co-Leader', color: '#a78bfa', grad: 'linear-gradient(135deg,#6366f1,#a78bfa)', size: 72,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('coleader') || k.includes('co') || k.includes('wakil');
    },
  },
  {
    // Tier 3: Admin All Gen (khusus "allgen" / "all gen")
    id: 3, label: 'All Gen', color: '#ec4899', grad: 'linear-gradient(135deg,#db2777,#ec4899)', size: 64,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('allgen') || k.includes('all gen') || k === 'adminallgen';
    },
  },
  {
    // Tier 4: Gen 1 (termasuk "Admin Desain · Gen 1", "Admin Gen 1", dll)
    id: 4, label: 'Gen 1', color: '#0ea5e9', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', size: 58,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('gen1') || k.includes('generasi1') || k.includes('gen 1');
    },
  },
  {
    // Tier 5: Gen 2
    id: 5, label: 'Gen 2', color: '#8b5cf6', grad: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', size: 54,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('gen2') || k.includes('generasi2');
    },
  },
  {
    // Tier 6: Gen 3
    id: 6, label: 'Gen 3', color: '#10b981', grad: 'linear-gradient(135deg,#10b981,#34d399)', size: 50,
    test: d => {
      const k = d.toLowerCase().replace(/[\s·\-_]/g, '');
      return k.includes('gen3') || k.includes('generasi3');
    },
  },
  {
    // Tier 7: Divisi lain (Bot, Desain tanpa gen, Admin saja, dll)
    id: 7, label: 'Divisi', color: '#64748b', grad: 'linear-gradient(135deg,#475569,#64748b)', size: 50,
    test: () => true,
  },
];


function getTier(division = '') {
  const def = TIER_DEFS.find(t => t.test(division));
  return def || TIER_DEFS[TIER_DEFS.length - 1];
}

function fmt(n) {
  if (!n && n !== 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

const MR = [[0x1D400,0x1D419,65],[0x1D41A,0x1D433,97],[0x1D5A0,0x1D5B9,65],[0x1D5BA,0x1D5D3,97]];
function norm(s) {
  if (!s) return '';
  return [...s].map(c => {
    const cp = c.codePointAt(0);
    for (const [a,b,base] of MR) if (cp>=a&&cp<=b) return String.fromCharCode(base+(cp-a));
    if (cp>=0xFF21&&cp<=0xFF3A) return String.fromCharCode(cp-0xFF21+65);
    if (cp>=0xFF41&&cp<=0xFF5A) return String.fromCharCode(cp-0xFF41+97);
    if (cp>=0xFE00&&cp<=0xFE0F) return '';
    return c;
  }).join('');
}

// ─── Icons ────────────────────────────────────────────────
const IShield = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IUsers  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IHeart  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
const ITikTok = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/></svg>;
const IClose  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IPlus   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IMinus  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const ITarget = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>;

// ─── Admin Full Card (modal) ──────────────────────────────
function AdminCard({ admin }) {
  const [err, setErr] = useState(false);
  const tier = getTier(admin.division);
  const name = norm(admin.nickname || admin.full_name || '?');
  const fullName = norm(admin.full_name);
  const init = [...name].find(c => c.trim()) || '?';

  return (
    <div style={{
      width: '220px', fontFamily: FONT,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '1.5rem', overflow: 'hidden',
      border: `1px solid ${tier.color}30`,
      boxShadow: `0 0 40px ${tier.color}18, 0 20px 48px rgba(0,0,0,0.12)`,
    }}>
      {/* Gradient top accent */}
      <div style={{ height: '5px', background: tier.grad }} />

      <div style={{ padding: '1.75rem 1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
        {/* Avatar */}
        <div style={{ width: '92px', height: '92px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${tier.color}`, boxShadow: `0 0 24px ${tier.color}50, 0 8px 20px rgba(0,0,0,0.1)`, background: `linear-gradient(135deg,${tier.color}15,${tier.color}35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!err && admin.avatar_url
            ? <img src={admin.avatar_url} referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
            : <span style={{ fontSize: '2.1rem', fontWeight: 800, color: tier.color }}>{init}</span>}
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>{name}</div>
          <div style={{ fontSize: '0.72rem', color: tier.color, fontWeight: 600 }}>@{admin.nickname}</div>
          {fullName && fullName !== name && <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginTop: '0.1rem' }}>{fullName}</div>}
        </div>

        {/* Division badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.9rem', borderRadius: '999px', background: tier.grad, color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: `0 4px 12px ${tier.color}35` }}>
          <IShield />{admin.division || 'Admin'}
        </div>
      </div>

      {/* Stats */}
      <div style={{ margin: '0 1rem', borderRadius: '0.75rem', border: `1px solid ${tier.color}18`, background: `${tier.color}08`, display: 'flex', overflow: 'hidden' }}>
        {[{ icon: <IUsers />, label: 'Followers', val: fmt(admin.followers) }, { icon: <IHeart />, label: 'Likes', val: fmt(admin.likes) }].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '0.75rem 0.4rem', textAlign: 'center', borderRight: i === 0 ? `1px solid ${tier.color}18` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.22rem', color: '#94a3b8', marginBottom: '0.2rem' }}>
              {s.icon}<span style={{ fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* TikTok button */}
      <div style={{ padding: '1rem' }}>
        <a href={admin.tiktok_url || `https://www.tiktok.com/@${admin.nickname}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.78rem', borderRadius: '0.75rem', background: tier.grad, color: '#fff', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none', boxShadow: `0 8px 20px ${tier.color}35`, transition: 'opacity 0.18s' }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}>
          <ITikTok />Kunjungi TikTok
        </a>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ admin, onClose }) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    gsap.fromTo(cardRef.current, { scale: 0.8, y: 28, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.38, ease: 'back.out(1.7)' });
    const onKey = e => { if (e.key === 'Escape') doClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const doClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 });
    gsap.to(cardRef.current, { scale: 0.85, y: 16, opacity: 0, duration: 0.18, onComplete: onClose });
  };
  return (
    <div ref={overlayRef} onClick={doClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(14px)' }}>
      <div ref={cardRef} onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button onClick={doClose} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 2, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IClose /></button>
        <AdminCard admin={admin} />
      </div>
    </div>
  );
}

// ─── Avatar Bubble ────────────────────────────────────────
function Bubble({ admin, tierDef, onClick }) {
  const [err, setErr] = useState(false);
  const name = norm(admin.nickname || admin.full_name || '?');
  const init = [...name].find(c => c.trim()) || '?';
  const isRoot = tierDef.id === 0;

  return (
    <div
      data-node
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0.3rem', cursor: 'pointer', position: 'relative',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15) translateY(-5px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
    >
      {/* Crown for root */}
      {isRoot && (
        <div style={{
          position: 'absolute', top: `-${Math.round(tierDef.size * 0.28)}px`,
          left: '50%', transform: 'translateX(-50%)',
          fontSize: `${Math.round(tierDef.size * 0.3)}px`, pointerEvents: 'none',
        }}>👑</div>
      )}

      {/* Avatar circle */}
      <div style={{
        width: `${tierDef.size}px`, height: `${tierDef.size}px`, borderRadius: '50%',
        border: `${isRoot ? 4 : 3}px solid ${tierDef.color}`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.12)`,
        background: `linear-gradient(135deg,${tierDef.color}20,${tierDef.color}50)`,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        transform: 'translateZ(0)',
      }}>
        {!err && admin.avatar_url
          ? <img src={admin.avatar_url} referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
          : <span style={{ fontWeight: 800, fontSize: `${Math.round(tierDef.size * 0.36)}px`, color: tierDef.color, fontFamily: FONT }}>{init}</span>}
      </div>

      {/* Username */}
      <div style={{
        background: 'rgba(255,255,255,0.98)',
        color: '#0f172a', padding: '0.18rem 0.55rem', borderRadius: '999px',
        fontSize: `${isRoot ? 0.68 : 0.6}rem`, fontWeight: 700, fontFamily: FONT,
        border: `1px solid ${tierDef.color}25`,
        boxShadow: `0 2px 4px rgba(0,0,0,0.06)`,
        whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis',
        transform: 'translateZ(0)',
      }}>
        {name}
      </div>

      {/* Tier / role label */}
      <div style={{
        background: tierDef.grad,
        color: '#fff',
        padding: '0.1rem 0.5rem',
        borderRadius: '999px',
        fontSize: '0.52rem',
        fontWeight: 700,
        fontFamily: FONT,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        boxShadow: `0 2px 6px ${tierDef.color}40`,
        whiteSpace: 'nowrap',
      }}>
        {tierDef.label}
      </div>
    </div>
  );
}


// ─── Build proper connected tree ──────────────────────────
function buildTree(admins) {
  // 1. Assign tier to every admin
  const tagged = admins.map(a => ({ ...a, tierDef: getTier(a.division) }));

  // 2. Group by tier ID, preserve order
  const byTier = {};
  tagged.forEach(a => {
    const tid = a.tierDef.id;
    if (!byTier[tid]) byTier[tid] = [];
    byTier[tid].push(a);
  });

  // 3. Get active tier IDs sorted top→bottom
  const activeTierIds = [...new Set(tagged.map(a => a.tierDef.id))].sort((a, b) => a - b);

  // 4. Layout constants
  const CANVAS_W = 2200;
  // TIER_H must be large enough to clear avatar + name + role badge
  // Biggest avatar is 86px radius=43. Name pill ~22px. Role badge ~18px. Total below center ~83px.
  // Plus top half of child avatar (~43px). So min gap = 83 + 43 + 20 padding = ~146px → use 200.
  const TIER_H = 210;
  const MIN_GAP = 155;

  // 5. Compute x positions per tier — widen as we go deeper
  const nodes = [];
  const tierRows = {};

  activeTierIds.forEach((tid, rowIdx) => {
    const members = byTier[tid];
    const count = members.length;
    const spread = Math.max(count - 1, 0) * Math.max(MIN_GAP, MIN_GAP + rowIdx * 18);
    const startX = CANVAS_W / 2 - spread / 2;
    const y = 110 + rowIdx * TIER_H;

    const row = members.map((a, i) => {
      const x = count === 1 ? CANVAS_W / 2 : startX + i * (spread / Math.max(count - 1, 1));
      return { id: a.id, x, y, admin: a, tierDef: a.tierDef };
    });
    row.forEach(n => nodes.push(n));
    tierRows[tid] = row;
  });

  // 6. Build edges — connect each child to nearest parent in previous active tier.
  //    CRITICAL: use avatar EDGE coords (bottom of parent, top of child), not centers.
  //    This keeps lines visible outside the avatar circles.
  const edges = [];

  activeTierIds.forEach((tid, rowIdx) => {
    if (rowIdx === 0) return;

    let parentRow = null;
    for (let pi = rowIdx - 1; pi >= 0; pi--) {
      const ptid = activeTierIds[pi];
      if (tierRows[ptid]?.length > 0) { parentRow = tierRows[ptid]; break; }
    }
    if (!parentRow) return;

    tierRows[tid].forEach(child => {
      const parent = parentRow.reduce((best, p) =>
        Math.abs(p.x - child.x) < Math.abs(best.x - child.x) ? p : best,
        parentRow[0]
      );

      // Start line at bottom edge of parent avatar + small gap
      const py = parent.y + Math.round(parent.tierDef.size / 2) + 4;
      // End line at top edge of child avatar - small gap
      const cy = child.y  - Math.round(child.tierDef.size  / 2) - 4;

      edges.push({
        px: parent.x, py,
        cx: child.x,  cy,
        parentColor: parent.tierDef.color,
        childColor:  child.tierDef.color,
      });
    });
  });

  const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0);
  return { nodes, edges, canvasH: maxY + 200, canvasW: CANVAS_W };
}

// ─── Tree Canvas (pan+zoom via direct DOM ref) ─────────────
function TreeCanvas({ admins, onNodeClick }) {
  const containerRef = useRef(null);
  const innerRef = useRef(null);
  const tx = useRef({ x: 0, y: 0, scale: 1 });
  const drag = useRef({ on: false, sx: 0, sy: 0, stx: 0, sty: 0 });

  const { nodes, edges, canvasH, canvasW } = buildTree(admins);

  const apply = () => {
    if (!innerRef.current) return;
    const { x, y, scale } = tx.current;
    innerRef.current.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  };

  const fitToView = () => {
    const el = containerRef.current;
    if (!el) return;
    const scale = Math.min(el.clientWidth / canvasW, el.clientHeight / canvasH) * 0.9;
    tx.current = { x: (el.clientWidth - canvasW * scale) / 2, y: (el.clientHeight - canvasH * scale) / 2 + 5, scale };
    apply();
  };

  useEffect(() => { if (admins.length) { fitToView(); } }, [admins.length]);

  // Wheel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const fn = e => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.09 : 0.92;
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const prev = tx.current;
      const ns = Math.min(Math.max(prev.scale * f, 0.08), 4);
      const ds = ns / prev.scale;
      tx.current = { x: mx - (mx - prev.x) * ds, y: my - (my - prev.y) * ds, scale: ns };
      apply();
    };
    el.addEventListener('wheel', fn, { passive: false });
    return () => el.removeEventListener('wheel', fn);
  }, []);

  // Pinch
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let ld = null;
    const ts = e => { if (e.touches.length === 2) ld = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); };
    const tm = e => {
      if (e.touches.length !== 2 || ld === null) return;
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const f = d / ld; ld = d;
      const r = el.getBoundingClientRect();
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top;
      const prev = tx.current;
      const ns = Math.min(Math.max(prev.scale * f, 0.08), 4);
      const ds = ns / prev.scale;
      tx.current = { x: mx - (mx - prev.x) * ds, y: my - (my - prev.y) * ds, scale: ns };
      apply();
    };
    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove', tm, { passive: false });
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); };
  }, []);

  // Pan
  const onPD = e => {
    if (e.target.closest('[data-node]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { on: true, sx: e.clientX, sy: e.clientY, stx: tx.current.x, sty: tx.current.y };
  };
  const onPM = e => {
    if (!drag.current.on) return;
    tx.current.x = drag.current.stx + (e.clientX - drag.current.sx);
    tx.current.y = drag.current.sty + (e.clientY - drag.current.sy);
    apply();
  };
  const onPU = e => { drag.current.on = false; e.currentTarget.releasePointerCapture(e.pointerId); };

  const doZoom = dir => {
    const f = dir > 0 ? 1.3 : 0.77;
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth / 2, ch = el.clientHeight / 2;
    const prev = tx.current;
    const ns = Math.min(Math.max(prev.scale * f, 0.08), 4);
    const ds = ns / prev.scale;
    tx.current = { x: cw - (cw - prev.x) * ds, y: ch - (ch - prev.y) * ds, scale: ns };
    apply();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {[{ i: <IPlus />, f: () => doZoom(1) }, { i: <IMinus />, f: () => doZoom(-1) }, { i: <ITarget />, f: fitToView }].map((b, k) => (
          <button key={k} onClick={b.f} style={{ width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', transition: 'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.color = '#7c3aed'; }}
          >{b.i}</button>
        ))}
      </div>

      {/* Viewport */}
      <div ref={containerRef}
        onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={onPU}
        style={{ width: '100%', height: 'clamp(460px, 66vh, 680px)', overflow: 'hidden', position: 'relative', touchAction: 'none', cursor: 'grab', background: 'transparent' }}
      >
        {/* Inner virtual canvas */}
        <div ref={innerRef} style={{ position: 'absolute', top: 0, left: 0, width: `${canvasW}px`, height: `${canvasH}px`, transformOrigin: '0 0', willChange: 'transform' }}>

          <style>{`
            @keyframes flowDash { to { stroke-dashoffset: -36; } }
            @media (max-width: 768px) {
              .mobile-static-dash { animation: none !important; }
            }
          `}</style>

          {/* SVG edges — ALL connected, smooth bezier curves */}
          <svg width={canvasW} height={canvasH} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>

            {edges.map((e, i) => {
              // S-curve bezier: from bottom of parent to top of child
              const MY = (e.py + e.cy) / 2;
              const d = `M ${e.px} ${e.py} C ${e.px} ${MY}, ${e.cx} ${MY}, ${e.cx} ${e.cy}`;
              const animDur = `${1.5 + (i % 6) * 0.2}s`;
              // Gradient: parent color → child color along the path
              const gradId = `eg${i}`;

              return (
                <g key={i}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={e.parentColor} stopOpacity="0.9"/>
                      <stop offset="100%" stopColor={e.childColor} stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                  {/* Wide soft glow halo */}
                  <path d={d} fill="none" stroke={e.parentColor} strokeWidth="16" strokeOpacity="0.07" strokeLinecap="round" />
                  {/* Solid base pipe */}
                  <path d={d} fill="none" stroke={`url(#${gradId})`} strokeWidth="3" strokeOpacity="1" strokeLinecap="round" />
                  {/* Animated energy dash on top */}
                  <path d={d} fill="none" stroke="#fff" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round"
                    strokeDasharray="8 24"
                    className="mobile-static-dash"
                    style={{ animation: `flowDash ${animDur} linear infinite` }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Node bubbles */}
          {nodes.map(node => (
            <div key={node.id} style={{ position: 'absolute', left: `${node.x}px`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }}>
              <Bubble admin={node.admin} tierDef={node.tierDef} onClick={() => onNodeClick(node.admin)} />
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchy legend — 4 groups as requested */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap', fontFamily: FONT }}>
        {[
          { colors: ['#eab308', '#f59e0b', '#a78bfa'], label: 'Owner & Leader' },
          { colors: ['#ec4899'],            label: 'Admin All Gen' },
          { colors: ['#0ea5e9', '#8b5cf6', '#10b981'], label: 'Gen 1 · Gen 2 · Gen 3' },
          { colors: ['#64748b'],            label: 'Lainnya' },
        ].map((g, i, arr) => (
          <>
            <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {g.colors.map(c => (
                  <div key={c} style={{ width: '9px', height: '9px', borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                ))}
              </div>
              <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600 }}>{g.label}</span>
            </div>
            {i < arr.length - 1 && (
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 300 }}>→</span>
            )}
          </>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function AdminSection() {
  const sectionRef = useRef(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    supabase.from('admins')
      .select('id, full_name, nickname, division, avatar_url, order_index')
      .order('order_index', { ascending: true })
      .then(async ({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        const nicks = data.map(a => a.nickname);
        const { data: mems } = await supabase.from('members')
          .select('username, followers, likes, tiktok_url').in('username', nicks);
        const m = {};
        if (mems) mems.forEach(x => { m[x.username] = x; });
        setAdmins(data.map(a => ({ ...a, followers: m[a.nickname]?.followers || 0, likes: m[a.nickname]?.likes || 0, tiktok_url: m[a.nickname]?.tiktok_url || `https://www.tiktok.com/@${a.nickname}` })));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!sectionRef.current || loading) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-sa]', { y: 28, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 82%' } });
    }, sectionRef);
    return () => ctx.revert();
  }, [loading]);

  return (
    <section id="section-admin" ref={sectionRef} style={{ padding: 'clamp(3rem,8vw,5rem) 0' }}>
      {selected && <Modal admin={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div data-sa style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '0 1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.3rem 1rem', borderRadius: '999px', marginBottom: '1rem', background: 'linear-gradient(135deg,rgba(124,58,237,0.09),rgba(245,158,11,0.07))', border: '1px solid rgba(124,58,237,0.18)' }}>
          <IShield />
          <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', fontFamily: FONT }}>Struktur Organisasi</span>
        </div>
        <h2 style={{ fontSize: 'clamp(1.9rem,5vw,3rem)', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.7rem', fontFamily: FONT }}>
          Tim Admin <span style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>NCA</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: '380px', margin: '0 auto', lineHeight: 1.7, fontFamily: FONT }}>
          Klik avatar untuk melihat profil lengkap. Scroll/cubit untuk zoom, drag untuk geser.
        </p>
      </div>

      <div data-sa style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {loading ? (
          <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#94a3b8', fontFamily: FONT }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'spin 0.9s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Membangun pohon struktur...</span>
          </div>
        ) : (
          <TreeCanvas admins={admins} onNodeClick={setSelected} />
        )}
      </div>
    </section>
  );
}
