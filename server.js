const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const cron       = require('node-cron');
const { exec }   = require('child_process');
const fs         = require('fs').promises;
const path       = require('path');

const JOBS_FILE = path.join(__dirname, 'jobs.json');
let jobs = [];
const tasks = {};

// Load jobs from disk
async function loadJobs() {
  try {
    const data = await fs.readFile(JOBS_FILE, 'utf8');
    jobs = JSON.parse(data);
  } catch {
    jobs = [];
  }
}

// Persist jobs to disk
async function saveJobs() {
  await fs.writeFile(JOBS_FILE, JSON.stringify(jobs, null,2));
}

// Schedule (or re‑schedule) a job
function scheduleJob(job) {
  if (tasks[job.id]) tasks[job.id].stop();

  // job.schedule is a cron expression, e.g. "0 * * * *"
  tasks[job.id] = cron.schedule(job.schedule, () => {
    const cmd = `rsync ${job.options || ''} ${job.source} ${job.destination}`;
    console.log(`[${new Date().toISOString()}] Running job ${job.id}: ${cmd}`);
    exec(cmd, (err, stdout, stderr) => {
      if (err)  console.error(`Job ${job.id} error:`, stderr);
      else      console.log(`Job ${job.id} done:`, stdout);
    });
  }, { scheduled: true });
}

(async () => {
  await loadJobs();
  jobs.forEach(job => scheduleJob(job));

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // List all jobs
  app.get('/jobs', (req, res) => res.json(jobs));

  // Create a new job
  app.post('/jobs', async (req, res) => {
    const { schedule, source, destination, options } = req.body;
    if (!schedule || !source || !destination) {
      return res.status(400).json({ error: 'schedule, source & destination required' });
    }
    const id = Date.now().toString();
    const job = { id, schedule, source, destination, options: options || '' };
    jobs.push(job);
    await saveJobs();
    scheduleJob(job);
    res.status(201).json(job);
  });

  // Delete a job
  app.delete('/jobs/:id', async (req, res) => {
    const { id } = req.params;
    jobs = jobs.filter(j => j.id !== id);
    if (tasks[id]) tasks[id].stop();
    await saveJobs();
    res.sendStatus(204);
  });

  // Manually trigger a job immediately
  app.post('/jobs/:id/run', (req, res) => {
    const job = jobs.find(j => j.id === req.params.id);
    if (!job) return res.sendStatus(404);
    const cmd = `rsync ${job.options || ''} ${job.source} ${job.destination}`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      res.json({ stdout });
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`↪ Server listening on http://localhost:${PORT}`);
  });
})();
