import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroSection from '../components/HeroSection';
import GenerationSlider from '../components/GenerationSlider';
import MemberSection from '../components/MemberSection';
import AdminSection from '../components/AdminSection';
import Footer from '../components/Footer';

gsap.registerPlugin(ScrollTrigger);

// Section background colors per PRD
const SECTIONS = [
  { id: 'section-hero',       bg: '#f8f6ff' },   // lavender-tinted white
  { id: 'section-generation', bg: '#fff1f2' },   // rose pastel
  { id: 'section-members',    bg: '#eff6ff' },   // blue pastel
  { id: 'section-admin',      bg: '#faf5ff' },   // soft violet for admin
  { id: 'section-footer',     bg: '#f0fdf4' },   // green pastel
];

export default function HomePage() {
  useEffect(() => {
    // Set initial background immediately (no flash)
    document.body.style.backgroundColor = SECTIONS[0].bg;
    document.body.style.transition = 'none';

    const triggers = [];

    SECTIONS.forEach(({ id, bg }, i) => {
      const el = document.getElementById(id);
      if (!el) return;

      // Transition INTO this section smoothly as its top edge hits the viewport center
      const t = ScrollTrigger.create({
        trigger: el,
        // Start: when top of section reaches 80% of viewport (early enough)
        start: 'top 80%',
        // End: when top of section reaches 20% of viewport
        end: 'top 20%',
        // scrub: true ties progress directly to scroll position
        scrub: 0.6,
        onEnter: () => {
          gsap.to(document.body, {
            backgroundColor: bg,
            duration: 0.7,
            ease: 'power1.inOut',
            overwrite: 'auto',
          });
        },
        onEnterBack: () => {
          // When scrolling back up, transition to previous section color
          const prevBg = i > 0 ? SECTIONS[i - 1].bg : SECTIONS[0].bg;
          gsap.to(document.body, {
            backgroundColor: prevBg,
            duration: 0.7,
            ease: 'power1.inOut',
            overwrite: 'auto',
          });
        },
      });

      triggers.push(t);
    });

    // Cleanup: revert body style when leaving HomePage
    return () => {
      triggers.forEach(t => t.kill());
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <div>
      <HeroSection />
      <GenerationSlider />
      <MemberSection />
      <AdminSection />
      <Footer />
    </div>
  );
}
