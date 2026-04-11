import type { PendingAnswer } from "@/types/hooks";

export const readQueue = (queueKey: string): PendingAnswer[] => {
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

export const writeQueue = (queueKey: string, data: PendingAnswer[]) => {
  window.localStorage.setItem(queueKey, JSON.stringify(data));
};
