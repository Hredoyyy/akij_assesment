"use client";

import { useCallback, useEffect } from "react";
import { readQueue, writeQueue } from "@/lib/candidate/offlineSync";
import type { PendingAnswer, UseOfflineSyncOptions } from "@/types/hooks";

export function useOfflineSync({ queueKey, onFlushItem }: UseOfflineSyncOptions) {
  const enqueue = useCallback(
    (item: PendingAnswer) => {
      const queue = readQueue(queueKey);
      queue.push(item);
      writeQueue(queueKey, queue);
    },
    [queueKey],
  );

  const flush = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }

    const queue = readQueue(queueKey);

    if (queue.length === 0) {
      return;
    }

    const remaining: PendingAnswer[] = [];

    for (const item of queue) {
      try {
        await onFlushItem(item);
      } catch {
        remaining.push(item);
      }
    }

    writeQueue(queueKey, remaining);
  }, [onFlushItem, queueKey]);

  useEffect(() => {
    const onOnline = () => {
      void flush();
    };

    window.addEventListener("online", onOnline);
    void flush();

    return () => {
      window.removeEventListener("online", onOnline);
    };
  }, [flush]);

  return {
    enqueue,
    flush,
  };
}
