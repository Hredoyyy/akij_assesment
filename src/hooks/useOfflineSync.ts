"use client";

import { useCallback, useEffect } from "react";

type PendingAnswer = {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
};

type UseOfflineSyncOptions = {
  queueKey: string;
  onFlushItem: (item: PendingAnswer) => Promise<void>;
};

const readQueue = (queueKey: string): PendingAnswer[] => {
  try {
    const raw = window.localStorage.getItem(queueKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PendingAnswer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (queueKey: string, data: PendingAnswer[]) => {
  window.localStorage.setItem(queueKey, JSON.stringify(data));
};

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
