export const sanitizeRichTextHtml = (value: string) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+=("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
};
