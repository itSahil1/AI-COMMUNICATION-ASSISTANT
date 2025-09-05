import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { AnalyticsModal } from "@/components/analytics-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, MessageSquare, Bot, User, Send, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Response {
  id: string;
  emailId: string;
  userId?: string;
  content: string;
  isAiGenerated: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  email: {
    id: string;
    subject: string;
    sender: string;
    senderName?: string;
    priority: string;
    sentiment: string;
  };
}

export default function Responses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: responses = [], isLoading, refetch } = useQuery<Response[]>({
    queryKey: ['/api/responses'],
    queryFn: async () => {
      const response = await fetch('/api/responses');
      return response.json();
    },
  });

  const filteredResponses = responses.filter(response =>
    response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.email.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    refetch();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        onAnalyticsClick={() => setShowAnalytics(true)}
        data-testid="sidebar"
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Response Management
          </h1>
          <p className="text-muted-foreground">Review and manage AI-generated and manual responses</p>
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search responses..." 
            className="pl-10 max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Generated</p>
                <p className="text-2xl font-bold">{responses.filter(r => r.isAiGenerated).length}</p>
              </div>
              <Bot className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Manual</p>
                <p className="text-2xl font-bold">{responses.filter(r => !r.isAiGenerated).length}</p>
              </div>
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{responses.filter(r => r.sentAt).length}</p>
              </div>
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading state
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No responses found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "No responses match your search criteria." : "No responses have been generated yet."}
            </p>
          </div>
        ) : (
          filteredResponses.map((response) => (
            <Card key={response.id} data-testid={`card-response-${response.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      Re: {response.email.subject}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>To: {response.email.senderName || response.email.sender}</span>
                      <Badge className={getPriorityColor(response.email.priority)}>
                        {response.email.priority}
                      </Badge>
                      <Badge className={getSentimentColor(response.email.sentiment)}>
                        {response.email.sentiment}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={response.isAiGenerated ? "default" : "secondary"}>
                      {response.isAiGenerated ? (
                        <><Bot className="w-3 h-3 mr-1" /> AI Generated</>
                      ) : (
                        <><User className="w-3 h-3 mr-1" /> Manual</>
                      )}
                    </Badge>
                    {response.sentAt ? (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Send className="w-3 h-3 mr-1" /> Sent
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" /> Draft
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {response.content}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Created {formatDistanceToNow(new Date(response.createdAt), { addSuffix: true })}
                  </span>
                  {response.sentAt && (
                    <span>
                      Sent {formatDistanceToNow(new Date(response.sentAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </div>
      </main>
      
      {showAnalytics && (
        <AnalyticsModal 
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
          data-testid="analytics-modal"
        />
      )}
    </div>
  );
}