export type UseBehaviorTrackingOptions = {
  enabled: boolean;
  onViolation: () => Promise<void> | void;
};

export type UseExamTimerOptions = {
  initialSeconds: number;
  onExpire: () => Promise<void> | void;
};

export type PendingAnswer = {
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
};

export type UseOfflineSyncOptions = {
  queueKey: string;
  onFlushItem: (item: PendingAnswer) => Promise<void>;
};
