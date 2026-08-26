'use client';

import React, { useEffect, useState, useRef, useMemo, useSyncExternalStore, memo } from 'react';

// Types of micro-animations rendered inside each big square
export type AnimationType =
  | 'liquid-token'
  | 'isometric-cube'
  | 'radar-pulse'
  | 'sparkline-chart'
  | 'hud-viewfinder'
  | 'waveform-bars'
  | 'shopify-pill'
  | 'sparkle-stars'
  | 'stipple-matrix'
  | 'metric-counter'
  | 'laser-beam'
  | 'binary-stream'
  | 'ecommerce-badge'
  | 'circuit-nodes'
  | 'compass-dial'
  | 'breathing-core';

export interface GridCell {
  id: string;
  row: number;
  col: number;
  hasAnimation: boolean;
  animType: AnimationType;
  delay: number;
  duration: number;
  scale: number;
  variantIndex: number;
}

export interface BigSquaresBackgroundProps {
  /** Optional custom square size in pixels. Default is responsive (140px / 116px / 88px) */
  cellSize?: number;
  /** Opacity intensity for unhovered micro-animations */
  density?: 'subtle' | 'normal' | 'vibrant';
  /** Percentage of cells that contain active micro-animations (0.0 to 1.0, default 0.36) */
  animationCoverage?: number;
  /** Whether to show the monospace corner tech status labels */
  showTechLabels?: boolean;
  /** Whether to show ambient orange radial glow orbs */
  showGlowOrbs?: boolean;
  /** Soft-focus vignette mask type */
  maskVariant?: 'center' | 'subtle' | 'none';
  /** Additional classes for the container */
  className?: string;
  /** Seed offset to create unique animation distribution for different sections */
  seedOffset?: number;
}

const ALL_ANIMATION_TYPES: AnimationType[] = [
  'liquid-token',
  'isometric-cube',
  'radar-pulse',
  'sparkline-chart',
  'hud-viewfinder',
  'waveform-bars',
  'shopify-pill',
  'sparkle-stars',
  'stipple-matrix',
  'metric-counter',
  'laser-beam',
  'binary-stream',
  'ecommerce-badge',
  'circuit-nodes',
  'compass-dial',
  'breathing-core',
];

