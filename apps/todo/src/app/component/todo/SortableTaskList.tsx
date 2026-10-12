import { Fragment, ReactNode, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { mergeClassNames } from '../../lib/classNames';

interface SortableTaskListProps<T extends { id: string }> {
  /** Tasks in their saved order. */
  items: T[];
  /** Without it the list is not draggable. */
  onReorder?: (activeId: string, overId: string) => void;
  renderItem: (item: T) => ReactNode;
}

/**
 * Lets the tasks be reordered by dragging. The mouse starts a drag after
 * moving a few pixels, so a plain click still selects the task. Touch needs a
 * short press and hold, so scrolling the list still works.
 *
 * The new order is shown in the same instant the task is dropped, before the
 * saved order comes back from the server. Otherwise the list would show the
 * old order for a moment and then jump.
 */
function SortableTaskList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: SortableTaskListProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [shownIds, setShownIds] = useState<string[] | null>(null);

  // Saved data arrived (or changed): show it.
  const savedKey = items.map((item) => item.id).join();
  useEffect(() => setShownIds(null), [savedKey]);

  const ordered = shownIds
    ? shownIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is T => Boolean(item))
    : items;

  if (!onReorder) {
    return (
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <>
        {items.map((item) => (
          <Fragment key={item.id}>{renderItem(item)}</Fragment>
        ))}
      </>
    );
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = ordered.map((item) => item.id);
    setShownIds(
      arrayMove(
        ids,
        ids.indexOf(String(active.id)),
        ids.indexOf(String(over.id))
      )
    );
    onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ordered.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {ordered.map((item) => (
          <DraggableTask key={item.id} id={item.id}>
            {renderItem(item)}
          </DraggableTask>
        ))}
      </SortableContext>
    </DndContext>
  );
}

export default SortableTaskList;

function DraggableTask({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  // The task card already has its own role and tab stop.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { role, tabIndex, ...dragAttributes } = attributes;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={mergeClassNames(
        'touch-manipulation select-none [-webkit-touch-callout:none]',
        isDragging && 'relative z-10 opacity-90 shadow-menu'
      )}
      {...dragAttributes}
      {...listeners}
    >
      {children}
    </div>
  );
}
