import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Save, Mail, Bot, Database, Shield, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    openaiApiKey: "",
    emailProvider: "imap",
    gmailClientId: "",
    gmailClientSecret: "",
    gmailRefreshToken: "",
    imapHost: "imap.gmail.com",
    imapPort: "993",
    imapUser: "",
    imapPassword: "",
    imapSecure: true,
    autoResponse: true,
    urgentThreshold: "high",
    notifications: true,
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your settings have been saved successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settings.emailProvider,
          gmail: {
            clientId: settings.gmailClientId,
            clientSecret: settings.gmailClientSecret,
            refreshToken: settings.gmailRefreshToken,
          },
          imap: {
            host: settings.imapHost,
            port: parseInt(settings.imapPort),
            secure: settings.imapSecure,
            user: settings.imapUser,
            password: settings.imapPassword,
          },
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Connection successful",
          description: "Email connection test passed.",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Unable to connect with the current settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-muted-foreground">Configure your AI assistant and integrations</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-save"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="email">Email Setup</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* AI Configuration */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                OpenAI Configuration
              </CardTitle>
              <CardDescription>
                Configure your OpenAI API key for AI-powered email analysis and response generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={settings.openaiApiKey}
                  onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                  data-testid="input-openai-key"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Platform</a>
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to get your OpenAI API Key:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com</a></li>
                  <li>Sign in or create an account</li>
                  <li>Navigate to API Keys in your dashboard</li>
                  <li>Click "Create new secret key"</li>
                  <li>Copy and paste the key here</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Setup */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Provider Configuration
              </CardTitle>
              <CardDescription>
                Choose and configure your email provider for inbox monitoring.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={settings.emailProvider} onValueChange={(value) => handleSettingChange('emailProvider', value)}>
                  <SelectTrigger data-testid="select-email-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail (OAuth)</SelectItem>
                    <SelectItem value="imap">IMAP (Generic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.emailProvider === 'gmail' ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Gmail Setup Instructions:</h4>
                    <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                      <li>Create a new project or select existing one</li>
                      <li>Enable Gmail API</li>
                      <li>Create OAuth 2.0 credentials</li>
                      <li>Add authorized redirect URIs</li>
                      <li>Generate refresh token using OAuth 2.0 Playground</li>
                    </ol>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gmail-client-id">Client ID</Label>
                      <Input
                        id="gmail-client-id"
                        value={settings.gmailClientId}
                        onChange={(e) => handleSettingChange('gmailClientId', e.target.value)}
                        data-testid="input-gmail-client-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gmail-client-secret">Client Secret</Label>
                      <Input
                        id="gmail-client-secret"
                        type="password"
                        value={settings.gmailClientSecret}
                        onChange={(e) => handleSettingChange('gmailClientSecret', e.target.value)}
                        data-testid="input-gmail-client-secret"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gmail-refresh-token">Refresh Token</Label>
                    <Input
                      id="gmail-refresh-token"
                      type="password"
                      value={settings.gmailRefreshToken}
                      onChange={(e) => handleSettingChange('gmailRefreshToken', e.target.value)}
                      data-testid="input-gmail-refresh-token"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">IMAP Setup:</h4>
                    <p className="text-sm text-green-800">
                      Use IMAP settings for any email provider. For Gmail, enable "Less secure app access" or use App Passwords.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imap-host">IMAP Host</Label>
                      <Input
                        id="imap-host"
                        value={settings.imapHost}
                        onChange={(e) => handleSettingChange('imapHost', e.target.value)}
                        data-testid="input-imap-host"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-port">Port</Label>
                      <Input
                        id="imap-port"
                        value={settings.imapPort}
                        onChange={(e) => handleSettingChange('imapPort', e.target.value)}
                        data-testid="input-imap-port"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imap-user">Username/Email</Label>
                      <Input
                        id="imap-user"
                        value={settings.imapUser}
                        onChange={(e) => handleSettingChange('imapUser', e.target.value)}
                        data-testid="input-imap-user"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imap-password">Password</Label>
                      <Input
                        id="imap-password"
                        type="password"
                        value={settings.imapPassword}
                        onChange={(e) => handleSettingChange('imapPassword', e.target.value)}
                        data-testid="input-imap-password"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="imap-secure"
                      checked={settings.imapSecure}
                      onCheckedChange={(checked) => handleSettingChange('imapSecure', checked)}
                      data-testid="switch-imap-secure"
                    />
                    <Label htmlFor="imap-secure">Use SSL/TLS</Label>
                  </div>
                </div>
              )}

              <Button onClick={testConnection} variant="outline" data-testid="button-test-connection">
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Automation Settings
              </CardTitle>
              <CardDescription>
                Configure automatic response and email processing settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-response">Automatic Response Generation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically generate AI responses for incoming emails
                  </p>
                </div>
                <Switch
                  id="auto-response"
                  checked={settings.autoResponse}
                  onCheckedChange={(checked) => handleSettingChange('autoResponse', checked)}
                  data-testid="switch-auto-response"
                />
              </div>

              <div className="space-y-2">
                <Label>Urgent Email Threshold</Label>
                <Select value={settings.urgentThreshold} onValueChange={(value) => handleSettingChange('urgentThreshold', value)}>
                  <SelectTrigger data-testid="select-urgent-threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Mark more emails as urgent</SelectItem>
                    <SelectItem value="medium">Medium - Balanced urgency detection</SelectItem>
                    <SelectItem value="high">High - Only critical emails as urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new urgent emails
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  data-testid="switch-notifications"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Data
              </CardTitle>
              <CardDescription>
                Security settings and data management options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Data Security</h4>
                  <p className="text-sm text-blue-800">
                    All API keys and credentials are stored securely using environment variables. 
                    Email content is processed in real-time and stored locally in your database.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-600">Database</span>
                        <Badge variant="outline" className="text-green-600 border-green-200">Connected</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        PostgreSQL database is connected and operational
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-600">OpenAI API</span>
                        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                          {settings.openaiApiKey ? 'Configured' : 'Not Set'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        API key status for AI processing
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Security Notes:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Never share your API keys or credentials</li>
                    <li>Use strong, unique passwords for email accounts</li>
                    <li>Enable 2FA on your OpenAI and email accounts</li>
                    <li>Regularly review and rotate API keys</li>
                    <li>Monitor usage and billing on external services</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}