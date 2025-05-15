
import React, { createContext, useContext, useEffect, useState } from "react";
import { RsyncJob, AppSettings } from "../types";
import { getJobs, getSettings, updateSettings } from "../services/database";
import { initializeScheduler, rescheduleAllJobs, cleanupScheduler } from "../services/scheduler";

interface AppContextType {
  jobs: RsyncJob[];
  settings: AppSettings;
  refreshJobs: () => void;
  updateAppSettings: (settings: AppSettings) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType>({
  jobs: [],
  settings: {
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
  },
  refreshJobs: () => {},
  updateAppSettings: () => {},
  isLoading: false,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<RsyncJob[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isLoading, setIsLoading] = useState(true);

  // Load jobs and initialize scheduler
  useEffect(() => {
    refreshJobs();
    initializeScheduler();

    return () => {
      cleanupScheduler();
    };
  }, []);

  // Apply theme based on settings
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [settings.darkMode]);

  const refreshJobs = () => {
    setIsLoading(true);
    const fetchedJobs = getJobs();
    setJobs(fetchedJobs);
    setIsLoading(false);
  };

  const updateAppSettings = (newSettings: AppSettings) => {
    const updatedSettings = updateSettings(newSettings);
    setSettings(updatedSettings);
    rescheduleAllJobs(); // Reschedule in case any settings affect job scheduling
  };

  return (
    <AppContext.Provider value={{ jobs, settings, refreshJobs, updateAppSettings, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
