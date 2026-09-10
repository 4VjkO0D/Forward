import { useEffect, useRef, useState, type ReactNode } from 'react';

export type DeckPage = {
  key: string;
  node: ReactNode;
};

/**
 * Full-width pages you swipe between horizontally.
 *
 * The swipe itself is native scrolling (`scroll-snap-type: x mandatory`), so it
 * keeps touch momentum, works offline and costs nothing. Dots + arrow keys are
 * layered on top for mouse/desktop use.
 */
export function SwipeDeck({ pages }: { pages: DeckPage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(pages.length - 1, target));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  };

  // Keep the active dot in sync with the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const width = track.clientWidth || 1;
        const next = Math.round(track.scrollLeft / width);
        setIndex(Math.max(0, Math.min(pages.length - 1, next)));
      });
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.cancelAnimationFrame(frame);
    };
  }, [pages.length]);

  // Arrow keys move between pages, unless you're typing.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <>
      <div className="deck" ref={trackRef}>
        {pages.map((page) => (
          <section className="page" key={page.key}>
            {page.node}
          </section>
        ))}
      </div>

      {pages.length > 1 && (
        <nav className="dots" aria-label="Pages">
          {pages.map((page, i) => (
            <button
              key={page.key}
              type="button"
              className={i === index ? 'dot active' : 'dot'}
              aria-label={`Page ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>
      )}
    </>
  );
}
