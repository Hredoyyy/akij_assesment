"use client";

import { useCallback, useEffect, useRef } from "react";
import type { UseBehaviorTrackingOptions } from "@/types/hooks";

export function useBehaviorTracking({ enabled, onViolation }: UseBehaviorTrackingOptions) {
  const hasEnteredFullscreenRef = useRef(
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false,
  );

  const reportViolation = useCallback(() => {
    void onViolation();
  }, [onViolation]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportViolation();
      }
    };

    const onWindowBlur = () => {
      reportViolation();
    };

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      if (hasEnteredFullscreenRef.current) {
        reportViolation();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled, reportViolation]);
}
