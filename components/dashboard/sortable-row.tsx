"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * A table row that can be dragged by its handle.
 *
 * Only the handle starts a drag, not the whole row — the row also holds edit
 * and delete buttons, and a whole-row drag target would swallow those taps on
 * a phone.
 */
export function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "bg-muted relative z-10 shadow-lg")}
    >
      <TableCell className="w-10 pr-0">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground cursor-grab touch-none p-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Sıralamak için sürükleyin"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}
