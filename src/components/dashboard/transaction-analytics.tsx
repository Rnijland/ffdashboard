"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format, startOfDay, subDays } from "date-fns";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface Transaction {
  id: number;
  created_at: string;
  amount: number;
  fee?: number;
  status: 'completed' | 'failed' | 'pending';
  type: string;
  payment_method?: string;
}

interface TransactionAnalyticsProps {
  transactions: Transaction[];
}

export function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
  // Group transactions by day for the last 30 days
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    const dateStr = format(date, 'MMM dd');
    
    const dayTransactions = transactions.filter(t => {
      const tDate = startOfDay(new Date(t.created_at));
      return tDate.getTime() === date.getTime();
    });
    
    dailyData.push({
      date: dateStr,
      volume: dayTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0),
      transactions: dayTransactions.length,
      successful: dayTransactions.filter(t => t.status === 'completed').length,
      failed: dayTransactions.filter(t => t.status === 'failed').length,
      fees: dayTransactions.reduce((sum, t) => sum + (t.fee || 0), 0)
    });
  }

  // Calculate cumulative revenue
  let cumulative = 0;
  const cumulativeData = dailyData.map(day => {
    cumulative += day.volume;
    return {
      ...day,
      cumulative
    };
  });

  // Group by payment type
  const typeBreakdown = transactions.reduce((acc, t) => {
    if (t.status === 'completed') {
      acc[t.type] = (acc[t.type] || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate hourly distribution
  const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = transactions.filter(t => {
      const tHour = new Date(t.created_at).getHours();
      return tHour === hour;
    });
    return {
      hour: `${hour}:00`,
      count: hourTransactions.length,
      volume: hourTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0)
    };
  });

  // Find peak hours
  const peakHour = hourlyDistribution.reduce((max, current) => 
    current.count > max.count ? current : max
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Transaction Volume</CardTitle>
            <CardDescription>Revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success vs Failure Rate</CardTitle>
            <CardDescription>Daily transaction outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="successful" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Successful"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
            <CardDescription>Breakdown by transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(typeBreakdown).map(([type, amount]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{type}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Activity</CardTitle>
            <CardDescription>Busiest time of day</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-2xl font-bold">{peakHour.hour}</div>
              <p className="text-sm text-muted-foreground">
                {peakHour.count} transactions
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(peakHour.volume)} volume
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cumulative Revenue</CardTitle>
            <CardDescription>Total over 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(cumulative)}
              </div>
              <p className="text-sm text-muted-foreground">
                {transactions.filter(t => t.status === 'completed').length} successful transactions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Transaction Pattern</CardTitle>
          <CardDescription>Transaction volume by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} transactions`, 'Count']} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}