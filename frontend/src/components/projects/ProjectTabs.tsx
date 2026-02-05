import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GeneralTab } from './tabs/GeneralTab';
import { PeopleTab } from './tabs/PeopleTab';
import { TeamsTab } from './tabs/TeamsTab';
import { ValueTab } from './tabs/ValueTab';
import { ChangeImpactTab } from './tabs/ChangeImpactTab';
import { BudgetTab } from './tabs/BudgetTab';
import { ActualsTab } from './tabs/ActualsTab';
import type { Project } from '@/lib/project-api';

interface ProjectTabsProps {
  project: Project;
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
  disabled?: boolean;
}

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'people', label: 'People' },
  { id: 'teams', label: 'Teams' },
  { id: 'value', label: 'Value' },
  { id: 'change-impact', label: 'Change Impact' },
  { id: 'budget', label: 'Budget' },
  { id: 'actuals', label: 'Actuals' },
];

export function ProjectTabs({ project, formData, onChange, disabled }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="flex items-start h-full">
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

        <TabsContent value="people" className="mt-0 h-full">
          <PeopleTab
            formData={formData}
            onChange={onChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-0 h-full">
          <TeamsTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="value" className="mt-0 h-full">
          <ValueTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="change-impact" className="mt-0 h-full">
          <ChangeImpactTab projectId={project.id} disabled={disabled} />
        </TabsContent>

        <TabsContent value="budget" className="mt-0 h-full">
          <BudgetTab project={project} disabled={disabled} />
        </TabsContent>

        <TabsContent value="actuals" className="mt-0 h-full">
          <ActualsTab project={project} disabled={disabled} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
