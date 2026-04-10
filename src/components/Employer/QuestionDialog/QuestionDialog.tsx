"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DraftQuestionType } from "@/stores/examDraftStore";

type QuestionInput = {
  title: string;
  type: DraftQuestionType;
  points: number;
  options: Array<{ text: string; isCorrect: boolean }>;
};

type QuestionDialogProps = {
  onSave: (question: QuestionInput) => Promise<void>;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  triggerSize?: "default" | "sm";
  triggerClassName?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  submitLabel?: string;
  showSaveAndAddMore?: boolean;
  initialQuestion?: QuestionInput;
};

type LocalOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

const makeOption = (isCorrect = false): LocalOption => ({
  id: crypto.randomUUID(),
  text: "",
  isCorrect,
});

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
    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("Question title is required.");
      return null;
    }

    if (isObjective) {
      const normalizedOptions = options.map((option) => option.text.trim());
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
      title: normalizedTitle,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="question-title">Question Title</Label>
            <Textarea
              id="question-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Write your question"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Question Type</Label>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RADIO">RADIO</SelectItem>
                  <SelectItem value="CHECKBOX">CHECKBOX</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min={0.25}
                step={0.25}
                value={points}
                onChange={(event) => setPoints(Number(event.target.value || 1))}
              />
            </div>
          </div>

          {isObjective ? (
            <div className="grid gap-3 rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button size="sm" variant="outline" onClick={addOption} type="button">
                  Add Option
                </Button>
              </div>

              {options.map((option) => (
                <div key={option.id} className="grid items-center gap-2 md:grid-cols-[1fr_auto_auto]">
                  <Input
                    value={option.text}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((currentOption) =>
                          currentOption.id === option.id
                            ? { ...currentOption, text: event.target.value }
                            : currentOption,
                        ),
                      )
                    }
                    placeholder="Option text"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(event) => setCorrect(option.id, event.target.checked)}
                    />
                    Correct
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(option.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={isSaving}>
            {isSaving ? "Saving..." : submitLabel}
          </Button>
          {showSaveAndAddMore ? (
            <Button type="button" onClick={submitAndAddMore} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save and Add More"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
