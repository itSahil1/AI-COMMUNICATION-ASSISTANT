import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Phone, Building, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Email } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EmailCardProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}

export function EmailCard({ email, isSelected, onClick }: EmailCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'normal': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'neutral': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive';
      case 'normal': return 'bg-amber-400';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted-foreground';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(email.receivedAt), { addSuffix: true });

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer",
        isSelected && "ring-2 ring-primary",
        email.priority === 'urgent' && "border-l-4 border-l-destructive"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={getPriorityColor(email.priority)}>
              {email.priority.toUpperCase()}
            </Badge>
            <Badge variant="outline" className={getSentimentColor(email.sentiment)}>
              {email.sentiment.charAt(0).toUpperCase() + email.sentiment.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid={`text-time-${email.id}`}>
              {timeAgo}
            </span>
          </div>
          
          <h3 className="font-medium text-foreground mb-1 line-clamp-1" data-testid={`text-subject-${email.id}`}>
            {email.subject}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-2" data-testid={`text-sender-${email.id}`}>
            {email.senderName ? `${email.senderName} <${email.sender}>` : email.sender}
          </p>
          
          <p className="text-sm text-foreground line-clamp-2 mb-3" data-testid={`text-preview-${email.id}`}>
            {email.body.substring(0, 200)}...
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {email.extractedInfo?.phone && (
              <span className="flex items-center">
                <Phone className="mr-1 h-3 w-3" />
                {email.extractedInfo.phone}
              </span>
            )}
            {email.extractedInfo?.customerType && (
              <span className="flex items-center">
                <Building className="mr-1 h-3 w-3" />
                {email.extractedInfo.customerType}
              </span>
            )}
            {email.extractedInfo?.category && (
              <span className="flex items-center">
                <Tag className="mr-1 h-3 w-3" />
                {email.extractedInfo.category}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className={cn("w-3 h-3 rounded-full", getPriorityDot(email.priority))} />
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary/80 h-auto p-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // This will be handled by the parent component
            }}
            data-testid={`button-generate-${email.id}`}
          >
            <Bot className="mr-1 h-3 w-3" />
            Generate Response
          </Button>
        </div>
      </div>
    </div>
  );
}
