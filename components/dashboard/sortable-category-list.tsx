"use client";

import { useState, useTransition } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toast } from "sonner";

import { CategoryDialog } from "@/components/dashboard/category-dialog";
import { SortableRow } from "@/components/dashboard/sortable-row";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCategory, reorderCategories } from "@/lib/actions/categories";
import type { Category, Restaurant } from "@/types/database";

/**
 * Drag-to-reorder category table.
 *
 * A PointerSensor with a small distance threshold covers mouse and touch in one
 * go, so this works on the phone an owner actually has behind the counter. The
 * activation distance is what stops a tap on the edit button from registering
 * as a tiny drag.
 */
export function SortableCategoryList({
  categories,
  restaurants,
}: {
  categories: Category[];
  restaurants: Restaurant[];
}) {
  const [items, setItems] = useState(categories);
  const [pending, startTransition] = useTransition();

  // Re-sync when the server sends different data (add, delete, rename). Doing
  // this during render rather than in an effect is the documented pattern and
  // keeps us clear of react-hooks/set-state-in-effect.
  const incoming = JSON.stringify(categories);
  const [seen, setSeen] = useState(incoming);
  if (incoming !== seen) {
    setSeen(incoming);
    setItems(categories);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const restaurantNames = new Map(restaurants.map((r) => [r.id, r.name]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((c) => c.id === active.id);
    const to = items.findIndex((c) => c.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(items, from, to);
    const previous = items;

    // Move the row immediately; a list that waits for the round trip feels
    // broken while dragging.
    setItems(next);

    startTransition(async () => {
      const result = await reorderCategories(next.map((c) => c.id));
      if (result.status === "error") {
        setItems(previous);
        toast.error(result.message ?? "Sıralama kaydedilemedi.");
      }
    });
  }

  return (
    <div className="rounded-lg border" aria-busy={pending}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>İsim</TableHead>
              <TableHead className="hidden md:table-cell">Restoran</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-24 text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {items.map((category) => (
                <SortableRow key={category.id} id={category.id}>
                  <TableCell>
                    <p className="font-medium">{category.name}</p>
                    {category.description ? (
                      <p className="text-muted-foreground line-clamp-1 text-sm">{category.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {restaurantNames.get(category.restaurant_id) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Görünür" : "Gizli"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <CategoryDialog restaurants={restaurants} category={category} />
                      <DeleteDialog
                        onConfirm={deleteCategory.bind(null, category.id)}
                        iconOnly
                        triggerLabel={`${category.name} kategorisini sil`}
                        title={`${category.name} silinsin mi?`}
                        description="Bu kategorideki tüm ürünler de silinir. Bu işlem geri alınamaz."
                      />
                    </div>
                  </TableCell>
                </SortableRow>
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
