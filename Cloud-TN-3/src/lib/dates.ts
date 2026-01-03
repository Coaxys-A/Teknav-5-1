export function formatFa(date: string | number | Date) {
  try {
    const formatter = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return formatter.format(new Date(date));
  } catch (error) {
    console.error("Invalid date for formatFa", error);
    return "";
  }
}
