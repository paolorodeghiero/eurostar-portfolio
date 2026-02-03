import type { SaveStatus } from '@/hooks/useAutoSave';
import { Loader2, Check, AlertCircle } from 'lucide-react';

interface ProjectFooterProps {
  status: SaveStatus;
  statusText: string;
}

export function ProjectFooter({ status, statusText }: ProjectFooterProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t px-4 py-2 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      {status === 'saving' && <Loader2 className="h-4 w-4 animate-spin" />}
      {status === 'saved' && <Check className="h-4 w-4 text-green-600" />}
      {status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
      <span className={status === 'error' ? 'text-destructive' : ''}>
        {statusText}
      </span>
    </div>
  );
}
