"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { useState } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('6months');
  const { data, isLoading, error } = useAnalytics(timeRange);

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (error || !data) {
    return <div className="p-6">Failed to load analytics data</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Revenue and subscriber analytics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.activeSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue Per User</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.averageRevenuePerUser)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failure Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.failureRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="agencies">Top Agencies</TabsTrigger>
          <TabsTrigger value="trends">Growth Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Month</CardTitle>
              <CardDescription>Monthly revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agencies</CardTitle>
              <CardDescription>Agencies ranked by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topAgencies.slice(0, 10).map((agency, index) => (
                  <div key={agency.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agency.creators} creators • {agency.transactionCount} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(agency.revenue)}</div>
                      <Badge variant="outline">{agency.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
                <CardDescription>Month-over-month revenue change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.trends.revenueGrowth > 0 ? '+' : ''}{data.trends.revenueGrowth.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">vs previous month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New Subscribers</CardTitle>
                <CardDescription>Agencies that joined recently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.trends.newSubscribers}</div>
                <p className="text-sm text-muted-foreground">this month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Failures</CardTitle>
              <CardDescription>Failed payment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-lg font-bold text-red-600">{data.failureAnalysis.totalFailures}</div>
                  <p className="text-sm text-muted-foreground">Total failures</p>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{data.failureAnalysis.failureRate.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Failure rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}