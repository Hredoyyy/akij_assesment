"use client";

import { useCallback, useEffect } from "react";

type UseBehaviorTrackingOptions = {
  enabled: boolean;
  onViolation: () => Promise<void> | void;
};

export function useBehaviorTracking({ enabled, onViolation }: UseBehaviorTrackingOptions) {
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
      if (!document.fullscreenElement) {
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
