"use client";

import { useEffect, useRef, useState } from "react";

type UseExamTimerOptions = {
  initialSeconds: number;
  onExpire: () => Promise<void> | void;
};

export function useExamTimer({ initialSeconds, onExpire }: UseExamTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const expiredRef = useRef(initialSeconds <= 0);

  const isExpired = remainingSeconds <= 0;

  useEffect(() => {
    if (isExpired) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        void onExpire();
      }

      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isExpired, onExpire]);

  return {
    remainingSeconds,
    isExpired,
  };
}
