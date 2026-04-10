import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type DraftQuestionType = "CHECKBOX" | "RADIO" | "TEXT";

export type DraftOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type DraftQuestion = {
  id: string;
  title: string;
  type: DraftQuestionType;
  points: number;
  options: DraftOption[];
};

export type DraftSlot = {
  slotNumber: number;
  startTime: string;
  endTime: string;
  questions: DraftQuestion[];
};

type BasicInfo = {
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
};

type ExamDraftState = {
  examId: string | null;
  step: 1 | 2;
  basicInfo: BasicInfo;
  slots: DraftSlot[];
  activeSlotNumber: number;
  hydrateDraft: (value: {
    examId: string;
    basicInfo: BasicInfo;
    slots: DraftSlot[];
  }) => void;
  setExamId: (examId: string) => void;
  setStep: (step: 1 | 2) => void;
  setBasicInfo: (value: Partial<BasicInfo>) => void;
  setSlotTiming: (slotNumber: number, value: Pick<DraftSlot, "startTime" | "endTime">) => void;
  setActiveSlotNumber: (slotNumber: number) => void;
  addQuestion: (
    slotNumber: number,
    question: Omit<DraftQuestion, "id" | "options"> & {
      options: Array<Omit<DraftOption, "id">>;
    },
  ) => void;
  updateQuestion: (
    slotNumber: number,
    questionId: string,
    question: Omit<DraftQuestion, "id" | "options"> & {
      options: Array<Omit<DraftOption, "id">>;
    },
  ) => void;
  removeQuestion: (slotNumber: number, questionId: string) => void;
  resetDraft: () => void;
};

const INITIAL_BASIC_INFO: BasicInfo = {
  title: "",
  totalCandidates: 1,
  totalSlots: 1,
  duration: 30,
};

const randomId = () => crypto.randomUUID();

const buildSlots = (totalSlots: number, previousSlots: DraftSlot[] = []): DraftSlot[] => {
  const cappedTotalSlots = Math.max(1, Math.min(3, totalSlots));

  return Array.from({ length: cappedTotalSlots }, (_, index) => {
    const slotNumber = index + 1;
    const existing = previousSlots.find((slot) => slot.slotNumber === slotNumber);

    return (
      existing ?? {
        slotNumber,
        startTime: "",
        endTime: "",
        questions: [],
      }
    );
  });
};

const normalizeQuestionType = (value: unknown): DraftQuestionType => {
  if (value === "CHECKBOX" || value === "TEXT") {
    return value;
  }

  return "RADIO";
};

const normalizePersistedState = (
  persistedState: Partial<ExamDraftState> | undefined,
): Pick<ExamDraftState, "examId" | "step" | "basicInfo" | "slots" | "activeSlotNumber"> => {
  const persistedBasicInfo = persistedState?.basicInfo;

  const normalizedTotalSlots = Math.max(
    1,
    Math.min(3, Number(persistedBasicInfo?.totalSlots ?? INITIAL_BASIC_INFO.totalSlots)),
  );

  const normalizedBasicInfo: BasicInfo = {
    title: String(persistedBasicInfo?.title ?? INITIAL_BASIC_INFO.title),
    totalCandidates: Math.max(
      1,
      Number(persistedBasicInfo?.totalCandidates ?? INITIAL_BASIC_INFO.totalCandidates),
    ),
    totalSlots: normalizedTotalSlots,
    duration: Math.max(1, Number(persistedBasicInfo?.duration ?? INITIAL_BASIC_INFO.duration)),
  };

  const rawSlots = Array.isArray(persistedState?.slots) ? persistedState.slots : [];

  const candidateSlots: DraftSlot[] = rawSlots.map((slot, index) => {
    const slotNumber = Number((slot as DraftSlot).slotNumber ?? index + 1);
    const questions = Array.isArray((slot as DraftSlot).questions)
      ? (slot as DraftSlot).questions.map((question) => ({
          id: String(question.id ?? crypto.randomUUID()),
          title: String(question.title ?? ""),
          type: normalizeQuestionType(question.type),
          points: Math.max(0.25, Number(question.points ?? 1)),
          options: Array.isArray(question.options)
            ? question.options.map((option) => ({
                id: String(option.id ?? crypto.randomUUID()),
                text: String(option.text ?? ""),
                isCorrect: Boolean(option.isCorrect),
              }))
            : [],
        }))
      : [];

    return {
      slotNumber,
      startTime: String((slot as DraftSlot).startTime ?? ""),
      endTime: String((slot as DraftSlot).endTime ?? ""),
      questions,
    };
  });

  const normalizedSlots = buildSlots(normalizedBasicInfo.totalSlots, candidateSlots);

  const activeSlotCandidate = Number(
    persistedState?.activeSlotNumber ?? normalizedSlots[0]?.slotNumber ?? 1,
  );

  return {
    examId: typeof persistedState?.examId === "string" ? persistedState.examId : null,
    step: persistedState?.step === 2 ? 2 : 1,
    basicInfo: normalizedBasicInfo,
    slots: normalizedSlots,
    activeSlotNumber: Math.min(normalizedBasicInfo.totalSlots, Math.max(1, activeSlotCandidate)),
  };
};

