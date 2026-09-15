// إضاءة تقاربية — تحدّث --cx/--cy على Obsidian canvas
// تفصل حركة الماوس عن JSX — صفحات العرض لا تلمس window
import { useEffect, useRef } from "react";

export function useProximityLighting(targetRef: React.RefObject<HTMLElement | null>) {
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = targetRef.current ?? document.documentElement;
    const onMove = (e: MouseEvent) => {
      if (raf.current) return;
      raf.current = window.requestAnimationFrame(() => {
        raf.current = null;
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        el.style.setProperty("--cx", `${x}%`);
        el.style.setProperty("--cy", `${y}%`);
      });
    };
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mql.matches) window.addEventListener("mousemove", onMove, { passive: true });
    const onChange = () => {
      if (mql.matches) window.removeEventListener("mousemove", onMove);
      else window.addEventListener("mousemove", onMove, { passive: true });
    };
    mql.addEventListener?.("change", onChange);
    return () => {
      window.removeEventListener("mousemove", onMove);
      mql.removeEventListener?.("change", onChange);
      if (raf.current) window.cancelAnimationFrame(raf.current);
    };
  }, [targetRef]);
}
