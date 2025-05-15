
import React, { useState, useEffect } from "react";
import { RsyncJob } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { addJob, updateJob } from "../services/database";
import { toast } from "@/components/ui/use-toast";
import { scheduleJob, clearJobSchedule } from "../services/scheduler";

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: RsyncJob | null;
  onJobSaved: () => void;
}

const defaultJob: Omit<RsyncJob, "id"> = {
  name: "",
  source: "",
  destination: "",
  options: "-avz --delete",
  schedule: "0 2 * * *", // Default: 2 AM every day
  enabled: true,
  notifyOnSuccess: false,
  notifyOnError: true,
};

const JobFormModal: React.FC<JobFormModalProps> = ({ isOpen, onClose, job, onJobSaved }) => {
  const [formData, setFormData] = useState<Omit<RsyncJob, "id">>({ ...defaultJob });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (job) {
      setFormData({ ...job });
    } else {
      setFormData({ ...defaultJob });
    }
    setErrors({});
  }, [job, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Job name is required";
    }
    
    if (!formData.source.trim()) {
      newErrors.source = "Source path is required";
    }
    
    if (!formData.destination.trim()) {
      newErrors.destination = "Destination path is required";
    }
    
    if (!formData.schedule.trim()) {
      newErrors.schedule = "Schedule is required";
    } else if (!/^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/.test(formData.schedule)) {
      newErrors.schedule = "Invalid cron format (minute hour day month dayOfWeek)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (job?.id) {
        // Update existing job
        const updatedJob = updateJob({ ...formData, id: job.id });
        
        if (updatedJob.enabled) {
          scheduleJob(updatedJob);
        } else {
          clearJobSchedule(updatedJob.id);
        }
        
        toast({ title: "Job Updated", description: `${updatedJob.name} has been updated` });
      } else {
        // Create new job
        const newJob = addJob(formData);
        
        if (newJob.enabled) {
          scheduleJob(newJob);
        }
        
        toast({ title: "Job Created", description: `${newJob.name} has been created` });
      }
      
      onJobSaved();
      onClose();
    } catch (error) {
      console.error("Failed to save job:", error);
      toast({
        title: "Error",
        description: "Failed to save job. Check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={state => !state && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{job ? "Edit Job" : "Add New Job"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Daily Backup"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                placeholder="/path/to/source/"
                className={errors.source ? "border-destructive" : ""}
              />
              {errors.source && <p className="text-destructive text-sm">{errors.source}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="/path/to/backup/"
                className={errors.destination ? "border-destructive" : ""}
              />
              {errors.destination && <p className="text-destructive text-sm">{errors.destination}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="options">Rsync Options</Label>
              <Input
                id="options"
                name="options"
                value={formData.options}
                onChange={handleChange}
                placeholder="-avz --delete"
              />
              <p className="text-muted-foreground text-xs">Common options: -a (archive), -v (verbose), -z (compress), --delete (remove extraneous files)</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="schedule">
                Schedule (Cron Format)
                <span className="text-muted-foreground text-xs ml-2">minute hour day month dayOfWeek</span>
              </Label>
              <Input
                id="schedule"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
                placeholder="0 2 * * *"
                className={errors.schedule ? "border-destructive" : ""}
              />
              {errors.schedule && <p className="text-destructive text-sm">{errors.schedule}</p>}
              <p className="text-muted-foreground text-xs">Examples: "0 2 * * *" (2 AM daily), "0 */6 * * *" (every 6 hours)</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleSwitchChange("enabled", checked)}
              />
              <Label htmlFor="enabled">Job Enabled</Label>
            </div>
            
            <div className="grid gap-4 pt-4">
              <h4 className="font-medium">Email Notifications</h4>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnSuccess"
                  checked={formData.notifyOnSuccess}
                  onCheckedChange={(checked) => handleSwitchChange("notifyOnSuccess", checked)}
                />
                <Label htmlFor="notifyOnSuccess">Notify on success</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnError"
                  checked={formData.notifyOnError}
                  onCheckedChange={(checked) => handleSwitchChange("notifyOnError", checked)}
                />
                <Label htmlFor="notifyOnError">Notify on error</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {job ? "Update" : "Create"} Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobFormModal;
