import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const FONT = '"Plus Jakarta Sans", system-ui, sans-serif';
const DISPLAY_FONT = '"Bangers", "Plus Jakarta Sans", system-ui, sans-serif';

// ─── Icons ────────────────────────────────────────────────
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);
const IconTikTok = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);
const IconArrowDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);

// ─── Floating image config ───────────────────────────────
const FLOAT_IMAGES = [
  { src: '/ncalog.png',   label: 'NCA Logo',      top: '8%',  left: '4%',   size: 110, rotate: -8,  delay: 0    },
  { src: '/ncagen1.png',  label: 'Generasi 1',    top: '15%', right: '5%',  size: 130, rotate: 6,   delay: 0.4  },
  { src: '/ncaadmin.png', label: 'Admin',         top: '55%', left: '2%',   size: 115, rotate: -5,  delay: 0.8  },
  { src: '/ncagen2.png',  label: 'Generasi 2',    top: '62%', right: '3%',  size: 125, rotate: 7,   delay: 0.2  },
  { src: '/ncabot.png',   label: 'Bot',           top: '30%', left: '-1%',  size: 100, rotate: 10,  delay: 1.0  },
  { src: '/ncacomun.png', label: 'Community',     top: '38%', right: '-1%', size: 118, rotate: -6,  delay: 0.6  },
  { src: '/ncagen3.png',  label: 'Generasi 3',    top: '80%', left: '8%',   size: 108, rotate: 4,   delay: 1.2  },
];

// ─── Particle Canvas Background ──────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const W = () => canvas.width;
    const H = () => canvas.height;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const count = 55;
    for (let i = 0; i < count; i++) {
      particles.push({
        x:  Math.random() * W(), y:  Math.random() * H(),
        r:  Math.random() * 2.2 + 0.4,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        o:  Math.random() * 0.45 + 0.05,
        hue: Math.floor(Math.random() * 80) + 250,
      });
    }
    const connectDist = 120;
    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H(); if (p.y > H()) p.y = 0;
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,58,237,${(1 - dist / connectDist) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.o})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}

