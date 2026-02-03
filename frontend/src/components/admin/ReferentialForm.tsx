import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'color' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface ReferentialFormProps<T extends Record<string, unknown>> {
  title: string;
  fields: FieldConfig[];
  initialValues?: T;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: T) => Promise<void>;
  isEditing?: boolean;
}

export function ReferentialForm<T extends Record<string, unknown>>({
  title,
  fields,
  initialValues,
  isOpen,
  onClose,
  onSubmit,
  isEditing = false,
}: ReferentialFormProps<T>) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setValues({ ...initialValues });
      } else {
        // Set defaults for new items
        const defaults: Record<string, unknown> = {};
        fields.forEach((field) => {
          if (field.type === 'number') {
            defaults[field.name] = 0;
          } else if (field.type === 'color') {
            defaults[field.name] = '#006B6B';
          } else {
            defaults[field.name] = '';
          }
        });
        setValues(defaults);
      }
      setError(null);
    }
  }, [isOpen, initialValues, fields]);

  const handleChange = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(values as T);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = values[field.name];

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              id={field.name}
              value={(value as string) || '#006B6B'}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-10 w-16 rounded border border-input cursor-pointer"
            />
            <Input
              value={(value as string) || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder="#RRGGBB"
              pattern="^#[0-9A-Fa-f]{6}$"
              className="flex-1"
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            id={field.name}
            value={(value as number) ?? ''}
            onChange={(e) =>
              handleChange(
                field.name,
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            placeholder={field.placeholder}
            required={field.required}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            type="text"
            id={field.name}
            value={(value as string) || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${title}` : `Add ${title}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
