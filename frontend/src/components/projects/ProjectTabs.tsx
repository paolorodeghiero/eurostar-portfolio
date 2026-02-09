import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GeneralTab } from './tabs/GeneralTab';
import { TeamsTab } from './tabs/TeamsTab';
import { ValueTab } from './tabs/ValueTab';
import { ChangeImpactTab } from './tabs/ChangeImpactTab';
import { BudgetTab } from './tabs/BudgetTab';
import { ActualsTab } from './tabs/ActualsTab';
import { CommitteeTab } from './tabs/CommitteeTab';
import { HistoryTab } from './tabs/HistoryTab';
import type { Project } from '@/lib/project-api';

interface ProjectTabsProps {
  project: Project;
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  disabled?: boolean;
  defaultTab?: string;
}

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'effort', label: 'Effort' },
  { id: 'change-impact', label: 'Change Impact' },
  { id: 'value', label: 'Value' },
  { id: 'budget', label: 'Budget' },
  { id: 'committee', label: 'Committee' },
  { id: 'actuals', label: 'Actuals' },
  { id: 'history', label: 'History' },
];

export function ProjectTabs({ project, formData, onChange, disabled, defaultTab }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'general');

  // Update active tab when defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex items-start h-full">
      <TabsList className="flex flex-col items-stretch justify-start h-auto w-40 shrink-0 border-r bg-transparent p-2 space-y-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="w-full justify-start px-3 py-2 data-[state=active]:bg-muted"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="flex-1 p-4 overflow-auto">
        <TabsContent value="general" className="mt-0 h-full">
          <GeneralTab
            project={project}
            formData={formData}
            onChange={onChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="effort" className="mt-0 h-full">
          <TeamsTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="change-impact" className="mt-0 h-full">
          <ChangeImpactTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="value" className="mt-0 h-full">
          <ValueTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="budget" className="mt-0 h-full">
          <BudgetTab project={project} disabled={disabled} />
        </TabsContent>

        <TabsContent value="committee" className="mt-0 h-full">
          <CommitteeTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="actuals" className="mt-0 h-full">
          <ActualsTab project={project} disabled={disabled} />
        </TabsContent>

        <TabsContent value="history" className="mt-0 h-full">
          <HistoryTab projectId={project.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
