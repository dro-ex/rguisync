
import React, { useState, useEffect } from "react";
import { AppSettings } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateEmailSettings } from "../services/email";
import { toast } from "@/components/ui/use-toast";
import { useAppContext } from "../context/AppContext";
import { Sun, Moon } from "lucide-react";

const SettingsPanel: React.FC = () => {
  const { settings, updateAppSettings } = useAppContext();
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const path = name.split(".");
    
    if (path.length === 2 && path[0] === "email") {
      const emailKey = path[1];
      
      setFormData(prev => ({
        ...prev,
        email: {
          ...prev.email,
          [emailKey]: value
        }
      }));
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (name === "darkMode") {
      setFormData(prev => ({ ...prev, darkMode: checked }));
    } else if (name === "email.enabled") {
      setFormData(prev => ({
        ...prev,
        email: {
          ...prev.email,
          enabled: checked
        }
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.email.enabled && !validateEmailSettings()) {
      toast({
        title: "Validation Error",
        description: "Please enter a recipient email address or disable email notifications",
        variant: "destructive",
      });
      return;
    }
    
    updateAppSettings(formData);
    toast({ title: "Settings Saved", description: "Your settings have been updated" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email Notifications</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="darkMode"
                  checked={formData.darkMode}
                  onCheckedChange={(checked) => handleSwitchChange("darkMode", checked)}
                />
                <Label htmlFor="darkMode" className="flex items-center gap-2">
                  {formData.darkMode ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Light Mode
                    </>
                  )}
                </Label>
              </div>
              
              <Button type="submit">Save Settings</Button>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email.enabled"
                  checked={formData.email.enabled}
                  onCheckedChange={(checked) => handleSwitchChange("email.enabled", checked)}
                />
                <Label htmlFor="email.enabled">Enable Email Notifications</Label>
              </div>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email.toAddress">To Address</Label>
                  <Input
                    id="email.toAddress"
                    name="email.toAddress"
                    value={formData.email.toAddress}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    disabled={!formData.email.enabled}
                  />
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>Email will be sent using the system's mail command. Make sure mail is properly configured on your Debian system.</p>
                </div>
                
                <Button type="submit" disabled={!formData.email.enabled}>Save Settings</Button>
              </div>
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;
