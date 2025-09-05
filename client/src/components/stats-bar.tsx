import { useQuery } from "@tanstack/react-query";
import { Mail, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

export function StatsBar() {
  const { data: stats = { totalToday: 0, urgent: 0, resolved: 0, pending: 0 } } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="bg-card border-b border-border p-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Today</p>
              <p className="text-lg font-semibold text-foreground" data-testid="text-total-today">
                {stats.totalToday}
              </p>
            </div>
            <Mail className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Urgent</p>
              <p className="text-lg font-semibold text-destructive" data-testid="text-urgent">
                {stats.urgent}
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-lg font-semibold text-green-600" data-testid="text-resolved">
                {stats.resolved}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>
        <div className="bg-background rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold text-amber-600" data-testid="text-pending">
                {stats.pending}
              </p>
            </div>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
