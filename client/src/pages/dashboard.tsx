import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { StatsBar } from "@/components/stats-bar";
import { EmailCard } from "@/components/email-card";
import { ResponsePanel } from "@/components/response-panel";
import { AnalyticsModal } from "@/components/analytics-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search } from "lucide-react";
import type { Email, EmailFilters } from "@/lib/types";

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>({
    limit: 50,
    offset: 0,
  });

  const { data: emails = [], isLoading, refetch } = useQuery<Email[]>({
    queryKey: ['/api/emails', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.sentiment) params.append('sentiment', filters.sentiment);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/emails?${params}`);
      return response.json();
    },
  });

  const handleRefresh = async () => {
    try {
      await fetch('/api/emails/refresh', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Error refreshing emails:', error);
    }
  };

  const handleFilterChange = (key: keyof EmailFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
    }));
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        onAnalyticsClick={() => setShowAnalytics(true)}
        data-testid="sidebar"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Email Dashboard</h2>
              <p className="text-sm text-muted-foreground">Monitor and manage incoming support emails</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live sync active</span>
              </div>
              <Button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-refresh"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Email List Section */}
          <div className="flex-1 flex flex-col">
            <StatsBar data-testid="stats-bar" />

            {/* Filter Controls */}
            <div className="bg-card border-b border-border p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground">Filter:</label>
                  <Select onValueChange={(value) => handleFilterChange('status', value)} data-testid="select-filter">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Emails" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Emails</SelectItem>
                      <SelectItem value="pending">Pending Only</SelectItem>
                      <SelectItem value="resolved">Resolved Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground">Priority:</label>
                  <Select onValueChange={(value) => handleFilterChange('priority', value)} data-testid="select-priority">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="urgent">Urgent Only</SelectItem>
                      <SelectItem value="normal">Normal Only</SelectItem>
                      <SelectItem value="low">Low Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-foreground">Sentiment:</label>
                  <Select onValueChange={(value) => handleFilterChange('sentiment', value)} data-testid="select-sentiment">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Sentiments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sentiments</SelectItem>
                      <SelectItem value="positive">Positive Only</SelectItem>
                      <SelectItem value="neutral">Neutral Only</SelectItem>
                      <SelectItem value="negative">Negative Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="ml-auto relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search emails..." 
                    className="pl-10 w-64"
                    onChange={(e) => handleSearch(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                // Loading state
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                    <div className="flex items-start space-x-4">
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : emails.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-8 text-center">
                  <div className="text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No emails found</h3>
                    <p className="text-sm">No emails match your current filters. Try adjusting your search criteria or refresh to fetch new emails.</p>
                  </div>
                </div>
              ) : (
                emails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleEmailSelect(email)}
                    data-testid={`card-email-${email.id}`}
                  />
                ))
              )}
            </div>
          </div>

          {/* Response Panel */}
          <ResponsePanel
            selectedEmail={selectedEmail}
            onEmailUpdate={(updatedEmail) => {
              setSelectedEmail(updatedEmail);
              refetch();
            }}
            data-testid="response-panel"
          />
        </div>
      </main>

      {/* Analytics Modal */}
      <AnalyticsModal
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
        data-testid="analytics-modal"
      />
    </div>
  );
}
