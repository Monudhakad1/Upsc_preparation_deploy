/** "PRELIMS_GS" -> "PRELIMS GS", "HIST_OPT_1" -> "HIST OPT 1": readable paper codes for display. */
export function paperLabel(code: string | null | undefined): string {
  return code ? code.replace(/_/g, " ") : "";
}
