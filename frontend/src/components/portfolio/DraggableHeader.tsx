import { ReactNode, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableHeaderContextProps {
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
  children: ReactNode;
}

// Context wrapper that provides DnD functionality
export function DraggableHeaderContext({
  columnOrder,
  onColumnOrderChange,
  children,
}: DraggableHeaderContextProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
          onColumnOrderChange(newOrder);
        }
      }
    },
    [columnOrder, onColumnOrderChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={columnOrder}
        strategy={horizontalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface DraggableHeaderProps {
  id: string;
  children: ReactNode;
  canDrag?: boolean;
  className?: string;
}

// Individual draggable header cell
export function DraggableHeader({
  id,
  children,
  canDrag = true,
  className,
}: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1',
        isDragging && 'opacity-50 bg-muted',
        className
      )}
    >
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground touch-none"
          aria-label="Drag to reorder column"
        >
          <GripVertical className="h-3 w-3" />
        </button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}
