import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { WeeklyAnalytics } from "@/lib/types";

interface AnalyticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SENTIMENT_COLORS = {
  positive: 'hsl(142 76% 36%)',
  neutral: 'hsl(217 91% 60%)',
  negative: 'hsl(0 84% 60%)',
};

export function AnalyticsModal({ open, onOpenChange }: AnalyticsModalProps) {
  const { data: analytics } = useQuery<WeeklyAnalytics>({
    queryKey: ['/api/analytics/weekly'],
    enabled: open,
  });

  const { data: sentimentData } = useQuery<{
    positive: number;
    neutral: number; 
    negative: number;
  }>({
    queryKey: ['/api/analytics/sentiment'],
    enabled: open,
  });

  if (!analytics || !sentimentData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Email Analytics Dashboard</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading analytics...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const pieData = [
    { name: 'Positive', value: sentimentData.positive, color: SENTIMENT_COLORS.positive },
    { name: 'Neutral', value: sentimentData.neutral, color: SENTIMENT_COLORS.neutral },
    { name: 'Negative', value: sentimentData.negative, color: SENTIMENT_COLORS.negative },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Analytics Dashboard</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Email Volume (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(217 91% 60%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(217 91% 60%)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sentiment Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Response Time Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Response Time (minutes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="avgTime" 
                    fill="hsl(217 91% 60%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.categoryData.slice(0, 5).map((category, index) => {
                  const maxCount = Math.max(...analytics.categoryData.map(c => c.count));
                  const percentage = (category.count / maxCount) * 100;
                  
                  return (
                    <div key={category.category} className="flex items-center justify-between">
                      <span className="text-sm text-foreground min-w-0 flex-1 truncate">
                        {category.category}
                      </span>
                      <div className="flex items-center space-x-2 ml-4">
                        <Progress value={percentage} className="w-20 h-2" />
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {category.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
