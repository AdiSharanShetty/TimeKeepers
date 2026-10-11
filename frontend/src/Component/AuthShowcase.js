import React, { useEffect, useState } from 'react';
import { Watch, VerifiedUser, LocalShipping, SupportAgent } from '@mui/icons-material';

const SLIDES = [
  { src: '/images/Rolex_Submariner.webp', name: 'Rolex Submariner', tag: 'The diver icon' },
  { src: '/images/OmegaSpeedmaster.webp', name: 'Omega Speedmaster', tag: 'Born for the moon' },
  { src: '/images/Rolex_sea_gold.png', name: 'Rolex Sea Gold', tag: 'Our signature piece' },
  { src: '/images/Seiko_presage.webp', name: 'Seiko Presage', tag: 'Japanese craftsmanship' },
];

const PERKS = [
  { icon: <VerifiedUser fontSize="small" />, text: '100% authentic pieces' },
  { icon: <LocalShipping fontSize="small" />, text: 'Insured, tracked delivery' },
  { icon: <SupportAgent fontSize="small" />, text: 'Concierge support, 7 days' },
];

// Shared left-hand brand panel for the auth screens: rotating featured watches,
// boutique headline and trust perks. Purely presentational.
function AuthShowcase({ headline, sub }) {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="auth-showcase">
      <div className="auth-brand">
        <Watch fontSize="small" />
        TIME <small>KEEPERS</small>
      </div>

      <h2 className="auth-headline">{headline}</h2>
      <p className="auth-sub">{sub}</p>

      <div className="auth-stage" aria-hidden="true">
        <div className="auth-glow" />
        <div className="auth-ring" />
        {SLIDES.map((item, index) => (
          <img
            key={item.src}
            src={item.src}
            alt=""
            loading={index === 0 ? 'eager' : 'lazy'}
            className={index === slide ? 'auth-watch active' : 'auth-watch'}
          />
        ))}
      </div>

      <div className="auth-caption" aria-live="polite">
        <strong>{SLIDES[slide].name}</strong>
        <span>{SLIDES[slide].tag}</span>
      </div>

      <div className="auth-dots" role="tablist" aria-label="Featured watches">
        {SLIDES.map((item, index) => (
          <button
            key={item.src}
            type="button"
            role="tab"
            aria-selected={index === slide}
            aria-label={item.name}
            className={index === slide ? 'active' : ''}
            onClick={() => setSlide(index)}
          />
        ))}
      </div>

      <ul className="auth-perks">
        {PERKS.map((perk) => (
          <li key={perk.text}>
            {perk.icon}
            {perk.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default AuthShowcase;
