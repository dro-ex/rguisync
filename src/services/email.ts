
import { getSettings } from "./database";
import { toast } from "@/components/ui/use-toast";

// Only import child_process in non-browser environments
let spawn: any;
if (typeof window === 'undefined') {
  // Server-side code
  const childProcess = require('child_process');
  spawn = childProcess.spawn;
}

// Use local mail command (available on Debian)
function sendMailCommand(to: string, subject: string, body: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Check if we're in a server environment
      if (typeof window !== 'undefined' || !spawn) {
        console.log("[mail] Cannot use mail command in browser");
        return resolve(false);
      }
      
      console.log(`[mail] Sending email to: ${to}`);
      console.log(`[mail] Subject: ${subject}`);
      
      // Create mail process
      const mailProcess = spawn('mail', [
        '-s', subject, // Subject
        to // To address
      ]);
      
      // Write body to stdin
      mailProcess.stdin.write(body);
      mailProcess.stdin.end();
      
      mailProcess.on('close', (code) => {
        if (code === 0) {
          console.log("[mail] Email sent successfully via local mail command");
          resolve(true);
        } else {
          console.error(`[mail] Failed to send email: exit code ${code}`);
          resolve(false);
        }
      });
      
      mailProcess.stderr.on('data', (data) => {
        console.error(`[mail] Error: ${data}`);
      });
      
    } catch (error) {
      console.error("[mail] Failed to execute mail command:", error);
      resolve(false);
    }
  });
}

// In a real app, this would send emails via system mail
// For this demo, we'll simulate email sending with local mail command
export async function sendEmail(subject: string, body: string): Promise<boolean> {
  const settings = getSettings();
  
  if (!settings.email.enabled) {
    console.log("[email] Email notifications are disabled");
    return false;
  }
  
  console.log(`[email] Sending email to: ${settings.email.toAddress}`);
  
  if (typeof window !== 'undefined') {
    // Running in browser - simulate email sending
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("[email] Email sent successfully (simulated in browser)");
        toast({
          title: "Email Notification Simulated",
          description: `To: ${settings.email.toAddress}`,
        });
        resolve(true);
      }, 1000);
    });
  } else {
    // Running in Node.js environment
    const result = await sendMailCommand(
      settings.email.toAddress,
      subject,
      body
    );
    
    if (result) {
      toast({
        title: "Email Notification Sent",
        description: `To: ${settings.email.toAddress}`,
      });
    } else {
      toast({
        title: "Email Notification Failed",
        description: "Could not send email",
        variant: "destructive"
      });
    }
    
    return result;
  }
}

// Validate email settings
export function validateEmailSettings(): boolean {
  const settings = getSettings();
  
  if (!settings.email.enabled) {
    return true;
  }
  
  return Boolean(settings.email.toAddress);
}
