import { Bot, BarChart3, Mail, MessageSquare, Settings, Gauge, User } from "lucide-react";

interface SidebarProps {
  onAnalyticsClick: () => void;
}

export function Sidebar({ onAnalyticsClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Communication Hub</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <a 
          href="#" 
          className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          data-testid="link-dashboard"
        >
          <Gauge className="w-4 h-4" />
          <span className="font-medium">Dashboard</span>
        </a>
        <a 
          href="#" 
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="link-emails"
        >
          <Mail className="w-4 h-4" />
          <span>Emails</span>
          <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full" data-testid="text-urgent-count">
            23
          </span>
        </a>
        <a 
          href="#" 
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="link-responses"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Responses</span>
        </a>
        <button 
          onClick={onAnalyticsClick}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          data-testid="button-analytics"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <a 
          href="#" 
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          data-testid="link-settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </a>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 px-3 py-2">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-user-name">
              Sarah Johnson
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
              Support Manager
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
