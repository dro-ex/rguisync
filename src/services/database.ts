import { RsyncJob, AppSettings } from "../types";

// Simulated database using localStorage
// In a real app, this would use IndexedDB, a server API, etc.

// Mock data for initial setup
const initialJobs: RsyncJob[] = [];

const initialSettings: AppSettings = {
  email: {
    enabled: false,
    smtpServer: "",
    smtpPort: 587,
    username: "",
    password: "",
    fromAddress: "",
    toAddress: "",
  },
  darkMode: true,
};

interface JobHistory {
  jobId: string;
  timestamp: string;
  status: "success" | "error" | "running";
  message: string;
}

interface Database {
  jobs: RsyncJob[];
  jobHistory: JobHistory[];
  settings: AppSettings;
}

// Load database from localStorage
function loadDatabase(): Database {
  try {
    const savedData = localStorage.getItem("rsyncDb");
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Failed to load database:", error);
  }
  
  // Return default data if nothing is saved
  return {
    jobs: initialJobs,
    jobHistory: [],
    settings: initialSettings,
  };
}

// Save database to localStorage
function saveDatabase(db: Database): void {
  try {
    localStorage.setItem("rsyncDb", JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save database:", error);
  }
}

// Get all jobs
export function getJobs(): RsyncJob[] {
  const db = loadDatabase();
  return [...db.jobs];
}

// Get job by ID
export function getJobById(id: string): RsyncJob | undefined {
  const db = loadDatabase();
  return db.jobs.find(job => job.id === id);
}

// Add a new job
export function addJob(jobData: Omit<RsyncJob, "id">): RsyncJob {
  const db = loadDatabase();
  
  const newJob: RsyncJob = {
    ...jobData,
    id: Date.now().toString(),
    lastRun: undefined,
    lastStatus: "none",
    lastMessage: undefined,
  };
  
  db.jobs.push(newJob);
  saveDatabase(db);
  
  return newJob;
}

// Update an existing job
export function updateJob(job: RsyncJob): RsyncJob {
  const db = loadDatabase();
  const index = db.jobs.findIndex(j => j.id === job.id);
  
  if (index !== -1) {
    db.jobs[index] = job;
    saveDatabase(db);
  }
  
  return job;
}

// Delete a job
export function deleteJob(id: string): void {
  const db = loadDatabase();
  db.jobs = db.jobs.filter(job => job.id !== id);
  
  // Also delete related job history
  db.jobHistory = db.jobHistory.filter(record => record.jobId !== id);
  
  saveDatabase(db);
}

// Get job history
export function getJobHistory(jobId?: string): JobHistory[] {
  const db = loadDatabase();
  
  if (jobId) {
    return db.jobHistory.filter(record => record.jobId === jobId);
  }
  
  return db.jobHistory;
}

// Add job history entry
export function addJobHistory(
  jobId: string, 
  status: "success" | "error" | "running", 
  message: string
): void {
  const db = loadDatabase();
  db.jobHistory.push({
    jobId,
    timestamp: new Date().toISOString(),
    status,
    message,
  });
  
  saveDatabase(db);
}

// Clear job history
export function clearJobHistory(jobId?: string): void {
  const db = loadDatabase();
  
  if (jobId) {
    db.jobHistory = db.jobHistory.filter(record => record.jobId !== jobId);
  } else {
    db.jobHistory = [];
  }
  
  saveDatabase(db);
}

// Get settings
export function getSettings(): AppSettings {
  const db = loadDatabase();
  return { ...db.settings };
}

// Update settings
export function updateSettings(settings: AppSettings): AppSettings {
  const db = loadDatabase();
  db.settings = settings;
  saveDatabase(db);
  return settings;
}
