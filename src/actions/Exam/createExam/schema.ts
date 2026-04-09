import { z } from "zod";

const optionSchema = z.object({
  text: z.string().trim().min(1, "Option text is required."),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    title: z.string().trim().min(1, "Question title is required."),
    type: z.enum(["CHECKBOX", "RADIO", "TEXT"]),
    points: z.number().positive("Points must be greater than zero."),
    order: z.number().int().nonnegative(),
    options: z.array(optionSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "TEXT") {
      return;
    }

    if (value.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        message: "At least two options are required for objective questions.",
        path: ["options"],
      });
      return;
    }

    const correctCount = value.options.filter((option) => option.isCorrect).length;

    if (value.type === "RADIO" && correctCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Radio questions must have exactly one correct option.",
        path: ["options"],
      });
    }

    if (value.type === "CHECKBOX" && correctCount < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Checkbox questions must have at least one correct option.",
        path: ["options"],
      });
    }
  });

const slotSchema = z
  .object({
    slotNumber: z.number().int().min(1),
    name: z.string().trim().min(1, "Slot name is required."),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    questions: z.array(questionSchema).min(1, "At least one question is required."),
  })
  .refine((value) => new Date(value.endTime) > new Date(value.startTime), {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export const createExamSchema = z.object({
  title: z.string().trim().min(1, "Exam title is required."),
  totalCandidates: z.number().int().positive(),
  duration: z.number().int().positive(),
  negativeMarking: z.boolean(),
  slots: z
    .array(slotSchema)
    .min(1, "At least one slot is required.")
    .max(3, "Maximum three slots are allowed."),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;
