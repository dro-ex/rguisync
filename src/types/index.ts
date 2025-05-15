
export interface RsyncJob {
  id: string;
  name: string;
  source: string;
  destination: string;
  options: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: "success" | "error" | "running" | "none";
  lastMessage?: string;
  notifyOnSuccess: boolean;
  notifyOnError: boolean;
}

export interface EmailSettings {
  enabled: boolean;
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  fromAddress: string;
  toAddress: string;
}

export interface AppSettings {
  email: EmailSettings;
  darkMode: boolean;
}
