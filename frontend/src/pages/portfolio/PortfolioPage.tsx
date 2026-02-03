import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProjectSidebar } from '@/components/projects/ProjectSidebar';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { fetchProjects, type Project } from '@/lib/project-api';

export function PortfolioPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleRowClick = (project: Project) => {
    setSelectedProjectId(project.id);
    setSidebarOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No projects yet. Create your first project to get started.
        </div>
      ) : (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Project ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Lead Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(project)}
                >
                  <TableCell className="font-mono text-sm">
                    {project.projectId}
                  </TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.leadTeam?.name || '-'}</TableCell>
                  <TableCell>
                    {project.status && (
                      <Badge
                        className="text-white"
                        style={{ backgroundColor: project.status.color }}
                      >
                        {project.status.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.isStopped && (
                      <Badge variant="secondary">Stopped</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectSidebar
        projectId={selectedProjectId}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        onProjectUpdated={loadProjects}
        onDeleted={() => {
          loadProjects();
          setSelectedProjectId(null);
        }}
      />

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          loadProjects();
          setSelectedProjectId(project.id);
          setSidebarOpen(true);
        }}
      />
    </div>
  );
}
