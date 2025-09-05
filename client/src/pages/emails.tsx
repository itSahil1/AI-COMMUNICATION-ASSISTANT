import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmailCard } from "@/components/email-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Mail } from "lucide-react";
import type { Email, EmailFilters } from "@/lib/types";

export default function Emails() {
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
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({
      ...prev,
      search: search || undefined,
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Management
          </h1>
          <p className="text-muted-foreground">View and manage all incoming support emails</p>
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

      {/* Filter Controls */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Status:</label>
            <Select onValueChange={(value) => handleFilterChange('status', value)} data-testid="select-status">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
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
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
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
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
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
      <div className="space-y-4">
        {isLoading ? (
          // Loading state
          Array.from({ length: 5 }).map((_, i) => (
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
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No emails found</h3>
            <p className="text-muted-foreground">
              No emails match your current filters. Try adjusting your search criteria or refresh to check for new emails.
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <EmailCard key={email.id} email={email} onClick={() => {}} data-testid={`card-email-${email.id}`} />
          ))
        )}
      </div>
    </div>
  );
}