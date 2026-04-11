"use client";

import { useCallback, useEffect, useRef } from "react";
import type { UseBehaviorTrackingOptions } from "@/types/hooks";

export function useBehaviorTracking({ enabled, onViolation }: UseBehaviorTrackingOptions) {
  const hasEnteredFullscreenRef = useRef(
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false,
  );
  const wasFullscreenRef = useRef(
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false,
  );
  const lastFullscreenViolationAtRef = useRef(0);

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

    const getFullscreenElement = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };

      return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
    };

    const reportFullscreenExitViolation = () => {
      const now = Date.now();
      // Prevent duplicate events from firing multiple violations for a single exit action.
      if (now - lastFullscreenViolationAtRef.current < 400) {
        return;
      }

      lastFullscreenViolationAtRef.current = now;
      reportViolation();
    };

    const syncFullscreenTransition = () => {
      const isFullscreenNow = Boolean(getFullscreenElement());

      if (isFullscreenNow) {
        hasEnteredFullscreenRef.current = true;
      }

      if (wasFullscreenRef.current && !isFullscreenNow && hasEnteredFullscreenRef.current) {
        reportFullscreenExitViolation();
      }

      wasFullscreenRef.current = isFullscreenNow;
    };

    const onFullscreenChange = () => {
      syncFullscreenTransition();
    };

    const fullscreenPoll = window.setInterval(syncFullscreenTransition, 500);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    document.addEventListener("mozfullscreenchange", onFullscreenChange as EventListener);
    document.addEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
    window.addEventListener("fullscreenchange", onFullscreenChange as EventListener);
    window.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    window.addEventListener("mozfullscreenchange", onFullscreenChange as EventListener);
    window.addEventListener("MSFullscreenChange", onFullscreenChange as EventListener);

    return () => {
      window.clearInterval(fullscreenPoll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
      document.removeEventListener("mozfullscreenchange", onFullscreenChange as EventListener);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
      window.removeEventListener("fullscreenchange", onFullscreenChange as EventListener);
      window.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
      window.removeEventListener("mozfullscreenchange", onFullscreenChange as EventListener);
      window.removeEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
    };
  }, [enabled, reportViolation]);
}
