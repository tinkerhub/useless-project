// Shared between the editor's swatches and anything else that needs to know what colors a
// creature is allowed to be made of - the submit route validates against the same hex format.
export const PALETTE = [
  "#0e0e0d",
  "#ffffff",
  "#c0326b",
  "#ea34df",
  "#244638",
  "#33322f",
  "#f4c542",
  "#f2793a",
  "#3a7bf2",
  "#6f42c1",
  "#3fae5c",
  "#8a5a3b",
] as const;
