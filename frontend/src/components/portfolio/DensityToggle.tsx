import { AlignJustify, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type Density = 'comfortable' | 'compact';

interface DensityToggleProps {
  density: Density;
  onDensityChange: (density: Density) => void;
}

export function DensityToggle({ density, onDensityChange }: DensityToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center border rounded-md">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded-r-none border-r',
                density === 'comfortable' && 'bg-muted'
              )}
              onClick={() => onDensityChange('comfortable')}
              aria-label="Comfortable density"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Comfortable (~15 rows)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 w-8 p-0 rounded-l-none',
                density === 'compact' && 'bg-muted'
              )}
              onClick={() => onDensityChange('compact')}
              aria-label="Compact density"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Compact (~25 rows)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
