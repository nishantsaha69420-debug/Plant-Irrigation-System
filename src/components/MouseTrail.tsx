'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface TrailDot {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<TrailDot[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const animRef = useRef<number>(0);

  const MAX_DOTS = 22;
  const DOT_SIZE = 4;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure canvas matches viewport
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dots = dotsRef.current;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // Prepend new dot at cursor position
    dots.unshift({ x: mx, y: my, opacity: 0.65, scale: 1.0 });

    // Clamp to max
    while (dots.length > MAX_DOTS) dots.pop();

    // Draw each dot with trailing fade
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const t = i / MAX_DOTS;
      dot.opacity = 0.55 * (1 - t);
      dot.scale = 1 - t * 0.5;

      const radius = DOT_SIZE * dot.scale;

      // Green glow gradient
      const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius * 3);
      gradient.addColorStop(0, `rgba(116, 198, 157, ${dot.opacity})`);
      gradient.addColorStop(0.4, `rgba(82, 183, 136, ${dot.opacity * 0.6})`);
      gradient.addColorStop(1, `rgba(82, 183, 136, 0)`);

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Solid core dot
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 243, 220, ${dot.opacity * 1.2})`;
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};
