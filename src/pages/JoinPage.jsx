import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

// ─── Icons ────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── 3D Portal / Vortex Tunnel Canvas ───────────────────
function PortalCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const RING_COUNT = 28;
    const PARTICLE_COUNT = 120;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      z: Math.random(),
      speed: 0.003 + Math.random() * 0.005,
      size: Math.random() * 1.8 + 0.3,
      hue: 260 + Math.random() * 80,
      brightness: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.02,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Light fade for trailing effect instead of dark fade
      ctx.fillStyle = 'rgba(248, 250, 252, 0.2)'; 
      ctx.fillRect(0, 0, W, H);

      t += 0.012;

      for (let i = 0; i < RING_COUNT; i++) {
        const progress = (i / RING_COUNT + t * 0.28) % 1;
        const depth    = 1 - progress;
        const maxRadius = Math.min(W, H) * 0.62;
        const minRadius = 8;
        const radius = minRadius + (maxRadius - minRadius) * (1 - depth * depth);
        const spiralAngle = t * 0.4 + i * 0.22;
        const hue       = 260 + Math.sin(t * 0.5 + i * 0.3) * 60;
        // Darker lines for light background
        const lightness = 45 - depth * 15; 
        const alpha     = (1 - depth) * 0.5 + 0.05;
        const wobbleX = Math.sin(t * 0.7 + i * 0.5) * 12 * (1 - depth);
        const wobbleY = Math.cos(t * 0.6 + i * 0.4) * 8  * (1 - depth);

        ctx.beginPath();
        ctx.ellipse(cx + wobbleX, cy + wobbleY, radius, radius * 0.55, spiralAngle * 0.1, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
        ctx.lineWidth   = Math.max(0.4, (1 - depth) * 2.5);
        ctx.stroke();

        if (depth < 0.25) {
          ctx.beginPath();
          ctx.ellipse(cx + wobbleX, cy + wobbleY, radius * 0.9, radius * 0.9 * 0.55, spiralAngle * 0.1, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue + 20}, 90%, 60%, ${(0.25 - depth) * 0.4})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }

      particles.forEach(p => {
        p.z -= p.speed;
        if (p.z <= 0) { p.z = 1; p.angle = Math.random() * Math.PI * 2; }
        p.angle += p.drift;
        const depth  = p.z;
        const radius = (1 - depth) * Math.min(W, H) * 0.55;
        const px     = cx + Math.cos(p.angle) * radius * 0.85;
        const py     = cy + Math.sin(p.angle) * radius * 0.45;
        const alpha  = (1 - depth) * p.brightness;
        const size   = p.size * (1 - depth * 0.7);
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        // Darker, richer particles for light theme
        ctx.fillStyle = `hsla(${p.hue}, 85%, 55%, ${alpha})`;
        ctx.fill();
      });

      // Subtle light glow at center
      const glowPulse = 0.7 + Math.sin(t * 1.8) * 0.3;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * glowPulse);
      grd.addColorStop(0, `hsla(${280 + Math.sin(t) * 30}, 90%, 65%, 0.15)`);
      grd.addColorStop(0.5, `hsla(${300 + Math.sin(t) * 40}, 80%, 60%, 0.05)`);
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(cx, cy, 80 * glowPulse, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        // Light gradient background
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 40%, #e2e8f0 100%)',
      }}
    />
  );
}


// ─── Main Component ───────────────────────────────────────
export default function JoinPage() {
  const contentRef = useRef(null);

  useEffect(() => {
    // Reset background to match the light theme
    document.body.style.backgroundColor = '#f8fafc';
    document.body.style.transition = 'background-color 0.5s ease';

    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      gsap.from(contentRef.current.querySelectorAll('[data-anim]'), {
        y: 24, opacity: 0, duration: 0.8, stagger: 0.1,
        ease: 'power3.out', delay: 0.1,
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background Elements ── */}
      <PortalCanvas />
      
      {/* Edge vignette overlay - Light version */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(248,250,252,0.6) 100%)',
      }} />

      {/* ── Header ── */}
      <header style={{
        padding: '2rem 2.5rem',
        position: 'relative', zIndex: 2,
      }}>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
          transition: 'color 0.2s', fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <IconArrowLeft /> Kembali ke Beranda
        </Link>
      </header>

      {/* ── Main Content ── */}
      <main ref={contentRef} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem 5rem', position: 'relative', zIndex: 2,
        maxWidth: '700px', margin: '0 auto', width: '100%',
      }}>
        
        {/* Title */}
        <h1 data-anim style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900,
          lineHeight: 1.1, letterSpacing: '-0.03em', color: '#0f172a',
          textAlign: 'center', marginBottom: '0.75rem', fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}>
          Bergabung dengan <span style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            color: 'transparent', display: 'inline-block'
          }}>NCA</span>
        </h1>
        <p data-anim style={{
          fontSize: '1.05rem', color: '#475569', textAlign: 'center',
          marginBottom: '3rem', maxWidth: '500px', lineHeight: 1.6,
        }}>
          Jadilah bagian dari komunitas kreator anime terbesar di Indonesia.
        </p>

        {/* Glassmorphism Join Card - Light version */}
        <div data-anim style={{
          width: '100%',
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: '1.5rem',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          boxShadow: '0 0 40px rgba(124,58,237,0.08), 0 10px 30px rgba(0,0,0,0.05)',
          marginBottom: '2.5rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1.25rem', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Syarat &amp; Ketentuan Seleksi
          </h2>
          
          <ul style={{
            listStyle: 'none', padding: 0, margin: '0 0 2rem 0',
            display: 'flex', flexDirection: 'column', gap: '0.875rem'
          }}>
            {[
              'Memiliki minat tinggi dalam pembuatan konten Anime.',
              'Akun TikTok aktif dan memposting konten secara rutin.',
              'Bersedia mematuhi aturan dan menjaga nama baik komunitas NCA.',
              'Mampu bekerja sama dan berdiskusi dengan member lain.'
            ].map((rule, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#334155', fontSize: '0.95rem', lineHeight: 1.5 }}>
                <div style={{ marginTop: '0.125rem' }}><IconCheck /></div>
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div style={{ textAlign: 'center' }}>
            <a
              href="https://chat.whatsapp.com/DkcRIgiVYbK7o7Qc8lycYi"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                width: '100%', padding: '1rem 1.5rem', borderRadius: '0.75rem',
                fontWeight: 700, fontSize: '1rem', color: '#fff', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                textDecoration: 'none', transition: 'all 0.2s',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(16,185,129,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.25)'; }}
            >
              <IconWhatsApp /> Gabung Grup Seleksi
            </a>
            <p style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              Anda akan diarahkan ke grup WhatsApp seleksi NCA.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div data-anim style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          fontSize: '0.85rem', color: '#64748b', fontWeight: 500,
        }}>
          <a
            href="https://www.tiktok.com/@nanimecreatoraogiri_?is_from_webapp=1&sender_device=pc"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            TikTok Official
          </a>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <a
            href="https://konkon.id/aiz"
            target="_blank" rel="noopener noreferrer"
            style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}
          >
            by Aiz software dev
          </a>
        </div>
      </main>
    </div>
  );
}
