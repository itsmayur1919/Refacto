import type { ReactNode } from "react";
import { FileText, Image as ImageIcon, FileSpreadsheet, File } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { UploadedFile } from "@/lib/types";

const ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  png: ImageIcon,
  jpeg: ImageIcon,
  jpg: ImageIcon,
  svg: ImageIcon,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
};

export function FileListItem({ file, actions }: { file: UploadedFile; actions?: ReactNode }) {
  const Icon = ICONS[file.file_type] || File;

  return (
    <div className="rounded-[10px] border-[0.5px] border-hairline bg-white p-3">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className="text-muted" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-ink">{file.file_name}</div>
          <div className="text-[10px] text-muted">
            {file.ocr_used ? "OCR · " : ""}
            {new Date(file.uploaded_at).toLocaleString()}
          </div>
        </div>
        <StatusBadge value={file.extraction_status} />
      </div>

      {typeof file.progress === "number" && file.progress < 100 && (
        <div className="mt-3 rounded-full bg-[#EDECE6] p-[2px]">
          <div
            className="h-1.5 rounded-full bg-accent"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {file.extraction_status === "failed" && file.extraction_error && (
        <details className="mt-3 rounded-lg bg-danger-light/20 p-3 text-[11px] text-danger">
          <summary className="cursor-pointer font-medium">Extraction failed — view details</summary>
          <p className="mt-2 whitespace-pre-wrap">{file.extraction_error}</p>
        </details>
      )}

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
