"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { useAnalytics } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, CreditCard, 
  Activity, AlertCircle, Download, RefreshCw 
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, error, isLoading, isError, refetch } = useAnalytics(dateRange);

  if (!mounted) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExport = () => {
    if (!data) return;
    const csvContent = generateCSV(data);
    downloadCSV(csvContent, `analytics-${dateRange}.csv`);
  };

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. {error?.message || 'Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const growthRate = data?.growthRate || 0;
  const isPositiveGrowth = growthRate >= 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Revenue Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          description={`${isPositiveGrowth ? '+' : ''}${growthRate.toFixed(1)}% from last period`}
          icon={DollarSign}
          trend={growthRate}
        />
        <MetricCard
          title="Success Rate"
          value={`${(data?.successRate || 0).toFixed(1)}%`}
          description={`${data?.failedCount || 0} failed payments`}
          icon={Activity}
          trend={data?.successRateChange}
        />
        <MetricCard
          title="Total Transactions"
          value={(data?.totalTransactions || 0).toLocaleString()}
          description={`Across all payment types`}
          icon={CreditCard}
        />
        <MetricCard
          title="Avg Transaction Value"
          value={formatCurrency(data?.avgTransactionValue || 0)}
          description={`Per successful payment`}
          icon={TrendingUp}
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="agencies">Top Agencies</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="failures">Payment Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Type</CardTitle>
                <CardDescription>Distribution across all transaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.revenueByType || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(data?.revenueByType || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Transaction Volume by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
                <CardDescription>Number of transactions by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.transactionsByType || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Average Transaction Values */}
          <Card>
            <CardHeader>
              <CardTitle>Average Transaction Value by Type</CardTitle>
              <CardDescription>How much each payment type generates on average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data?.avgByType?.map((item) => (
                  <div key={item.type} className="text-center">
                    <div className="text-2xl font-bold">{formatCurrency(item.avg)}</div>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    <Badge variant="outline" className="mt-1">
                      {item.count} transactions
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Agencies</CardTitle>
              <CardDescription>Agencies ranked by revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topAgencies?.map((agency, index) => (
                  <div key={agency.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-muted-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{agency.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agency.creators || 0} creators • {agency.transactionCount || 0} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{formatCurrency(agency.revenue || 0)}</div>
                      <div className="text-sm text-muted-foreground">
                        {(((agency.revenue || 0) / (data?.summary?.totalRevenue || 1)) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue with growth rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(value as number);
                    return `${value}%`;
                  }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="growth" stroke="#82ca9d" name="Growth %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Failure Analysis</CardTitle>
              <CardDescription>Understanding why payments fail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Failure Rate by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.failuresByType?.map((item) => (
                        <div key={item.type} className="flex justify-between items-center py-2">
                          <span className="capitalize">{item.type}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={item.rate > 10 ? "destructive" : "secondary"}>
                              {item.rate.toFixed(1)}%
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              ({item.failed}/{item.total})
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Common Failure Reasons</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.failureReasons?.map((reason) => (
                        <div key={reason.reason} className="flex justify-between items-center py-2">
                          <span>{reason.reason}</span>
                          <Badge variant="outline">{reason.count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value, description, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend !== undefined && (
          <div className={`flex items-center text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}% change
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-[200px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-1" />
              <Skeleton className="h-3 w-[80px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function generateCSV(data: any) {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Total Revenue', data.totalRevenue],
    ['Success Rate', data.successRate],
    ['Total Transactions', data.totalTransactions],
    ['Average Transaction Value', data.avgTransactionValue],
  ];
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}