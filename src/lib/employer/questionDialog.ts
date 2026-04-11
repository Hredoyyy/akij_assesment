import type { LocalOption } from "@/types/employer/questionDialog";

export const makeOption = (isCorrect = false): LocalOption => ({
  id: crypto.randomUUID(),
  text: "",
  isCorrect,
});

export const extractPlainText = (value: string) => {
  if (typeof window === "undefined") {
    return value.trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};
