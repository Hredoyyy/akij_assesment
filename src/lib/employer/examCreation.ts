export const toSlotDatetime = (value: string) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
};
