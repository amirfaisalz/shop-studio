'use client';

import { useEffect, useRef } from 'react';

export default function FirecrawlBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 900);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle dot clouds (Firecrawl ASCII/stipple flame simulation)
    const particleCount = 140;
    const particles: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      speed: number;
      opacity: number;
      char: string;
      color: string;
    }[] = [];

    const chars = ['.', ':', '+', '*', 'x', '#', '✦'];
    const colors = [
      'rgba(255, 69, 0, 0.45)',
      'rgba(255, 107, 0, 0.35)',
      'rgba(255, 154, 0, 0.3)',
      'rgba(0, 0, 0, 0.12)',
      'rgba(0, 0, 0, 0.08)',
    ];

    // Seed particles in clusters around the center
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 120 + Math.random() * 320;
      const isLeft = Math.random() > 0.5;
      const clusterCenterX = isLeft ? width * 0.25 : width * 0.75;
      const clusterCenterY = height * 0.45 + (Math.random() - 0.5) * 160;

      const baseX = clusterCenterX + Math.cos(angle) * (radius * 0.8);
      const baseY = clusterCenterY + Math.sin(angle) * (radius * 0.4);

      particles.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        size: Math.random() * 8 + 9,
        speed: 0.0015 + Math.random() * 0.002,
        opacity: Math.random() * 0.6 + 0.2,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      const gridSize = 64;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw grid intersection dots & glowing sparks
      for (let x = 0; x <= width; x += gridSize) {
        for (let y = 0; y <= height; y += gridSize) {
          // Small dot at each intersection
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Occasional glowing orange 4-point star spark
          const isSparkSpot = (x / gridSize + y / gridSize) % 7 === 0;
          if (isSparkSpot && y > 100 && y < height - 100) {
            const sparkPulse = (Math.sin(time + x + y) + 1) / 2;
            const sparkSize = 5 + sparkPulse * 4;

            ctx.fillStyle = `rgba(255, 69, 0, ${0.4 + sparkPulse * 0.5})`;
            ctx.font = `${sparkSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', x, y);
          }
        }
      }

      // Draw ASCII stippled flame particles
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const p of particles) {
        // Floating wave motion
        const waveX = Math.sin(time * 0.8 + p.baseY * 0.01) * 12;
        const waveY = Math.cos(time * 0.6 + p.baseX * 0.01) * 8;
        const currentOpacity = p.opacity * (0.7 + Math.sin(time * 1.5 + p.baseX) * 0.3);

        ctx.font = `${p.size}px monospace`;
        ctx.fillStyle = p.color.replace(/[\d\.]+\)$/, `${currentOpacity})`);
        ctx.fillText(p.char, p.baseX + waveX, p.baseY + waveY);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {/* 2D Canvas for Grid, Sparks, and ASCII Stipple Cloud */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Monospace Decorative Corner Labels in Firecrawl Style */}
      <div className="absolute top-24 left-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block">
        [ 200 OK ]
      </div>
      <div className="absolute top-24 right-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block">
        [ SHOPIFY OS 2.0 ]
      </div>
      <div className="absolute top-[480px] left-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block">
        [ .LIQUID ]
      </div>
      <div className="absolute top-[480px] right-8 font-mono text-[11px] text-neutral-400 font-semibold hidden xl:block">
        [ .JSON ]
      </div>

      {/* Top Banner & Hero Ambient Radial Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.14),transparent_65%)] blur-[90px] animate-pulse-glow" />
    </div>
  );
}
