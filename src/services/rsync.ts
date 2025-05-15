
import { RsyncJob } from "../types";
import { addJobHistory, updateJob, getJobById } from "./database";
import { sendEmail } from "./email";

// In a real app, this would execute rsync commands via an API or backend
// For this demo, we'll simulate rsync execution
export async function executeRsyncJob(job: RsyncJob): Promise<void> {
  console.log(`[rsync] Executing job: ${job.name}`);
  console.log(`[rsync] Command: rsync ${job.options} ${job.source} ${job.destination}`);
  
  // Update job status to running
  const updatedJob = { ...job, lastStatus: "running" as "running" };
  updateJob(updatedJob);
  
  // Add running status to job history
  addJobHistory(job.id, "running", "Job started");
  
  // Simulate job execution with a delay
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 90% success rate for simulation
      const success = Math.random() > 0.1;
      
      // Get the most up-to-date job data
      const currentJob = getJobById(job.id) || job;
      
      if (success) {
        console.log(`[rsync] Job completed successfully: ${job.name}`);
        
        // Update job status to success
        updateJob({ ...currentJob, lastStatus: "success" as const });
        addJobHistory(job.id, "success", "Job completed successfully");
        
        if (job.notifyOnSuccess) {
          sendEmail(
            `Rsync Job Succeeded: ${job.name}`,
            `Your rsync job "${job.name}" completed successfully at ${new Date().toLocaleString()}.`
          );
        }
        
        resolve();
      } else {
        const errorMessage = "Simulated error: Connection timed out";
        console.error(`[rsync] Job failed: ${job.name} - ${errorMessage}`);
        
        // Update job status to error
        updateJob({ ...currentJob, lastStatus: "error" as const });
        addJobHistory(job.id, "error", errorMessage);
        
        if (job.notifyOnError) {
          sendEmail(
            `Rsync Job Failed: ${job.name}`,
            `Your rsync job "${job.name}" failed at ${new Date().toLocaleString()}.\n\nError: ${errorMessage}`
          );
        }
        
        reject(new Error(errorMessage));
      }
    }, 2000);
  });
}

// Parse cron expression to determine next run time
export function getNextRunTime(cronExpression: string): Date | null {
  try {
    // Simple cron parser (in real app, use a proper cron parser library)
    // Format: minute hour day month dayOfWeek
    const parts = cronExpression.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      return null;
    }
    
    // This is a simplified demo - in a real app, use a proper cron parser
    // For now, we'll just add some hours to the current time
    const now = new Date();
    return new Date(now.getTime() + 1000 * 60 * 60 * (1 + Math.random() * 5));
  } catch (error) {
    console.error("Failed to parse cron expression:", error);
    return null;
  }
}
