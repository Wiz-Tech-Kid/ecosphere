import { useEffect, useState } from "react";

export const useKpiAnimation = (targetValue: number, duration: number = 1000) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * targetValue));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [targetValue, duration]);

  return { count };
};
