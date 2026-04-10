"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  List,
  Plus,
  Redo2,
  Square,
  Trash2,
  Undo2,
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

type EditorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

const makeOption = (isCorrect = false): LocalOption => ({
  id: crypto.randomUUID(),
  text: "",
  isCorrect,
});

const extractPlainText = (value: string) => {
  if (typeof window === "undefined") {
    return value.trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

function EditorField({ value, onChange, placeholder }: EditorFieldProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [fontFamily, setFontFamily] = useState("normal");
  const [alignment, setAlignment] = useState("left");

  useEffect(() => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    if (element.innerHTML !== value) {
      element.innerHTML = value;
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    const element = editorRef.current;
    if (!element) {
      return;
    }

    const selection = window.getSelection();
    if (selectionRef.current && selection) {
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }

    element.focus();
    document.execCommand(command, false, commandValue);
    onChange(element.innerHTML);

    const nextSelection = window.getSelection();
    if (nextSelection && nextSelection.rangeCount > 0) {
      selectionRef.current = nextSelection.getRangeAt(0).cloneRange();
    }
  };

  const captureSelection = () => {
    const element = editorRef.current;
    const selection = window.getSelection();

    if (!element || !selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (element.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const toolbarButtonClass =
    "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[14px] font-normal text-slate-700 hover:bg-slate-200";

  const applyFont = (nextFont: string) => {
    setFontFamily(nextFont);

    if (nextFont === "normal") {
      runCommand("fontName", "Inter");
      return;
    }

    if (nextFont === "serif") {
      runCommand("fontName", "Times New Roman");
      return;
    }

    runCommand("fontName", "Courier New");
  };

  const applyAlignment = (nextAlignment: string) => {
    setAlignment(nextAlignment);

    if (nextAlignment === "center") {
      runCommand("justifyCenter");
      return;
    }

    if (nextAlignment === "right") {
      runCommand("justifyRight");
      return;
    }

    if (nextAlignment === "justify") {
      runCommand("justifyFull");
      return;
    }

    runCommand("justifyLeft");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-4 bg-slate-100 px-4 py-3 text-slate-700">
        <button type="button" className={toolbarButtonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")}>
          <Undo2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button type="button" className={toolbarButtonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")}>
          <Redo2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <Select
          value={fontFamily}
          onValueChange={(nextValue) => applyFont(nextValue)}
        >
          <SelectTrigger
            className="h-8 w-[138px] border-0 bg-transparent px-2 text-[14px] font-normal text-slate-700 shadow-none focus:ring-0"
            onMouseDown={captureSelection}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal text</SelectItem>
            <SelectItem value="serif">Serif</SelectItem>
            <SelectItem value="mono">Monospace</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={alignment}
          onValueChange={(nextValue) => applyAlignment(nextValue)}
        >
          <SelectTrigger
            className="h-8 w-[132px] border-0 bg-transparent px-2 text-[14px] font-normal text-slate-700 shadow-none focus:ring-0"
            onMouseDown={captureSelection}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Align left</SelectItem>
            <SelectItem value="center">Align center</SelectItem>
            <SelectItem value="right">Align right</SelectItem>
            <SelectItem value="justify">Justify</SelectItem>
          </SelectContent>
        </Select>
        <button type="button" className={toolbarButtonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}>
          <List className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button type="button" className={toolbarButtonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}>
          <Bold className="h-5 w-5" strokeWidth={2} />
        </button>
        <button type="button" className={toolbarButtonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}>
          <Italic className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="question-editor min-h-[122px] whitespace-pre-wrap px-4 py-3 text-sm text-slate-700 outline-none"
        data-placeholder={placeholder}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onFocus={captureSelection}
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}

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
            <EditorField
              value={title}
              onChange={setTitle}
              placeholder="Write your question"
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

                      <EditorField
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

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                type="button"
                onClick={submit}
                disabled={isSaving}
                className="h-12 w-[180px] rounded-xl border-primary text-base font-semibold text-primary hover:bg-primary/5"
              >
                {isSaving ? "Saving..." : submitLabel}
              </Button>

              {showSaveAndAddMore ? (
                <Button
                  type="button"
                  onClick={submitAndAddMore}
                  disabled={isSaving}
                  className="h-12 w-[180px] rounded-xl text-base font-semibold"
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
