"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, Redo2, Underline, Undo2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RichTextEditorProps } from "@/types/shared/components";

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeightClassName = "min-h-[122px]",
  showList = false,
  showUnderline = false,
}: RichTextEditorProps) {
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
        <button
          type="button"
          className={toolbarButtonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("undo")}
        >
          <Undo2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("redo")}
        >
          <Redo2 className="h-5 w-5" strokeWidth={1.8} />
        </button>
        <Select value={fontFamily} onValueChange={(nextValue) => applyFont(nextValue)}>
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
        <Select value={alignment} onValueChange={(nextValue) => applyAlignment(nextValue)}>
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
        {showList ? (
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("insertUnorderedList")}
          >
            <List className="h-5 w-5" strokeWidth={1.8} />
          </button>
        ) : null}
        <button
          type="button"
          className={toolbarButtonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("bold")}
        >
          <Bold className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand("italic")}
        >
          <Italic className="h-5 w-5" strokeWidth={2} />
        </button>
        {showUnderline ? (
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand("underline")}
          >
            <Underline className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn("question-editor whitespace-pre-wrap px-4 py-3 text-sm text-slate-700 outline-none", minHeightClassName)}
        data-placeholder={placeholder}
        onMouseUp={captureSelection}
        onKeyUp={captureSelection}
        onFocus={captureSelection}
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}