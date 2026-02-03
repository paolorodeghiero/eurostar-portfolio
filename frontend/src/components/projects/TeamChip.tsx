import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

interface TeamChipProps {
  teamName: string;
  size: string;
  isLead?: boolean;
  onSizeChange: (size: string) => void;
  onRemove?: () => void;
}

export function TeamChip({
  teamName,
  size,
  isLead = false,
  onSizeChange,
  onRemove,
}: TeamChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm',
        isLead
          ? 'bg-eurostar-teal/10 border-eurostar-teal text-eurostar-teal'
          : 'bg-background border-border'
      )}
    >
      <span className="font-medium">{teamName}</span>
      {isLead && (
        <Badge variant="outline" className="h-5 text-xs border-eurostar-teal text-eurostar-teal">
          Lead
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 ml-1"
          >
            {size}
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {TSHIRT_SIZES.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onSizeChange(s);
              }}
              className={s === size ? 'bg-muted' : ''}
            >
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isLead && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${teamName}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
