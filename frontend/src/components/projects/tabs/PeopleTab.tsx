/**
 * @deprecated This tab has been merged into GeneralTab as of Phase 7.
 * People fields (PM, IS Owner, Sponsor) are now in GeneralTab's "People" section.
 * This file is kept for reference during transition and will be removed when
 * ProjectTabs is updated to remove the People tab.
 */

import { useEffect, useState, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Project } from '@/lib/project-api';

interface PeopleTabProps {
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  disabled?: boolean;
}

// Simple autocomplete using native HTML datalist (Excel-like behavior)
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
  const listId = useId();

  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </>
  );
}

export function PeopleTab({ formData, onChange, disabled }: PeopleTabProps) {
  const [pmSuggestions, setPmSuggestions] = useState<string[]>([]);
  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [sponsorSuggestions, setSponsorSuggestions] = useState<string[]>([]);

  // Load suggestions from existing projects
  useEffect(() => {
    fetch('/api/projects/people-suggestions')
      .then(r => r.json())
      .then(data => {
        setPmSuggestions(data.projectManagers || []);
        setOwnerSuggestions(data.isOwners || []);
        setSponsorSuggestions(data.sponsors || []);
      })
      .catch(() => {
        // Silently fail - suggestions are optional
      });
  }, []);

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
