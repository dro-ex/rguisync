
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "./JobList";
import SettingsPanel from "./SettingsPanel";
import JobHistory from "./JobHistory";

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">rGUIsync</h1>
      </header>
      
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          <JobList />
        </TabsContent>
        
        <TabsContent value="history">
          <JobHistory />
        </TabsContent>
        
        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
