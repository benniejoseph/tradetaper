'use client';

import { useEffect, useRef } from 'react';
import type { AnimationItem } from 'lottie-web';

interface LottieAnimationProps {
  /** Path to a Lottie JSON file, e.g. /lottie/candle-loader.json */
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  ariaLabel?: string;
  /** Called once when a non-looping animation finishes. */
  onComplete?: () => void;
}

/**
 * Lightweight Lottie player. Uses the SVG-only "light" build of
 * lottie-web, loaded dynamically so it never lands in the initial bundle.
 * Animations are authored via the text-to-lottie skill in
 * .agents/skills/text-to-lottie and live in /public/lottie.
 */
export default function LottieAnimation({
  src,
  loop = true,
  autoplay = true,
  className,
  ariaLabel,
  onComplete,
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let anim: AnimationItem | undefined;
    let cancelled = false;

    import('lottie-web/build/player/lottie_light').then((mod) => {
      if (cancelled || !containerRef.current) return;
      anim = mod.default.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: src,
      });
      anim.addEventListener('complete', () => onCompleteRef.current?.());
    });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [src, loop, autoplay]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