// Lightweight Seeded PRNG
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function BigSquaresBackground({
  cellSize: customCellSize,
  density = 'normal',
  animationCoverage = 0.36,
  showTechLabels = false,
  showGlowOrbs = true,
  maskVariant = 'subtle',
  className = '',
  seedOffset = 42,
}: BigSquaresBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1440,
    height: 900,
  });
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isVisible, setIsVisible] = useState(true);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [ambientPulseIndex, setAmbientPulseIndex] = useState<number>(0);

  // IntersectionObserver: Pause CPU work completely when section is scrolled offscreen
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Resize & dimension updates
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        const w = parent ? parent.clientWidth : window.innerWidth;
        const h = parent ? parent.clientHeight : window.innerHeight;
        setDimensions({
          width: Math.max(w, window.innerWidth),
          height: Math.max(h, 500),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Ambient periodic pulse to ignite random squares (ONLY when visible on screen)
  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setAmbientPulseIndex((prev) => (prev + 1) % 30);
    }, 2800);
    return () => clearInterval(timer);
  }, [isVisible]);

  // Global mouse tracking with RAF throttling (ONLY when visible on screen)
  useEffect(() => {
    if (!isVisible) return;

    let rafId: number | null = null;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= -40 && x <= rect.width + 40 && y >= -40 && y <= rect.height + 40) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setMousePos({ x, y });
        });
      } else if (mousePos !== null) {
        setMousePos(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isVisible, mousePos]);

  // Dynamic responsive cell sizing: ~140px desktop, ~116px tablet, ~88px mobile
  const cellSize = useMemo(() => {
    if (customCellSize) return customCellSize;
    if (dimensions.width < 640) return 88;
    if (dimensions.width < 1024) return 116;
    return 140;
  }, [customCellSize, dimensions.width]);

  // Responsive scale multiplier for micro-animations
  const responsiveScale = useMemo(() => {
    if (dimensions.width < 640) return 0.76;
    if (dimensions.width < 1024) return 0.88;
    return 1.0;
  }, [dimensions.width]);

  const cols = Math.max(3, Math.ceil(dimensions.width / cellSize) + 1);
  const rows = Math.max(3, Math.ceil(dimensions.height / cellSize) + 1);

  // Generate grid matrix with selective animation distribution
  const cells: GridCell[] = useMemo(() => {
    const list: GridCell[] = [];
    let seed = seedOffset;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        seed++;
        // Keep central text zone clean and pristine so hero typography has maximum legibility
        const centerCol = Math.floor(cols / 2);
        const isCenterHeroZone = maskVariant === 'center' && r <= 4 && Math.abs(c - centerCol) <= 2;
        const hasAnimation = !isCenterHeroZone && pseudoRandom(seed * 2.3) < animationCoverage;
        const randTypeIdx = Math.floor(pseudoRandom(seed * 3.7) * ALL_ANIMATION_TYPES.length);
        const animType = ALL_ANIMATION_TYPES[randTypeIdx];
        const delay = +(pseudoRandom(seed * 7.1) * 3.2).toFixed(2);
        const duration = +(3.0 + pseudoRandom(seed * 11.3) * 2.5).toFixed(2);
        const baseScale = +(0.95 + pseudoRandom(seed * 13.5) * 0.15).toFixed(2);
        const scale = +(baseScale * responsiveScale).toFixed(2);
        const variantIndex = Math.floor(pseudoRandom(seed * 17.9) * 4);

        list.push({
          id: `cell-${seedOffset}-${r}-${c}`,
          row: r,
          col: c,
          hasAnimation,
          animType,
          delay,
          duration,
          scale,
          variantIndex,
        });
      }
    }
    return list;
  }, [cols, rows, seedOffset, animationCoverage, responsiveScale, maskVariant]);

  // Base opacity class based on density prop
  const baseOpacityClass =
    density === 'subtle'
      ? 'opacity-35 hover:opacity-100'
      : density === 'vibrant'
      ? 'opacity-70 hover:opacity-100'
      : 'opacity-50 hover:opacity-100';

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none bg-[#FAFAFA] will-change-transform ${className}`}
      style={{ contain: 'paint' }}
      aria-hidden="true"
    >
      {/* Top Ambient Fiery Radial Glows */}
      {showGlowOrbs && isVisible && (
        <>
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[850px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.13),transparent_70%)] blur-[90px] animate-pulse-glow" />
          <div className="absolute top-1/4 -left-20 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(255,138,101,0.07),transparent_70%)] blur-[75px]" />
          <div className="absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,87,34,0.07),transparent_70%)] blur-[75px]" />
        </>
      )}

      {/* The Big Squares Grid Container */}
      <div
        className="absolute top-0 left-0 grid will-change-transform"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          width: cols * cellSize,
          height: rows * cellSize,
        }}
      >
        {cells.map((cell, idx) => {
          // Calculate distance to cursor
          let isHoverProximity = false;
          let proximityIntensity = 0;

          if (mousePos) {
            const cellCenterX = cell.col * cellSize + cellSize / 2;
            const cellCenterY = cell.row * cellSize + cellSize / 2;
            const dist = Math.hypot(mousePos.x - cellCenterX, mousePos.y - cellCenterY);
            if (dist < cellSize * 1.5) {
              isHoverProximity = true;
              proximityIntensity = Math.max(0, 1 - dist / (cellSize * 1.5));
            }
          }

          // Ambient living pulse
          const isAmbientActive = isVisible && (idx + ambientPulseIndex * 7) % 23 === 0;

          return (
            <div
              key={cell.id}
              className={`relative flex items-center justify-center border-r border-b border-neutral-200/60 transition-colors duration-300 overflow-hidden ${
                isAmbientActive
                  ? 'bg-orange-500/[0.045] border-orange-300/45'
                  : isHoverProximity
                  ? 'bg-orange-500/[0.07] border-orange-400/55'
                  : 'bg-transparent'
              }`}
              style={{
                width: cellSize,
                height: cellSize,
              }}
            >
              {/* Corner Intersection Crosshair Marker '+' */}
              <span className="absolute -top-[6px] -left-[6px] font-mono text-[11px] font-bold text-neutral-300/80 leading-none select-none z-10">
                +
              </span>

              {/* Dynamic Interactive Proximity Flare */}
              {isHoverProximity && (
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.16),transparent_70%)] transition-opacity duration-150"
                  style={{ opacity: proximityIntensity }}
                />
              )}

              {/* Micro-Animation inside selective cells */}
              {isMounted && cell.hasAnimation && (
                <div
                  className={`relative flex items-center justify-center w-full h-full p-2 transition-opacity duration-300 will-change-transform ${
                    isHoverProximity
                      ? 'opacity-100'
                      : isAmbientActive
                      ? 'opacity-90'
                      : baseOpacityClass
                  }`}
                  style={{
                    transform: `scale(${cell.scale})`,
                  }}
                >
                  <MicroAnimationRenderer
                    type={cell.animType}
                    variant={cell.variantIndex}
                    delay={cell.delay}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Decorative Monospace Tech Labels */}
      {showTechLabels && (
        <>
          <div className="absolute top-20 left-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block z-10 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded border border-neutral-200/80">
            [ SYSTEM: ONLINE // OS 2.0 ]
          </div>
          <div className="absolute top-20 right-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block z-10 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded border border-neutral-200/80">
            [ ENGINE: LIQUID COMPILER ]
          </div>
          <div className="absolute top-[480px] left-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block z-10 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded border border-neutral-200/80">
            [ SCHEMA: VALIDATED ]
          </div>
          <div className="absolute top-[480px] right-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block z-10 bg-white/70 backdrop-blur-xs px-2.5 py-0.5 rounded border border-neutral-200/80">
            [ ASSETS: IMAGEKIT CDN ]
          </div>
        </>
      )}

      {/* Soft Radial Vignette Mask */}
      {maskVariant === 'center' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.45)_55%,rgba(255,255,255,0.08)_100%)] z-10" />
      )}
      {maskVariant === 'subtle' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.35)_60%,transparent_100%)] z-10" />
      )}

      {/* Bottom Gradient Fade Out */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
    </div>
  );
}

