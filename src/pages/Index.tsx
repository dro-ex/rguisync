
import React from "react";
import Dashboard from "@/components/Dashboard";
import { AppProvider } from "@/context/AppContext";

const Index = () => {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
};

export default Index;