// ─── 3D Hologram Float Card ───────────────────────────────
// Each card responds to mouse with full CSS 3D perspective tilt + holographic sheen
function FloatCard({ src, label, top, left, right, size, rotate, delay, cardRef }) {
  const innerRef = useRef(null);
  const sheenRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotX = -dy * 22;
    const rotY =  dx * 22;

    if (innerRef.current) {
      innerRef.current.style.transform = `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.06,1.06,1.06)`;
    }
    // Sheen moves to opposite of mouse
    if (sheenRef.current) {
      const sheenX = 50 + dx * 35;
      const sheenY = 50 + dy * 35;
      sheenRef.current.style.background = `radial-gradient(ellipse at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 70%)`;
      sheenRef.current.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (innerRef.current) {
      innerRef.current.style.transform = `perspective(500px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    }
    if (sheenRef.current) sheenRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={cardRef}
      style={{
        position: 'absolute',
        top, left, right,
        width: size,
        zIndex: 0,
        willChange: 'transform',
        opacity: 0,
        cursor: 'pointer',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Perspective container */}
      <div style={{ perspective: '500px', perspectiveOrigin: '50% 50%' }}>
        <div
          ref={innerRef}
          style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: hovered
              ? '0 20px 60px rgba(124,58,237,0.35), 0 0 0 1px rgba(167,139,250,0.3), 0 8px 32px rgba(0,0,0,0.2)'
              : '0 8px 32px rgba(0,0,0,0.13), 0 1px 0 rgba(255,255,255,0.9)',
            border: '2px solid rgba(255,255,255,0.85)',
            transform: `perspective(500px) rotateX(0deg) rotateY(0deg) rotate(${rotate}deg)`,
            backdropFilter: 'blur(4px)',
            background: '#fff',
            transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
            position: 'relative',
          }}
        >
          <img
            src={src}
            alt={label}
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            draggable={false}
          />
          {/* Holographic sheen overlay */}
          <div
            ref={sheenRef}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.28) 0%, transparent 70%)',
              opacity: 0,
              transition: 'opacity 0.2s',
              pointerEvents: 'none',
              borderRadius: '1rem',
              mixBlendMode: 'overlay',
            }}
          />
          {hovered && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '1rem',
              background: 'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(244,114,182,0.1) 50%, rgba(96,165,250,0.15) 100%)',
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shatter Logo Canvas ──────────────────────────────────────────────────────
// Phase 1 (0–20%): logo assembled, gentle float
// Phase 2 (20–80%): logo shatters outward, particles scatter
// Phase 3 (80–100%): particles fade out → gen section revealed
function ShatterLogoCanvas() {
  const canvasRef = useRef(null);
  const progRef   = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    // Covers hero + up to gen section for a long slow journey
    const st = ScrollTrigger.create({
      trigger: '#section-hero',
      start: 'top top',
      endTrigger: '#section-generation',
      end: 'top center',       // extends scroll range = slower per pixel
      scrub: 1.5,              // 1.5s lag = smooth but still responsive
      onUpdate: (self) => { progRef.current = self.progress; },
    });

    const img = new Image();
    img.src = '/logonca.png';
    img.onload = () => {
      const resize = () => {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
      };
      window.addEventListener('resize', resize);
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;

      function initParticles() {
        particles = [];
        const vw = canvas.width, vh = canvas.height;

        const offC = document.createElement('canvas');
        const offCtx = offC.getContext('2d');
        const imgSize = Math.floor(Math.min(vw, vh) * 0.48);
        offC.width = offC.height = imgSize;
        offCtx.drawImage(img, 0, 0, imgSize, imgSize);
        const data = offCtx.getImageData(0, 0, imgSize, imgSize).data;

        const step    = vw < 768 ? 7 : 5;
        const originX = (vw - imgSize) / 2;
        const originY = (vh - imgSize) / 2 - 10;

        const palette = [
          [124, 58,  237],
          [139, 92,  246],
          [167, 139, 250],
          [219, 39,  119],
          [244, 114, 182],
          [99,  102, 241],
        ];

        for (let y = 0; y < imgSize; y += step) {
          for (let x = 0; x < imgSize; x += step) {
            const i = (y * imgSize + x) * 4;
            if (data[i + 3] < 80) continue;

            const bright = (data[i]*0.3 + data[i+1]*0.59 + data[i+2]*0.11) / 255;
            const ci = Math.floor(bright * (palette.length - 1));
            const [r, g, b] = palette[ci];
            const alpha = 0.13 + bright * 0.15;

            // Each particle gets its own random outward direction
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.8 + Math.random() * 1.2; // normalized velocity multiplier

            particles.push({
              ox: originX + x,
              oy: originY + y,
              // Direction vector — will be scaled by scatter progress
              dx: Math.cos(angle) * speed,
              dy: Math.sin(angle) * speed,
              color: `rgba(${r},${g},${b},${alpha})`,
              size: step * 1.0,
              offset: Math.random() * Math.PI * 2,
            });
          }
        }
      }

      initParticles();

      const lerp  = (a, b, t) => a + (b - a) * t;
      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      const easeOut = (t) => 1 - Math.pow(1 - t, 2);

      let time = 0;
      // Smaller MAX_DIST = particles move less per scroll unit = feels slower
      const MAX_DIST = Math.max(window.innerWidth, window.innerHeight) * 0.6;

      const draw = () => {
        time += 0.012;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const prog = progRef.current;

        // Linear scatter — starts at first scroll, no delay, no rush
        // prog goes 0→1 across the full scroll range
        const scatterT = prog;                    // pure linear, immediate
        // Fade out only at the very end (85–100%)
        const fadeAlpha = prog < 0.85 ? 1 : Math.max(0, 1 - (prog - 0.85) / 0.15);

        if (fadeAlpha <= 0) {
          animId = requestAnimationFrame(draw);
          return;
        }

        ctx.globalAlpha = fadeAlpha;

        particles.forEach(p => {
          // Float only when barely scrolled
          const floatBlend = Math.max(0, 1 - prog * 15);
          const fx = Math.cos(time * 0.7 + p.offset) * 8 * floatBlend;
          const fy = Math.sin(time       + p.offset) * 6 * floatBlend;

          // Slow linear scatter — each pixel of scroll = tiny movement
          const dist = scatterT * MAX_DIST;
          const curX = p.ox + p.dx * dist + fx;
          const curY = p.oy + p.dy * dist + fy;

          ctx.fillStyle = p.color;
          ctx.fillRect(curX, curY, p.size, p.size);
        });

        ctx.globalAlpha = 1;
        animId = requestAnimationFrame(draw);
      };
      draw();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', resize);
      };
    };

    return () => st.kill();
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────

export default function HeroSection() {
  const contentRef  = useRef(null);
  const cardRefs    = useRef([]);

  useEffect(() => {
    // ── Content entrance
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current.querySelectorAll('[data-anim]'), {
        y: 32, opacity: 0, duration: 0.85, stagger: 0.1,
        ease: 'power3.out', delay: 0.2,
      });
    });

    // ── Float cards entrance + infinite drift
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const cfg = FLOAT_IMAGES[i];

      gsap.fromTo(el,
        { opacity: 0, y: 28, scale: 0.88 },
        { opacity: 1, y: 0,  scale: 1, duration: 0.9, delay: 0.5 + cfg.delay, ease: 'power3.out' }
      );

      const driftY = 14 + Math.random() * 12;
      const driftX = 6  + Math.random() * 8;
      const dur    = 3.8 + Math.random() * 2.2;

      gsap.to(el, {
        y: `+=${driftY}`, x: `+=${driftX}`,
        duration: dur, repeat: -1, yoyo: true,
        ease: 'sine.inOut', delay: cfg.delay,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="section-hero"
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '6rem 1.5rem 5rem',
        position: 'relative', overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* ── Animated particle canvas background ── */}
      <ParticleCanvas />

      {/* ── Shattering Logo Canvas (behind everything) ── */}
      <ShatterLogoCanvas />


      {/* ── Mesh gradient blobs ── */}
      <div style={{
        position: 'absolute', top: '10%', left: '15%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(168,85,247,0.09) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(40px)',
        animation: 'blobDrift1 12s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%',
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(219,39,119,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(40px)',
        animation: 'blobDrift2 14s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '500px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />

      {/* ── Subtle dot grid ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
      }} />

      {/* ── 3D Hologram Floating image cards ── */}
      {FLOAT_IMAGES.map((cfg, i) => (
        <FloatCard
          key={cfg.src}
          {...cfg}
          cardRef={el => cardRefs.current[i] = el}
        />
      ))}

      {/* ── Main content ── */}
      <div
        ref={contentRef}
        style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '640px', width: '100%' }}
      >
        {/* ── Konkon.id & TikTok Powered-By Badges ── */}
        <div data-anim style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Konkon.id Badge */}
          <a
            href="https://konkon.id/aiz"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1rem 0.4rem 0.55rem',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(124,58,237,0.22)',
              boxShadow: '0 0 20px rgba(124,58,237,0.12), 0 2px 10px rgba(0,0,0,0.06)',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
              animation: 'konkonGlow 3s ease-in-out infinite alternate',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.28), 0 6px 20px rgba(0,0,0,0.1)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(124,58,237,0.12), 0 2px 10px rgba(0,0,0,0.06)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.72)';
            }}
          >
            {/* Glowing dot */}
            <span style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#7c3aed,#db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', flexShrink: 0,
              boxShadow: '0 0 10px rgba(124,58,237,0.5)',
            }}>⚡</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', fontFamily: FONT, letterSpacing: '0.01em' }}>
              Website oleh{' '}
              <span style={{
                background: 'linear-gradient(135deg,#7c3aed,#db2777)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontWeight: 800,
              }}>Aiz · konkon.id</span>
            </span>
            <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginLeft: '0.1rem' }}>↗</span>
          </a>

          {/* TikTok Badge */}
          <a
            href="https://www.tiktok.com/@faaizhamdhy?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(15,23,42,0.12)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              textDecoration: 'none',
              transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.06) translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.92)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.72)';
            }}
          >
            <IconTikTok />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', fontFamily: FONT, letterSpacing: '0.01em' }}>
              aiz.en
            </span>
          </a>
        </div>

        {/* Eyebrow */}
        <div data-anim style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <div style={{ width: '24px', height: '1px', background: 'rgba(124,58,237,0.3)' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(124,58,237,0.7)', fontFamily: FONT }}>
            Komunitas Anime Creator Indonesia
          </span>
          <div style={{ width: '24px', height: '1px', background: 'rgba(124,58,237,0.3)' }} />
        </div>

        {/* Heading — Bangers (comic book!) */}
        <h1 data-anim style={{
          fontSize: 'clamp(3.5rem, 10vw, 6.5rem)', fontWeight: 400,
          lineHeight: 0.95, letterSpacing: '0.04em', color: '#0F172A',
          marginBottom: '0.05em', fontFamily: DISPLAY_FONT,
          textTransform: 'uppercase',
        }}>
          Nanime<span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            display: 'inline-block',
          }}>Creator</span>
        </h1>
        <h1 data-anim style={{
          fontSize: 'clamp(3.5rem, 10vw, 6.5rem)', fontWeight: 400,
          lineHeight: 0.95, letterSpacing: '0.04em', color: '#0F172A',
          marginBottom: '1.6rem', fontFamily: DISPLAY_FONT,
          textTransform: 'uppercase',
        }}>
          Aogiri
        </h1>

        {/* Tag line */}
        <p data-anim style={{
          fontSize: '0.75rem', fontWeight: 500,
          letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'rgba(15,23,42,0.28)', marginBottom: '1.5rem',
        }}>
          NCA — Official Website
        </p>

        {/* Description */}
        <p data-anim style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', color: '#475569',
          maxWidth: '440px', margin: '0 auto 2.75rem', lineHeight: 1.75, fontWeight: 500,
        }}>
          Komunitas kreator konten anime terbesar di Indonesia. Berkarya, tumbuh, dan bersinar bersama.
        </p>

        {/* CTAs */}
        <div data-anim style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => document.getElementById('section-members')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.875rem', borderRadius: '0.625rem',
              fontWeight: 700, fontSize: '0.9rem', color: '#fff', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #db2777)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
              transition: 'opacity 0.2s, transform 0.2s',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.38)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)'; }}
          >
            <IconStar /> Jelajahi Member
          </button>
          <a
            href="https://www.tiktok.com/search?q=NanimeCreatorAogiri"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.625rem', borderRadius: '0.625rem',
              fontWeight: 600, fontSize: '0.9rem', color: '#374151',
              border: '1px solid rgba(15,23,42,0.12)',
              background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
              textDecoration: 'none', transition: 'all 0.2s',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <IconTikTok /> TikTok NCA
          </a>
        </div>

        {/* Scroll hint */}
        <div data-anim style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(15,23,42,0.2)' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ animation: 'ncaBounce 2s ease-in-out infinite' }}>
            <IconArrowDown />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ncaBounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(5px); opacity: 0.7; }
        }
        @keyframes blobDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.15); }
        }
        @keyframes blobDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, -35px) scale(1.1); }
        }
        @keyframes konkonGlow {
          0%   { box-shadow: 0 0 16px rgba(124,58,237,0.10), 0 2px 10px rgba(0,0,0,0.05); }
          100% { box-shadow: 0 0 28px rgba(219,39,119,0.18), 0 2px 14px rgba(0,0,0,0.07); }
        }
        @media (max-width: 480px) {
          #section-hero [style*="position: absolute"] { display: none !important; }
          #section-hero canvas { display: none; }
        }
      `}</style>
    </section>
  );
}
