
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { clearJobHistory, getJobHistory, getJobs } from "../services/database";
import { RsyncJob } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HistoryEntry {
  jobId: string;
  timestamp: string;
  status: "success" | "error" | "running";
  message: string;
}

const JobHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [jobs, setJobs] = useState<RsyncJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("all");

  useEffect(() => {
    loadHistory();
    setJobs(getJobs());
  }, []);

  const loadHistory = () => {
    const historyData = getJobHistory(selectedJobId !== "all" ? selectedJobId : undefined);
    setHistory(historyData.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  useEffect(() => {
    loadHistory();
  }, [selectedJobId]);

  const getJobName = (jobId: string): string => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.name : "Unknown Job";
  };

  const handleClearHistory = () => {
    clearJobHistory(selectedJobId !== "all" ? selectedJobId : undefined);
    loadHistory();
    toast({ 
      title: "History Cleared", 
      description: selectedJobId !== "all" 
        ? `History for ${getJobName(selectedJobId)} has been cleared` 
        : "All job history has been cleared"
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-terminal-green">Success</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "running":
        return <Badge className="bg-terminal-blue">Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Job History</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="job-filter">Filter:</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-[200px]" id="job-filter">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" title="Clear History">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Job History</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedJobId !== "all"
                    ? `This will clear all history records for ${getJobName(selectedJobId)}.`
                    : "This will clear all job history records."}
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No history records found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{getJobName(entry.jobId)}</TableCell>
                  <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{renderStatusBadge(entry.status)}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs max-w-md truncate">
                      {entry.message}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default JobHistory;