export default memo(BigSquaresBackground);

// Micro-animation component dispatcher
const MicroAnimationRenderer = memo(function MicroAnimationRenderer({
  type,
  variant,
  delay,
}: {
  type: AnimationType;
  variant: number;
  delay: number;
}) {
  switch (type) {
    case 'liquid-token':
      return <LiquidTokenAnim variant={variant} delay={delay} />;
    case 'isometric-cube':
      return <IsometricCubeAnim delay={delay} />;
    case 'radar-pulse':
      return <RadarPulseAnim delay={delay} />;
    case 'sparkline-chart':
      return <SparklineChartAnim variant={variant} delay={delay} />;
    case 'hud-viewfinder':
      return <HudViewfinderAnim delay={delay} />;
    case 'waveform-bars':
      return <WaveformBarsAnim delay={delay} />;
    case 'shopify-pill':
      return <ShopifyPillAnim variant={variant} delay={delay} />;
    case 'sparkle-stars':
      return <SparkleStarsAnim delay={delay} />;
    case 'stipple-matrix':
      return <StippleMatrixAnim delay={delay} />;
    case 'metric-counter':
      return <MetricCounterAnim variant={variant} delay={delay} />;
    case 'laser-beam':
      return <LaserBeamAnim delay={delay} />;
    case 'binary-stream':
      return <BinaryStreamAnim variant={variant} delay={delay} />;
    case 'ecommerce-badge':
      return <EcommerceBadgeAnim variant={variant} delay={delay} />;
    case 'circuit-nodes':
      return <CircuitNodesAnim delay={delay} />;
    case 'compass-dial':
      return <CompassDialAnim delay={delay} />;
    case 'breathing-core':
      return <BreathingCoreAnim delay={delay} />;
    default:
      return null;
  }
});

/* =========================================================================
   16 ULTRA-LIGHTWEIGHT GPU-COMPOSITED MICRO-ANIMATIONS
   ========================================================================= */

