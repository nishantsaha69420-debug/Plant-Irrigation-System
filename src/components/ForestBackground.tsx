'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
  hue: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  swayAmplitude: number;
  swaySpeed: number;
  swayOffset: number;
  opacity: number;
  colorType: 'emerald' | 'sage' | 'moss';
}

export const ForestBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Create glowing firefly / spore particles
    const particleCount = Math.min(35, Math.floor(width / 35));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1.2,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.015,
      pulseOffset: Math.random() * Math.PI * 2,
      hue: Math.random() > 0.4 ? 145 : 75, // emerald or golden green
    }));

    // Create floating leaves
    const leafCount = Math.min(16, Math.floor(width / 70));
    const leafColors = {
      emerald: 'rgba(52, 211, 153, ',
      sage: 'rgba(168, 185, 154, ',
      moss: 'rgba(74, 133, 94, ',
    };

    const leaves: Leaf[] = Array.from({ length: leafCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 12 + 10,
      speedY: Math.random() * 0.5 + 0.3,
      speedX: Math.random() * 0.4 + 0.2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      swayAmplitude: Math.random() * 20 + 10,
      swaySpeed: Math.random() * 0.02 + 0.01,
      swayOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.4 + 0.25,
      colorType: Math.random() > 0.6 ? 'emerald' : Math.random() > 0.3 ? 'sage' : 'moss',
    }));

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle forest light canopy gradient
      const canopyGrad = ctx.createRadialGradient(
        width * 0.2,
        height * 0.1,
        0,
        width * 0.2,
        height * 0.1,
        width * 0.7
      );
      canopyGrad.addColorStop(0, 'rgba(45, 106, 79, 0.15)');
      canopyGrad.addColorStop(0.5, 'rgba(24, 54, 41, 0.05)');
      canopyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = canopyGrad;
      ctx.fillRect(0, 0, width, height);

      // Render & update glowing particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const pulse = Math.sin(tick * p.pulseSpeed + p.pulseOffset);
        const currentOpacity = Math.max(0.1, p.opacity + pulse * 0.3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${currentOpacity})`;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 60%, ${currentOpacity * 0.8})`;
        ctx.shadowBlur = p.size * 5;
        ctx.fill();
      }

      ctx.shadowBlur = 0; // Reset shadow for leaves

      // Render & update drifting leaves
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        leaf.y += leaf.speedY;
        leaf.x += leaf.speedX + Math.sin(tick * leaf.swaySpeed + leaf.swayOffset) * 0.4;
        leaf.rotation += leaf.rotationSpeed;

        if (leaf.y > height + 20) {
          leaf.y = -20;
          leaf.x = Math.random() * width;
        }
        if (leaf.x > width + 20) leaf.x = -20;

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);

        // Draw botanical leaf silhouette
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size);
        ctx.bezierCurveTo(
          leaf.size * 0.6,
          -leaf.size * 0.4,
          leaf.size * 0.6,
          leaf.size * 0.4,
          0,
          leaf.size
        );
        ctx.bezierCurveTo(
          -leaf.size * 0.6,
          leaf.size * 0.4,
          -leaf.size * 0.6,
          -leaf.size * 0.4,
          0,
          -leaf.size
        );

        ctx.fillStyle = `${leafColors[leaf.colorType]}${leaf.opacity})`;
        ctx.fill();

        // Draw leaf central vein
        ctx.beginPath();
        ctx.moveTo(0, -leaf.size * 0.8);
        ctx.lineTo(0, leaf.size * 0.8);
        ctx.strokeStyle = `rgba(255, 255, 255, ${leaf.opacity * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
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
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
};
