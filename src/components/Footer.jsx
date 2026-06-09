const IconTikTok = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconYoutube = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#F0FDF4"/>
  </svg>
);
const IconArrowUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);

export default function Footer() {
  const socials = [
    { label: 'TikTok', href: 'https://www.tiktok.com/@nanimecreatoraogiri_?is_from_webapp=1&sender_device=pc', Icon: IconTikTok },
    { label: 'Instagram', href: 'https://instagram.com', Icon: IconInstagram },
    { label: 'YouTube', href: 'https://youtube.com', Icon: IconYoutube },
  ];

  const navLinks = [
    { label: 'Hero', id: 'section-hero' },
    { label: 'Generation', id: 'section-generation' },
    { label: 'Members', id: 'section-members' },
    { label: 'Admin', id: 'section-admin' },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else if (id === 'section-hero') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="section-footer" style={{ padding: '3.5rem 1.5rem 2.5rem', position: 'relative' }}>
      {/* Top line */}
      <div style={{ height: '1px', background: 'rgba(15,23,42,0.08)', marginBottom: '2.5rem' }} />

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Brand */}
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', fontFamily: '"Plus Jakarta Sans", sans-serif', marginBottom: '0.3rem' }}>
              NanimeCreator<span style={{ color: 'rgba(15,23,42,0.3)' }}>Aogiri</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)' }}>
              Komunitas kreator anime Indonesia
            </div>
          </div>

          {/* Quick Navigation */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.2rem' }}>
            {navLinks.map(({ label, id }) => (
              <button
                key={label}
                onClick={() => scrollToSection(id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, color: 'rgba(15,23,42,0.5)',
                  fontFamily: '"Plus Jakarta Sans", sans-serif', transition: 'color 0.2s',
                  padding: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(15,23,42,0.5)'}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Socials */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {socials.map(({ label, href, Icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px', borderRadius: '8px',
                  border: '1px solid rgba(15,23,42,0.1)', color: 'rgba(15,23,42,0.4)',
                  background: 'rgba(255,255,255,0.6)', textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(15,23,42,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <a href="https://konkon.id/aiz" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.4)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(15,23,42,0.4)'}>
            © {new Date().getFullYear()} Developed by konkon.id/aiz
          </a>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.72rem',
              fontWeight: 500, color: 'rgba(15,23,42,0.4)',
              border: '1px solid rgba(15,23,42,0.08)', background: 'transparent', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(15,23,42,0.4)'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.08)'; }}
          >
            <IconArrowUp /> Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