const LiquidTokenAnim = memo(function LiquidTokenAnim({ variant, delay }: { variant: number; delay: number }) {
  const tokens = [
    { tag: '{% schema %}', color: 'text-[#FF4500]', bg: 'bg-orange-50/90 border-orange-200/80' },
    { tag: '{{ product.title }}', color: 'text-neutral-700', bg: 'bg-white/90 border-neutral-200/80' },
    { tag: '{% render "cart" %}', color: 'text-[#8B5CF6]', bg: 'bg-purple-50/90 border-purple-200/80' },
    { tag: '{{ "theme.css" | asset }}', color: 'text-emerald-700', bg: 'bg-emerald-50/90 border-emerald-200/80' },
  ];
  const item = tokens[variant % tokens.length];

  return (
    <div
      className={`animate-code-ticker inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[9.5px] font-semibold border shadow-2xs ${item.bg} ${item.color}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{item.tag}</span>
    </div>
  );
});

const IsometricCubeAnim = memo(function IsometricCubeAnim({ delay }: { delay: number }) {
  return (
    <div
      className="relative flex items-center justify-center animate-float-drift will-change-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      <svg
        className="w-11 h-11 animate-wireframe-spin text-[#FF4500]/80 will-change-transform"
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        style={{ animationDuration: '22s', animationDelay: `${delay}s` }}
      >
        <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" strokeDasharray="3 2" />
        <line x1="24" y1="4" x2="24" y2="24" />
        <line x1="24" y1="24" x2="42" y2="34" />
        <line x1="24" y1="24" x2="6" y2="34" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <circle cx="24" cy="4" r="1.5" fill="currentColor" />
        <circle cx="42" cy="14" r="1.5" fill="currentColor" />
        <circle cx="42" cy="34" r="1.5" fill="currentColor" />
        <circle cx="24" cy="44" r="1.5" fill="currentColor" />
        <circle cx="6" cy="34" r="1.5" fill="currentColor" />
        <circle cx="6" cy="14" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
});

const RadarPulseAnim = memo(function RadarPulseAnim({ delay }: { delay: number }) {
  return (
    <div className="relative flex items-center justify-center h-12 w-12 will-change-transform">
      <div
        className="animate-radar-ping absolute h-11 w-11 rounded-full border border-[#FF4500]/60 will-change-transform"
        style={{ animationDelay: `${delay}s` }}
      />
      <div
        className="animate-radar-ping absolute h-11 w-11 rounded-full border border-[#FF8A65]/50 will-change-transform"
        style={{ animationDelay: `${delay + 1.2}s` }}
      />
      <div className="h-6 w-6 rounded-full border border-neutral-300/80" />
      <div className="absolute h-2 w-2 rounded-full bg-[#FF4500] shadow-[0_0_8px_#FF4500]" />
    </div>
  );
});

const SparklineChartAnim = memo(function SparklineChartAnim({ variant, delay }: { variant: number; delay: number }) {
  const paths = [
    'M 2 24 Q 10 6, 18 16 T 32 4 T 46 14',
    'M 2 26 L 12 16 L 22 22 L 34 6 L 46 10',
    'M 2 20 Q 14 28, 24 8 T 46 6',
  ];
  const path = paths[variant % paths.length];

  return (
    <div className="relative w-12 h-8 flex items-center justify-center">
      <svg className="w-12 h-8 overflow-visible" viewBox="0 0 48 30">
        <path
          d={path}
          fill="none"
          stroke="#FF4500"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="animate-sparkline-dash will-change-transform"
          style={{ animationDelay: `${delay}s` }}
        />
        <circle
          cx="34"
          cy="6"
          r="2"
          fill="#FF4500"
          className="animate-spark-twinkle shadow-[0_0_6px_#FF4500]"
          style={{ animationDelay: `${delay + 0.5}s` }}
        />
      </svg>
    </div>
  );
});

const HudViewfinderAnim = memo(function HudViewfinderAnim({ delay }: { delay: number }) {
  return (
    <div
      className="animate-corner-focus relative w-10 h-10 flex items-center justify-center text-neutral-500 font-bold will-change-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="absolute top-0 left-0 font-mono text-[11px] leading-none text-[#FF4500]/80">┌</span>
      <span className="absolute top-0 right-0 font-mono text-[11px] leading-none text-[#FF4500]/80">┐</span>
      <span className="absolute bottom-0 left-0 font-mono text-[11px] leading-none text-[#FF4500]/80">└</span>
      <span className="absolute bottom-0 right-0 font-mono text-[11px] leading-none text-[#FF4500]/80">┘</span>
      <span className="font-mono text-[10px] font-bold text-neutral-600">+</span>
    </div>
  );
});

const WaveformBarsAnim = memo(function WaveformBarsAnim({ delay }: { delay: number }) {
  return (
    <div
      className="flex items-end justify-center gap-1 h-7 w-10 origin-bottom"
      style={{ animationDelay: `${delay}s` }}
    >
      <span
        className="w-1.2 h-full rounded-full bg-[#FF4500]/90 origin-bottom will-change-transform"
        style={{
          animation: 'equalizer-1 1.8s ease-in-out infinite',
          animationDelay: `${delay}s`,
        }}
      />
      <span
        className="w-1.2 h-full rounded-full bg-[#FF5722] origin-bottom will-change-transform"
        style={{
          animation: 'equalizer-2 1.6s ease-in-out infinite',
          animationDelay: `${delay + 0.2}s`,
        }}
      />
      <span
        className="w-1.2 h-full rounded-full bg-[#FF8A65] origin-bottom will-change-transform"
        style={{
          animation: 'equalizer-3 2.1s ease-in-out infinite',
          animationDelay: `${delay + 0.4}s`,
        }}
      />
      <span
        className="w-1.2 h-full rounded-full bg-neutral-700 origin-bottom will-change-transform"
        style={{
          animation: 'equalizer-4 1.7s ease-in-out infinite',
          animationDelay: `${delay + 0.1}s`,
        }}
      />
      <span
        className="w-1.2 h-full rounded-full bg-[#FF4500]/80 origin-bottom will-change-transform"
        style={{
          animation: 'equalizer-5 2.3s ease-in-out infinite',
          animationDelay: `${delay + 0.3}s`,
        }}
      />
    </div>
  );
});

const ShopifyPillAnim = memo(function ShopifyPillAnim({ variant, delay }: { variant: number; delay: number }) {
  const pills = [
    { label: 'OS 2.0', dot: 'bg-emerald-500', text: 'text-neutral-800', border: 'border-emerald-200/90 bg-emerald-50/80' },
    { label: 'AI SYNC', dot: 'bg-[#FF4500]', text: 'text-[#FF4500]', border: 'border-orange-200/90 bg-orange-50/80' },
    { label: 'LIVE 200', dot: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200/90 bg-blue-50/80' },
    { label: 'VALID', dot: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-200/90 bg-emerald-50/80' },
  ];
  const item = pills[variant % pills.length];

  return (
    <div
      className={`animate-float-drift flex items-center gap-1.5 rounded-full border px-2 py-0.5 shadow-2xs font-mono text-[9px] font-bold ${item.border}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot} animate-pulse`} />
      <span className={item.text}>{item.label}</span>
    </div>
  );
});

const SparkleStarsAnim = memo(function SparkleStarsAnim({ delay }: { delay: number }) {
  return (
    <div
      className="animate-spark-twinkle relative flex items-center justify-center text-[#FF4500] will-change-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-xl leading-none select-none drop-shadow-[0_0_10px_rgba(255,69,0,0.6)] font-bold">
        ✦
      </span>
      <span
        className="absolute text-[10px] -top-1 -right-2 text-amber-500 font-bold opacity-80"
        style={{ animation: 'spark-twinkle 2.4s ease-in-out infinite', animationDelay: `${delay + 0.7}s` }}
      >
        ✧
      </span>
    </div>
  );
});

const StippleMatrixAnim = memo(function StippleMatrixAnim({ delay }: { delay: number }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-neutral-500/80 will-change-transform"
          style={{
            animation: 'ambient-heat 2.8s ease-in-out infinite',
            animationDelay: `${delay + i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
});

const MetricCounterAnim = memo(function MetricCounterAnim({ variant, delay }: { variant: number; delay: number }) {
  const metrics = [
    { label: '+184%', sub: 'CTR LIFT', color: 'text-emerald-600' },
    { label: '0.02s', sub: 'LATENCY', color: 'text-[#FF4500]' },
    { label: '100%', sub: 'VALIDATED', color: 'text-blue-600' },
    { label: '#FF4500', sub: 'ACCENT', color: 'text-neutral-800' },
  ];
  const item = metrics[variant % metrics.length];

  return (
    <div
      className="animate-code-ticker flex flex-col items-center justify-center text-center font-mono rounded-md bg-white/90 border border-neutral-200/90 px-1.5 py-0.5 shadow-2xs"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className={`text-[11px] font-extrabold tracking-tight ${item.color}`}>
        {item.label}
      </span>
      <span className="text-[7.5px] font-semibold tracking-wider text-neutral-400 uppercase">
        {item.sub}
      </span>
    </div>
  );
});

const LaserBeamAnim = memo(function LaserBeamAnim({ delay }: { delay: number }) {
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-neutral-200/90 bg-white/70 shadow-2xs">
      <div
        className="animate-beam-slide absolute inset-0 w-full h-[200%] bg-gradient-to-b from-transparent via-[#FF4500]/40 to-transparent will-change-transform"
        style={{ animationDelay: `${delay}s` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[8.5px] font-bold text-neutral-500 tracking-wider">
          SCAN
        </span>
      </div>
    </div>
  );
});

const BinaryStreamAnim = memo(function BinaryStreamAnim({ variant, delay }: { variant: number; delay: number }) {
  const streams = [
    ['0110 1001', '1100 0010'],
    ['0x7F4A 20', '0x99B3 FF'],
    ['LIQUID:OK', 'SCHEMA:200'],
    ['THEME.ZIP', 'JSON:SYNC'],
  ];
  const lines = streams[variant % streams.length];

  return (
    <div
      className="animate-code-ticker flex flex-col font-mono text-[8.5px] font-semibold text-neutral-500 leading-snug select-none rounded-md bg-white/80 border border-neutral-200/80 px-1.5 py-0.5 shadow-2xs"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-neutral-600">{lines[0]}</span>
      <span className="text-[#FF4500] font-bold">{lines[1]}</span>
    </div>
  );
});

const EcommerceBadgeAnim = memo(function EcommerceBadgeAnim({ variant, delay }: { variant: number; delay: number }) {
  const items = [
    { text: '$89.00', icon: '🏷️', color: 'text-neutral-800 font-bold' },
    { text: '★ 4.9', icon: '', color: 'text-amber-600 font-bold' },
    { text: 'IN STOCK', icon: '•', color: 'text-emerald-600 font-bold' },
    { text: '-20% OFF', icon: '🔥', color: 'text-[#FF4500] font-bold' },
  ];
  const item = items[variant % items.length];

  return (
    <div
      className="animate-float-drift inline-flex items-center gap-1 rounded-md border border-neutral-200/90 bg-white/90 px-2 py-0.5 text-[9px] shadow-2xs font-mono"
      style={{ animationDelay: `${delay}s` }}
    >
      {item.icon && <span>{item.icon}</span>}
      <span className={item.color}>{item.text}</span>
    </div>
  );
});

const CircuitNodesAnim = memo(function CircuitNodesAnim({ delay }: { delay: number }) {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-10 h-10 overflow-visible" viewBox="0 0 40 40" fill="none">
        <path
          d="M 5 20 L 15 20 L 25 10 L 35 10"
          stroke="#FF4500"
          strokeWidth="1.5"
          className="animate-circuit-glow"
          style={{ animationDelay: `${delay}s` }}
        />
        <path
          d="M 15 20 L 25 30 L 35 30"
          stroke="#6B7280"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
        <circle cx="15" cy="20" r="2" fill="#FF4500" />
        <circle cx="25" cy="10" r="2" fill="#FF4500" />
        <circle cx="25" cy="30" r="1.5" fill="#6B7280" />
      </svg>
    </div>
  );
});

const CompassDialAnim = memo(function CompassDialAnim({ delay }: { delay: number }) {
  return (
    <div
      className="relative flex items-center justify-center h-10 w-10 will-change-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      <svg
        className="w-10 h-10 animate-wireframe-counter-spin text-neutral-500 will-change-transform"
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        style={{ animationDuration: '18s', animationDelay: `${delay}s` }}
      >
        <circle cx="20" cy="20" r="16" strokeDasharray="4 2" />
        <line x1="20" y1="4" x2="20" y2="8" stroke="#FF4500" strokeWidth="1.8" />
        <line x1="20" y1="32" x2="20" y2="36" />
        <line x1="4" y1="20" x2="8" y2="20" />
        <line x1="32" y1="20" x2="36" y2="20" />
      </svg>
      <div className="absolute h-1.8 w-1.8 rounded-full bg-[#FF4500] shadow-[0_0_6px_#FF4500]" />
    </div>
  );
});

const BreathingCoreAnim = memo(function BreathingCoreAnim({ delay }: { delay: number }) {
  return (
    <div
      className="animate-ambient-heat relative flex items-center justify-center h-10 w-10 will-change-transform"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="h-9 w-9 rounded-full bg-[radial-gradient(circle,rgba(255,69,0,0.35)_0%,rgba(255,138,101,0.15)_60%,transparent_80%)] blur-[3px]" />
      <div className="absolute h-2.5 w-2.5 rounded-full bg-[#FF4500] shadow-[0_0_10px_#FF4500]" />
    </div>
  );
});
