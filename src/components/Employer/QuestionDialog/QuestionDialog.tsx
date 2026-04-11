"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Square,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/Shared/RichTextEditor/RichTextEditor";
import { extractPlainText, makeOption } from "@/lib/employer/questionDialog";
import type { LocalOption, QuestionDialogProps, QuestionInput } from "@/types/employer/questionDialog";
import type { DraftQuestionType } from "@/stores/examDraftStore";

export function QuestionDialog({
  onSave,
  triggerLabel = "Add Question",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName,
  dialogTitle = "Create Question",
  dialogDescription = "Configure question type, marks, and options before adding it to this slot.",
  submitLabel = "Save",
  showSaveAndAddMore = true,
  initialQuestion,
}: QuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DraftQuestionType>("RADIO");
  const [points, setPoints] = useState(1);
  const [options, setOptions] = useState<LocalOption[]>([makeOption(true), makeOption(false)]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isObjective = useMemo(() => type !== "TEXT", [type]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialQuestion) {
      return;
    }

    setTitle(initialQuestion.title);
    setType(initialQuestion.type);
    setPoints(initialQuestion.points);
    setOptions(
      initialQuestion.type === "TEXT"
        ? []
        : initialQuestion.options.map((option) => ({
            id: crypto.randomUUID(),
            text: option.text,
            isCorrect: option.isCorrect,
          })),
    );
    setError(null);
  }, [initialQuestion, open]);

  const resetState = () => {
    setTitle("");
    setType("RADIO");
    setPoints(1);
    setOptions([makeOption(true), makeOption(false)]);
    setError(null);
  };

  const addOption = () => setOptions((current) => [...current, makeOption(false)]);

  const removeOption = (id: string) =>
    setOptions((current) => (current.length <= 2 ? current : current.filter((opt) => opt.id !== id)));

  const setCorrect = (id: string, checked: boolean) => {
    setOptions((current) =>
      current.map((opt) => {
        if (type === "RADIO") {
          return {
            ...opt,
            isCorrect: opt.id === id ? checked : false,
          };
        }

        return opt.id === id ? { ...opt, isCorrect: checked } : opt;
      }),
    );
  };

  const validate = (): QuestionInput | null => {
    const normalizedTitle = extractPlainText(title);

    if (!normalizedTitle) {
      setError("Question title is required.");
      return null;
    }

    if (isObjective) {
      if (options.length < 2) {
        setError("Please keep at least two options.");
        return null;
      }

      const normalizedOptions = options.map((option) => extractPlainText(option.text));
      if (normalizedOptions.some((value) => !value)) {
        setError("All options must have text.");
        return null;
      }

      const correctCount = options.filter((option) => option.isCorrect).length;
      if (type === "RADIO" && correctCount !== 1) {
        setError("Radio question must have exactly one correct option.");
        return null;
      }

      if (type === "CHECKBOX" && correctCount < 1) {
        setError("Checkbox question needs at least one correct option.");
        return null;
      }
    }

    setError(null);

    return {
      title: title.trim(),
      type,
      points,
      options: isObjective
        ? options.map((option) => ({ text: option.text.trim(), isCorrect: option.isCorrect }))
        : [],
    };
  };

  const submit = async () => {
    const question = validate();
    if (!question) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(question);
    } finally {
      setIsSaving(false);
    }

    setOpen(false);
    resetState();
  };

  const submitAndAddMore = async () => {
    const question = validate();
    if (!question) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(question);
    } finally {
      setIsSaving(false);
    }

    resetState();
  };

  const closeAndReset = () => {
    setOpen(false);
    resetState();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[954px] max-w-[95vw] gap-0 rounded-2xl border-0 p-6 shadow-none [&>button]:hidden">
        <h2 className="sr-only">{dialogTitle}</h2>
        <p className="sr-only">{dialogDescription}</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-sm text-slate-700">
                1
              </span>
              <p className="text-[16px] font-semibold leading-[150%] text-slate-700">Question 1</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Score:</span>
                <Input
                  id="points"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={points}
                  onChange={(event) => {
                    const nextPoints = Number(event.target.value);
                    setPoints(Number.isFinite(nextPoints) && nextPoints > 0 ? nextPoints : 1);
                  }}
                  className="h-8 w-12 rounded-lg border-slate-200 px-2 text-center"
                />
              </div>

              <Select
                value={type}
                onValueChange={(value: DraftQuestionType) => {
                  setType(value);
                  if (value === "TEXT") {
                    setOptions([]);
                  }
                  if ((value === "RADIO" || value === "CHECKBOX") && options.length < 2) {
                    setOptions([makeOption(true), makeOption(false)]);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[127px] rounded-lg border-slate-200 text-sm font-semibold text-slate-700">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="RADIO">Radio</SelectItem>
                  <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={closeAndReset}
                className="text-slate-600 transition hover:text-rose-500"
                aria-label="Remove question"
              >
                <Trash2 className="h-6 w-6" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(90vh-240px)] space-y-3 overflow-y-auto pr-1">
            <RichTextEditor
              value={title}
              onChange={setTitle}
              placeholder="Write your question"
              showList
            />

            {isObjective
              ? options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index);

                  return (
                    <div key={option.id} className="space-y-3 px-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-sm text-slate-700">
                            {optionLabel}
                          </span>
                          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type={type === "RADIO" ? "radio" : "checkbox"}
                              checked={option.isCorrect}
                              onChange={(event) => setCorrect(option.id, event.target.checked)}
                              className="sr-only"
                            />
                            {type === "RADIO" ? (
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                                  option.isCorrect ? "border-primary" : "border-slate-400"
                                }`}
                              >
                                {option.isCorrect ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                              </span>
                            ) : (
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                                  option.isCorrect ? "border-primary bg-primary/10" : "border-slate-400"
                                }`}
                              >
                                {option.isCorrect ? <Square className="h-3 w-3 fill-primary text-primary" /> : null}
                              </span>
                            )}
                            Set as correct answer
                          </label>
                        </div>

                        <button
                          type="button"
                          className="text-slate-600 transition hover:text-rose-500"
                          onClick={() => removeOption(option.id)}
                          aria-label={`Delete option ${optionLabel}`}
                        >
                          <Trash2 className="h-6 w-6" strokeWidth={1.8} />
                        </button>
                      </div>

                      <RichTextEditor
                        value={option.text}
                        onChange={(nextValue) =>
                          setOptions((current) =>
                            current.map((currentOption) =>
                              currentOption.id === option.id
                                ? { ...currentOption, text: nextValue }
                                : currentOption,
                            ),
                          )
                        }
                        placeholder={`Write option ${optionLabel}`}
                        showList
                      />
                    </div>
                  );
                })
              : null}

            {isObjective ? (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-2 pl-6 text-sm font-medium text-slate-700 transition hover:text-primary"
              >
                <Plus className="h-4 w-4 text-primary" strokeWidth={2.2} />
                Another options
              </button>
            ) : null}

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          <div className="space-y-4 pt-1">
            <div className="h-px w-full bg-slate-200" />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={submit}
                disabled={isSaving}
                className="h-12 w-full rounded-xl border-primary text-base font-semibold text-primary hover:bg-primary/5 sm:w-[180px]"
              >
                {isSaving ? "Saving..." : submitLabel}
              </Button>

              {showSaveAndAddMore ? (
                <Button
                  type="button"
                  onClick={submitAndAddMore}
                  disabled={isSaving}
                  className="h-12 w-full rounded-xl text-base font-semibold sm:w-[180px]"
                >
                  {isSaving ? "Saving..." : "Save & Add More"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
