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

import { AvailabilityToggle } from "@/components/dashboard/availability-toggle";
import { FeaturedToggle } from "@/components/dashboard/featured-toggle";
import { ProductDialog } from "@/components/dashboard/product-dialog";
import { SortableRow } from "@/components/dashboard/sortable-row";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, reorderProducts } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils/format";
import type { Category, Product } from "@/types/database";

export type ProductGroup = {
  category: Category;
  restaurantName: string;
  currency: string;
  products: Product[];
};

/**
 * Products grouped by category, each group independently sortable.
 *
 * Grouping isn't cosmetic: `position` orders products *within* a category, so a
 * single flat cross-category table would let you drag a row somewhere its new
 * position means nothing. Each group is its own DndContext, which also stops a
 * row being dragged into a category it doesn't belong to.
 */
export function SortableProductList({
  groups,
  categories,
}: {
  groups: ProductGroup[];
  categories: Category[];
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <ProductGroupTable key={group.category.id} group={group} categories={categories} />
      ))}
    </div>
  );
}

function ProductGroupTable({ group, categories }: { group: ProductGroup; categories: Category[] }) {
  const [items, setItems] = useState(group.products);
  const [pending, startTransition] = useTransition();

  // Render-phase re-sync; see SortableCategoryList for why not an effect.
  const incoming = JSON.stringify(group.products);
  const [seen, setSeen] = useState(incoming);
  if (incoming !== seen) {
    setSeen(incoming);
    setItems(group.products);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = items.findIndex((p) => p.id === active.id);
    const to = items.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;

    const next = arrayMove(items, from, to);
    const previous = items;
    setItems(next);

    startTransition(async () => {
      const result = await reorderProducts(next.map((p) => p.id));
      if (result.status === "error") {
        setItems(previous);
        toast.error(result.message ?? "Sıralama kaydedilemedi.");
      }
    });
  }

  return (
    <div aria-busy={pending}>
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="font-medium">{group.category.name}</h2>
        <span className="text-muted-foreground text-sm">
          {group.restaurantName} · {items.length} ürün
        </span>
      </div>

      <div className="rounded-lg border">
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
                <TableHead>Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {items.map((product) => (
                  <SortableRow key={product.id} id={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.name}</p>
                      {product.description ? (
                        <p className="text-muted-foreground line-clamp-1 text-sm">{product.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatPrice(product.price, group.currency)}
                    </TableCell>
                    <TableCell>
                      <AvailabilityToggle
                        productId={product.id}
                        productName={product.name}
                        isAvailable={product.is_available}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <FeaturedToggle
                          productId={product.id}
                          productName={product.name}
                          isFeatured={product.is_featured}
                        />
                        <ProductDialog categories={categories} product={product} />
                        <DeleteDialog
                          onConfirm={deleteProduct.bind(null, product.id)}
                          iconOnly
                          triggerLabel={`${product.name} ürününü sil`}
                          title={`${product.name} silinsin mi?`}
                          description="Bu işlem geri alınamaz."
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
    </div>
  );
}
