import type { KeyboardEvent, ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T, index: number) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends { priority: string; status: string }>({
  rows,
  columns,
  sortBy,
  sortDirection,
  onSort,
  onRowClick,
  noDataLabel,
}: {
  rows: T[];
  columns: Column<T>[];
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  noDataLabel?: string;
}) {
  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLTableCellElement>, key: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSort?.(key);
    }
  };

  return (
    <div className="overflow-hidden rounded-[10px] border-[0.5px] border-hairline bg-white">
      <table className="w-full text-xs">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  onClick={() => col.sortable && onSort?.(col.key)}
                  onKeyDown={(e) => col.sortable && handleHeaderKeyDown(e, col.key)}
                  tabIndex={col.sortable ? 0 : -1}
                  aria-sort={isSorted ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}
                  className={`border-b-[0.5px] border-hairline px-2.5 py-2 text-left text-[11px] font-medium text-muted ${
                    col.sortable ? "cursor-pointer hover:text-ink" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {isSorted && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
              );
            })}
            <th className="border-b-[0.5px] border-hairline px-2.5 py-2 text-left text-[11px] font-medium text-muted">
              Priority
            </th>
            <th className="border-b-[0.5px] border-hairline px-2.5 py-2 text-left text-[11px] font-medium text-muted">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(event) => {
                if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  onRowClick(row);
                }
              }}
              className={onRowClick ? "cursor-pointer focus-within:outline-none focus-visible:ring-2 focus-visible:ring-accent-light" : ""}
            >
              {columns.map((col) => (
                <td key={col.key} className="border-b-[0.5px] border-[#EDECE6] px-2.5 py-2.5 text-ink">
                  {col.render(row, index)}
                </td>
              ))}
              <td className="border-b-[0.5px] border-[#EDECE6] px-2.5 py-2.5">
                <StatusBadge value={row.priority} />
              </td>
              <td className="border-b-[0.5px] border-[#EDECE6] px-2.5 py-2.5">
                <StatusBadge value={row.status} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2} className="px-2.5 py-6 text-center text-muted">
                {noDataLabel || "Nothing generated yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
