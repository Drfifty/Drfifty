// كانفاس الجسيمات — خلفية Obsidian المتحركة الموحدة
// يُستخدم في AppLayout — لا منطق عرض داخل JSX
import { useEffect, useRef } from "react";

interface Options {
  count?: number; // 42 افتراضي
  color?: string;
}

export function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, { count = 42, color = "rgba(250,250,250,0.22)" }: Options = {}) {
  // FIX-P1-12: mobile 28 dots reduces O(n²) 861→378 calcs — battery
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cssW = canvas.offsetWidth;
    const cssH = canvas.offsetHeight;

    const isMobile = typeof window!=="undefined" && window.matchMedia("(max-width: 768px)").matches;
    const effCount = isMobile ? Math.min(count, 28) : count;
    const dots = Array.from({ length: effCount }, () => ({
      x: Math.random() * cssW,
      y: Math.random() * cssH,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.1 + 0.5,
    }));

    let alive = true;
    const tick = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, cssW, cssH);
      // جسيمات
      ctx.fillStyle = color;
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > cssW) d.vx *= -1;
        if (d.y < 0 || d.y > cssH) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // وصلات
      ctx.strokeStyle = "rgba(250,250,250,0.06)";
      ctx.lineWidth = 0.7;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.globalAlpha = 1 - dist / 110;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf.current = window.requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    window.addEventListener("resize", onResize);

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => {
      if (mql.matches) {
        if (raf.current) window.cancelAnimationFrame(raf.current);
      } else {
        tick();
      }
    };
    if (mql.matches && raf.current) window.cancelAnimationFrame(raf.current);
    mql.addEventListener?.("change", onMotion);

    return () => {
      alive = false;
      if (raf.current) window.cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      mql.removeEventListener?.("change", onMotion);
    };
  }, [canvasRef, count, color]);
}
