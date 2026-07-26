"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // Start
    setVisible(true);
    setWidth(15);

    // Grow to ~85% quickly, then stall — gives impression of loading
    const steps = [30, 50, 65, 75, 82, 87];
    let i = 0;
    function tick() {
      if (i < steps.length) {
        setWidth(steps[i++]);
        timerRef.current = setTimeout(tick, 200 + i * 40);
      }
    }
    timerRef.current = setTimeout(tick, 80);

    // Finish
    const done = setTimeout(() => {
      setWidth(100);
      setTimeout(() => setVisible(false), 300);
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(done);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      aria-hidden="true"
    >
      <div
        className="h-full bg-cta-500 shadow-[0_0_8px_rgba(251,175,23,0.6)] transition-all duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
