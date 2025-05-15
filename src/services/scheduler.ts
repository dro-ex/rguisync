
import { RsyncJob } from "../types";
import { getJobs, updateJob } from "./database";
import { executeRsyncJob, getNextRunTime } from "./rsync";

const jobSchedules: Record<string, NodeJS.Timeout> = {};

// Initialize scheduler
export function initializeScheduler(): void {
  console.log("[scheduler] Initializing scheduler");
  const jobs = getJobs();
  
  // Schedule all enabled jobs
  jobs.filter(job => job.enabled).forEach(scheduleJob);
}

// Schedule a single job
export function scheduleJob(job: RsyncJob): void {
  console.log(`[scheduler] Scheduling job: ${job.name}`);
  
  // Clear existing schedule if any
  clearJobSchedule(job.id);
  
  if (!job.enabled || !job.schedule) {
    console.log(`[scheduler] Job is disabled or has no schedule: ${job.name}`);
    return;
  }
  
  try {
    // For this demo, we'll use a simple interval-based scheduler
    // In a real app, use a proper cron parser
    const nextRun = getNextRunTime(job.schedule);
    
    if (!nextRun) {
      console.log(`[scheduler] Invalid schedule for job: ${job.name}`);
      return;
    }
    
    const now = new Date();
    const delay = Math.max(0, nextRun.getTime() - now.getTime());
    
    console.log(`[scheduler] Job ${job.name} scheduled for ${nextRun.toLocaleString()}`);
    
    jobSchedules[job.id] = setTimeout(async () => {
      try {
        await executeRsyncJob(job);
      } catch (err) {
        console.error(`[scheduler] Error executing job ${job.name}:`, err);
      }
      
      // Reschedule the job after execution
      scheduleJob(job);
    }, delay);
  } catch (error) {
    console.error(`[scheduler] Failed to schedule job ${job.name}:`, error);
  }
}

// Clear a job's schedule
export function clearJobSchedule(jobId: string): void {
  if (jobSchedules[jobId]) {
    clearTimeout(jobSchedules[jobId]);
    delete jobSchedules[jobId];
    console.log(`[scheduler] Cleared schedule for job ${jobId}`);
  }
}

// Reschedule all jobs
export function rescheduleAllJobs(): void {
  console.log("[scheduler] Rescheduling all jobs");
  
  // Clear all existing schedules
  Object.keys(jobSchedules).forEach(jobId => {
    clearJobSchedule(jobId);
  });
  
  // Schedule all enabled jobs
  const jobs = getJobs();
  jobs.filter(job => job.enabled).forEach(scheduleJob);
}

// Clean up all schedules (e.g., on app shutdown)
export function cleanupScheduler(): void {
  console.log("[scheduler] Cleaning up scheduler");
  
  Object.keys(jobSchedules).forEach(jobId => {
    clearJobSchedule(jobId);
  });
}

// Manually execute a job immediately
export async function executeJobNow(jobId: string): Promise<void> {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);
  
  if (!job) {
    throw new Error(`Job with ID ${jobId} not found`);
  }
  
  try {
    await executeRsyncJob(job);
  } catch (error) {
    console.error(`[scheduler] Failed to execute job ${job.name}:`, error);
    throw error;
  }
}
