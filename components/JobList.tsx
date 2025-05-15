
import React, { useState } from "react";
import { RsyncJob } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { deleteJob, updateJob } from "../services/database";
import { executeJobNow, scheduleJob, clearJobSchedule } from "../services/scheduler";
import { toast } from "@/components/ui/use-toast";
import { Check, X, Edit, Trash2, Play, Clock } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import JobFormModal from "./JobFormModal";

const JobList: React.FC = () => {
  const { jobs, refreshJobs } = useAppContext();
  const [editingJob, setEditingJob] = useState<RsyncJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStatusChange = (job: RsyncJob, enabled: boolean) => {
    const updatedJob = { ...job, enabled };
    updateJob(updatedJob);
    
    if (enabled) {
      scheduleJob(updatedJob);
      toast({ title: "Job Enabled", description: `${job.name} has been enabled` });
    } else {
      clearJobSchedule(job.id);
      toast({ title: "Job Disabled", description: `${job.name} has been disabled` });
    }
    
    refreshJobs();
  };

  const handleRunNow = async (job: RsyncJob) => {
    toast({ title: "Running Job", description: `${job.name} has been started` });
    try {
      await executeJobNow(job.id);
      refreshJobs();
    } catch (error) {
      console.error("Failed to run job:", error);
      toast({
        title: "Error",
        description: "Failed to run job. Check console for details.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (job: RsyncJob) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleDelete = (job: RsyncJob) => {
    if (window.confirm(`Are you sure you want to delete job "${job.name}"?`)) {
      clearJobSchedule(job.id);
      deleteJob(job.id);
      toast({ title: "Job Deleted", description: `${job.name} has been deleted` });
      refreshJobs();
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status || status === "none") {
      return <Badge variant="outline">Not Run</Badge>;
    }
    
    switch (status) {
      case "success":
        return <Badge className="bg-terminal-green">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge className="bg-terminal-blue">Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rsync Jobs</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}>Add Job</Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No jobs found. Add a new job to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Source → Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.name}</TableCell>
                      <TableCell className="font-mono text-sm">{job.schedule}</TableCell>
                      <TableCell className="max-w-[250px] truncate font-mono text-xs">
                        {job.source} → {job.destination}
                      </TableCell>
                      <TableCell>{renderStatusBadge(job.lastStatus)}</TableCell>
                      <TableCell>
                        {job.lastRun 
                          ? new Date(job.lastRun).toLocaleString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={job.enabled}
                          onCheckedChange={(checked) => handleStatusChange(job, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRunNow(job)}
                            title="Run Now"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(job)}
                            title="Edit Job"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(job)}
                            title="Delete Job"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <JobFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        job={editingJob}
        onJobSaved={refreshJobs}
      />
    </>
  );
};

export default JobList;
