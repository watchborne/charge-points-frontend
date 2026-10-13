export type CsvCell = string | number | boolean | null | undefined;

/**
 * Spreadsheets run a text cell starting with one of these as a formula
 * (CSV injection). Alert and session data carries operator-supplied text
 * (emails, names), so such cells are prefixed with an apostrophe. Numbers are
 * never touched: a negative reading must stay a number.
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

const escapeCell = (cell: CsvCell): string => {
  if (cell === null || cell === undefined) return "";

  const text = typeof cell === "string" && FORMULA_TRIGGER.test(cell) ? `'${cell}` : String(cell);

  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180: comma-separated, CRLF line breaks, quotes doubled inside quoted cells. */
export const toCsv = (rows: CsvCell[][]): string =>
  rows.map((row) => row.map(escapeCell).join(",")).join("\r\n");

// Excel reads a BOM-less CSV as ANSI and mangles accents (`Été`).
const UTF8_BOM = "﻿";

/** Hands `rows` to the browser as a UTF-8 CSV file download. */
export const downloadCsv = (filename: string, rows: CsvCell[][]) => {
  const blob = new Blob([UTF8_BOM, toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/** `2026-10-03T14:05:00.000Z` → `2026-10-03`, for filenames. */
export const csvFilenameDate = (date: Date = new Date()): string => date.toISOString().slice(0, 10);
