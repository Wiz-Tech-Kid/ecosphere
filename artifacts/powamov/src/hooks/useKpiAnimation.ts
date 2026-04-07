import { useEffect, useState, useRef } from "react";

export function useKpiAnimation(targetValue: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (targetValue === prevTarget.current) return;
    const start = prevTarget.current;
    const end = targetValue;
    prevTarget.current = end;

    let startTime: number | null = null;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}