export const useExamDraftStore = create<ExamDraftState>()(
  persist(
    (set) => ({
      examId: null,
      step: 1,
      basicInfo: INITIAL_BASIC_INFO,
      slots: buildSlots(INITIAL_BASIC_INFO.totalSlots),
      activeSlotNumber: 1,
      hydrateDraft: ({ examId, basicInfo, slots }) =>
        set({
          examId,
          step: 2,
          basicInfo: {
            title: basicInfo.title,
            totalCandidates: Math.max(1, basicInfo.totalCandidates),
            totalSlots: Math.max(1, Math.min(3, basicInfo.totalSlots)),
            duration: Math.max(1, basicInfo.duration),
          },
          slots: buildSlots(basicInfo.totalSlots, slots),
          activeSlotNumber: 1,
        }),
      setExamId: (examId) => set({ examId }),
      setStep: (step) => set({ step }),
      setBasicInfo: (value) =>
        set((state) => ({
          basicInfo: {
            ...state.basicInfo,
            ...value,
          },
          slots:
            value.totalSlots !== undefined
              ? buildSlots(value.totalSlots, state.slots)
              : state.slots,
          activeSlotNumber:
            value.totalSlots !== undefined
              ? Math.min(
                  state.activeSlotNumber,
                  Math.max(1, Math.min(3, value.totalSlots)),
                )
              : state.activeSlotNumber,
        })),
      setSlotTiming: (slotNumber, value) =>
        set((state) => ({
          slots: state.slots.map((slot) =>
            slot.slotNumber === slotNumber
              ? {
                  ...slot,
                  ...value,
                }
              : slot,
          ),
        })),
      setActiveSlotNumber: (slotNumber) =>
        set({
          activeSlotNumber: slotNumber,
        }),
      addQuestion: (slotNumber, question) =>
        set((state) => ({
          slots: state.slots.map((slot) =>
            slot.slotNumber === slotNumber
              ? {
                  ...slot,
                  questions: [
                    ...slot.questions,
                    {
                      ...question,
                      id: randomId(),
                      options: question.options.map((option) => ({
                        ...option,
                        id: randomId(),
                      })),
                    },
                  ],
                }
              : slot,
          ),
        })),
      updateQuestion: (slotNumber, questionId, question) =>
        set((state) => ({
          slots: state.slots.map((slot) => {
            if (slot.slotNumber !== slotNumber) {
              return slot;
            }

            return {
              ...slot,
              questions: slot.questions.map((currentQuestion) => {
                if (currentQuestion.id !== questionId) {
                  return currentQuestion;
                }

                return {
                  ...currentQuestion,
                  title: question.title,
                  type: question.type,
                  points: question.points,
                  options: question.options.map((option) => ({
                    ...option,
                    id: randomId(),
                  })),
                };
              }),
            };
          }),
        })),
      removeQuestion: (slotNumber, questionId) =>
        set((state) => ({
          slots: state.slots.map((slot) => {
            if (slot.slotNumber !== slotNumber) {
              return slot;
            }

            return {
              ...slot,
              questions: slot.questions.filter((question) => question.id !== questionId),
            };
          }),
        })),
      resetDraft: () =>
        set({
          examId: null,
          step: 1,
          basicInfo: INITIAL_BASIC_INFO,
          slots: buildSlots(INITIAL_BASIC_INFO.totalSlots),
          activeSlotNumber: 1,
        }),
    }),
    {
      name: "exam-draft-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        return normalizePersistedState(persistedState as Partial<ExamDraftState>);
      },
      partialize: (state) => ({
        examId: state.examId,
        step: state.step,
        basicInfo: state.basicInfo,
        slots: state.slots,
        activeSlotNumber: state.activeSlotNumber,
      }),
    },
  ),
);
