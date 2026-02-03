import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GeneralTab } from './tabs/GeneralTab';
import { PeopleTab } from './tabs/PeopleTab';
import type { Project } from '@/lib/project-api';

interface ProjectTabsProps {
  project: Project;
  formData: Partial<Project>;
  onChange: (updates: Partial<Project>) => void;
}

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'people', label: 'People' },
  { id: 'teams', label: 'Teams' },
  { id: 'value', label: 'Value' },
  { id: 'change-impact', label: 'Change Impact' },
];

export function ProjectTabs({ project, formData, onChange }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="general" orientation="vertical" className="flex h-full">
      <TabsList className="flex flex-col h-auto w-40 shrink-0 border-r bg-transparent p-2 space-y-1">
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
          />
        </TabsContent>

        <TabsContent value="people" className="mt-0 h-full">
          <PeopleTab
            formData={formData}
            onChange={onChange}
          />
        </TabsContent>

        <TabsContent value="teams" className="mt-0 h-full">
          <div className="text-muted-foreground">Teams tab - coming next</div>
        </TabsContent>

        <TabsContent value="value" className="mt-0 h-full">
          <div className="text-muted-foreground">Value tab - coming next</div>
        </TabsContent>

        <TabsContent value="change-impact" className="mt-0 h-full">
          <div className="text-muted-foreground">Change Impact tab - coming next</div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
