import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

import type { Schedule } from "@/lib/workshift";
import {
  createScheduleWorkbook,
  defaultExportFilename,
} from "@/lib/workshift/export-xlsx";

function ensureXlsxExtension(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.toLowerCase().endsWith(".xlsx")) {
    return `${trimmed}.xlsx`;
  }
  return trimmed;
}

export async function exportScheduleWorkbook(
  schedule: Schedule,
  selectedMonth: Date,
): Promise<string | null> {
  const path = await save({
    title: "Export .xlsx",
    defaultPath: defaultExportFilename(selectedMonth),
    filters: [
      {
        name: "Excel Workbook",
        extensions: ["xlsx"],
      },
    ],
  });

  if (!path) {
    return null;
  }

  const finalPath = ensureXlsxExtension(path);
  const workbookData = createScheduleWorkbook(schedule, selectedMonth);
  await writeFile(finalPath, workbookData);
  return finalPath;
}
