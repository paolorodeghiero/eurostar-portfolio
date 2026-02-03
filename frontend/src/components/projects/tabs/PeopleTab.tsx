import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown } from 'lucide-react';
import type { Project } from '@/lib/project-api';

interface PeopleTabProps {
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  disabled?: boolean;
}

// Autocomplete component for people fields
function PersonAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => !disabled && setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No suggestions</CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 10).map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  onSelect={() => {
                    onChange(suggestion);
                    setInputValue(suggestion);
                    setOpen(false);
                  }}
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function PeopleTab({ formData, onChange, disabled }: PeopleTabProps) {
  // In production, these would come from API (distinct values from existing projects)
  // For now, use empty arrays - autocomplete will build up over time
  const [pmSuggestions] = useState<string[]>([]);
  const [ownerSuggestions] = useState<string[]>([]);
  const [sponsorSuggestions] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Project Manager</Label>
        <PersonAutocomplete
          value={formData.projectManager || ''}
          onChange={(v) => onChange({ ...formData, projectManager: v })}
          suggestions={pmSuggestions}
          placeholder="Enter project manager name"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>IS Owner</Label>
        <PersonAutocomplete
          value={formData.isOwner || ''}
          onChange={(v) => onChange({ ...formData, isOwner: v })}
          suggestions={ownerSuggestions}
          placeholder="Enter IS owner name"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Sponsor</Label>
        <PersonAutocomplete
          value={formData.sponsor || ''}
          onChange={(v) => onChange({ ...formData, sponsor: v })}
          suggestions={sponsorSuggestions}
          placeholder="Enter sponsor name"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
