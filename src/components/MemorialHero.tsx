import React, { useState } from 'react';
import { FaStar, FaCross } from 'react-icons/fa';

const BACKGROUND_IMAGE_URL = '/assets/background.jpg';

/**
 * MemorialHero
 *
 * Drop this component anywhere in your React app. It renders:
 * - A full‑bleed beautiful background
 * - A title with the person's name
 * - The tagline (defaults to "Born to ne alive" to match your request)
 * - A framed, elegant YouTube video (doesn’t look like a plain link)
 * - A footer with birth and death dates
 *
 * TailwindCSS recommended. If you don’t use Tailwind, the inline styles still keep it decent.
 */
export default function MemorialHero({
  name = 'Marcílio Mendes Pley',
  youtubeId = 'A5QifQL9mdg',
  birth = '11-12-1955',
  death = '09-10-2023',
  tagline = 'Born to be alive',
  backgroundImage = BACKGROUND_IMAGE_URL,
}) {
  const [playing, setPlaying] = useState(false);

  const params = [
    'rel=0',
    'modestbranding=1',
    'controls=0',
    'fs=0', // hide fullscreen button
    'disablekb=1', // disable keyboard controls
    'iv_load_policy=3', // hide annotations
    'playsinline=1',
    'autoplay=1',
    // 'mute=1',
  ].join('&');

  const videoSrc = `https://www.youtube.com/embed/${youtubeId}?${params}`;
  const poster = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  return (
    <section
      className="relative min-h-screen text-white"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
        <header className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight drop-shadow-lg">
            {name}
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg opacity-90 italic">
            {tagline}
          </p>
        </header>

        {/* Scaled-down video */}
        <div
          className="mx-auto w-full max-w-xl md:max-w-2xl"
          style={{ maxHeight: '360px' }}
        >
          <div
            className="relative w-full h-0 pb-[56.25%] rounded-3xl overflow-hidden"
            style={{
              boxShadow:
                '0 0 40px rgba(255,255,255,0.12), 0 30px 80px rgba(0,0,0,0.75)',
              border: '4px solid rgba(255,255,255,0.10)',
              background: '#0b0c10',
            }}
          >
            {!playing ? (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${poster})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '9999px',
                    background: 'rgba(0,0,0,0.6)',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 6,
                      width: 0,
                      height: 0,
                      borderTop: '14px solid transparent',
                      borderBottom: '14px solid transparent',
                      borderLeft: '24px solid white',
                    }}
                  />
                </span>
              </button>
            ) : (
              <iframe
                className="absolute inset-0 w-full h-full pointer-events-none"
                src={videoSrc}
                title={`${name} memorial video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ border: 'none', zIndex: 0 }}
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background:
                  'radial-gradient(140% 90% at 50% 10%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0.45) 100%)',
              }}
            />
          </div>
        </div>

        <footer className="mt-10 md:mt-12 text-center text-sm md:text-base text-white/85">
          <div className="inline-flex items-center gap-4 rounded-full bg-black/30 px-6 py-2 ring-1 ring-white/15 backdrop-blur-md">
            <span className="flex items-center gap-2">
              <FaStar className="h-4 w-4 text-yellow-400" aria-label="born" />
              {birth}
            </span>
            <span className="opacity-70">—</span>
            <span className="flex items-center gap-2">
              <FaCross className="h-4 w-4 text-red-400" aria-label="passed" />
              {death}
            </span>
          </div>
        </footer>
      </div>
    </section>
  );
}
