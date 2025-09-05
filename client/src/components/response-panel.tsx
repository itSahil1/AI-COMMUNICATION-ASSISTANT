import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Phone, Clock, Tag, TriangleAlert, Save, Send, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Email, Response } from "@/lib/types";

interface ResponsePanelProps {
  selectedEmail: Email | null;
  onEmailUpdate: (email: Email) => void;
}

export function ResponsePanel({ selectedEmail, onEmailUpdate }: ResponsePanelProps) {
  const [responseContent, setResponseContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: responses = [] } = useQuery<Response[]>({
    queryKey: ['/api/emails', selectedEmail?.id, 'responses'],
    enabled: !!selectedEmail,
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await fetch(`/api/emails/${emailId}/generate-response`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate response');
      return response.json();
    },
    onSuccess: (data) => {
      setResponseContent(data.content);
      setIsGenerating(false);
      toast({
        title: "Response Generated",
        description: "AI response has been generated successfully.",
      });
    },
    onError: () => {
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ emailId, content }: { emailId: string; content: string }) => {
      const response = await fetch(`/api/emails/${emailId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isAiGenerated: true }),
      });
      if (!response.ok) throw new Error('Failed to save response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: "Draft Saved",
        description: "Response has been saved as draft.",
      });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async ({ emailId, content }: { emailId: string; content: string }) => {
      const response = await fetch(`/api/emails/${emailId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          isAiGenerated: true, 
          sentAt: new Date().toISOString() 
        }),
      });
      if (!response.ok) throw new Error('Failed to send response');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      setResponseContent("");
      toast({
        title: "Response Sent",
        description: "Response has been sent successfully.",
      });
    },
  });

  const handleGenerateResponse = () => {
    if (!selectedEmail) return;
    setIsGenerating(true);
    generateResponseMutation.mutate(selectedEmail.id);
  };

  const handleSaveAsDraft = () => {
    if (!selectedEmail || !responseContent.trim()) return;
    saveResponseMutation.mutate({
      emailId: selectedEmail.id,
      content: responseContent,
    });
  };

  const handleSendResponse = () => {
    if (!selectedEmail || !responseContent.trim()) return;
    sendResponseMutation.mutate({
      emailId: selectedEmail.id,
      content: responseContent,
    });
  };

  if (!selectedEmail) {
    return (
      <div className="w-96 bg-card border-l border-border flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select an Email</h3>
          <p className="text-sm">Choose an email to view details and generate responses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">AI Response Generator</h3>
        <p className="text-sm text-muted-foreground">Review and edit generated responses</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Email Summary */}
        <div className="bg-background rounded-lg p-3 border border-border">
          <h4 className="font-medium text-foreground mb-2">Selected Email</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">From:</span>{" "}
              <span data-testid="text-selected-sender">{selectedEmail.sender}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Subject:</span>{" "}
              <span data-testid="text-selected-subject" className="line-clamp-1">
                {selectedEmail.subject}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Priority:</span>
              <Badge 
                variant={selectedEmail.priority === 'urgent' ? 'destructive' : 'secondary'}
                data-testid="badge-selected-priority"
              >
                {selectedEmail.priority}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground">Sentiment:</span>
              <Badge 
                variant="outline"
                data-testid="badge-selected-sentiment"
              >
                {selectedEmail.sentiment}
              </Badge>
            </div>
          </div>
        </div>

        {/* Extracted Information */}
        {selectedEmail.extractedInfo && (
          <div className="bg-background rounded-lg p-3 border border-border">
            <h4 className="font-medium text-foreground mb-2">Extracted Information</h4>
            <div className="space-y-2 text-sm">
              {selectedEmail.extractedInfo.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="text-muted-foreground w-4 h-4" />
                  <span data-testid="text-extracted-phone">{selectedEmail.extractedInfo.phone}</span>
                </div>
              )}
              
              {selectedEmail.extractedInfo.urgencyIndicators && selectedEmail.extractedInfo.urgencyIndicators.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Clock className="text-muted-foreground w-4 h-4" />
                  <span data-testid="text-extracted-urgency">
                    {selectedEmail.extractedInfo.urgencyIndicators.join(", ")}
                  </span>
                </div>
              )}
              
              {selectedEmail.extractedInfo.category && (
                <div className="flex items-center space-x-2">
                  <Tag className="text-muted-foreground w-4 h-4" />
                  <span data-testid="text-extracted-category">{selectedEmail.extractedInfo.category}</span>
                </div>
              )}
              
              {selectedEmail.extractedInfo.keywords && selectedEmail.extractedInfo.keywords.length > 0 && (
                <div className="flex items-center space-x-2">
                  <TriangleAlert className="text-muted-foreground w-4 h-4" />
                  <span className="text-xs" data-testid="text-extracted-keywords">
                    {selectedEmail.extractedInfo.keywords.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* AI Response Generator */}
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Generated Response</h4>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleGenerateResponse}
              disabled={isGenerating}
              data-testid="button-regenerate"
            >
              <RotateCcw className={`mr-1 h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
          
          <div className="relative">
            <Textarea 
              className="w-full h-48 p-3 border border-border rounded-md bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-ring focus:border-transparent" 
              placeholder="AI-generated response will appear here..."
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              data-testid="textarea-response"
            />
            
            {isGenerating && (
              <div className="absolute inset-0 bg-background/80 rounded-md flex items-center justify-center">
                <div className="flex items-center space-x-2 text-primary">
                  <Bot className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Generating response...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Actions */}
        <div className="flex space-x-2">
          <Button 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium" 
            onClick={handleSendResponse}
            disabled={!responseContent.trim() || sendResponseMutation.isPending}
            data-testid="button-send"
          >
            <Send className="mr-2 h-4 w-4" />
            {sendResponseMutation.isPending ? 'Sending...' : 'Send Response'}
          </Button>
          <Button 
            variant="outline"
            onClick={handleSaveAsDraft}
            disabled={!responseContent.trim() || saveResponseMutation.isPending}
            data-testid="button-save"
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Previous Responses */}
        {responses.length > 0 && (
          <div>
            <Separator className="mb-4" />
            <h4 className="font-medium text-foreground mb-2">Previous Responses ({responses.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {responses.map((response) => (
                <div key={response.id} className="text-xs p-2 bg-muted/50 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">
                      {response.sentAt ? 'Sent' : 'Draft'}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(response.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="line-clamp-2">{response.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
