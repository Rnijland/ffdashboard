"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { formatCurrency } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { 
  Download, Search, Filter, TrendingUp, TrendingDown, 
  DollarSign, CreditCard, AlertCircle, CheckCircle, 
  Clock, XCircle, RefreshCw, ArrowUpDown
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error, refetch } = useTransactions({
    search,
    status: statusFilter,
    type: typeFilter,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    sortBy,
    sortOrder
  });

  // Calculate summary metrics with null safety
  const transactions = data?.transactions || [];
  const summaryMetrics = {
    totalTransactions: transactions.length,
    totalVolume: transactions.reduce((sum, t) => sum + (t.status === 'completed' ? t.amount : 0), 0),
    successRate: transactions.length > 0 
      ? (transactions.filter(t => t.status === 'completed').length / transactions.length * 100)
      : 0,
    avgTransactionSize: transactions.filter(t => t.status === 'completed').length > 0
      ? transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0) / 
        transactions.filter(t => t.status === 'completed').length
      : 0,
    failedCount: transactions.filter(t => t.status === 'failed').length,
    pendingCount: transactions.filter(t => t.status === 'pending').length,
    totalFees: transactions.reduce((sum, t) => sum + (t.fee || 0), 0),
    netRevenue: transactions.reduce((sum, t) => sum + ((t.net_amount || 0)), 0)
  };

  // Prepare data for charts with null safety
  const statusDistribution = [
    { name: 'Completed', value: transactions.filter(t => t.status === 'completed').length },
    { name: 'Failed', value: transactions.filter(t => t.status === 'failed').length },
    { name: 'Pending', value: transactions.filter(t => t.status === 'pending').length }
  ];

  const paymentMethodDistribution = Object.entries(
    transactions.reduce((acc, t) => {
      acc[t.payment_method || 'unknown'] = (acc[t.payment_method || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([method, count]) => ({ name: method, value: count }));

  const exportTransactions = () => {
    if (!data?.transactions) return;
    
    const csv = [
      ['ID', 'Date', 'Agency', 'Amount', 'Fee', 'Net', 'Status', 'Type', 'Method'].join(','),
      ...data.transactions.map(t => [
        t.id,
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        t.agency,
        t.amount,
        t.fee || 0,
        t.net_amount || 0,
        t.status,
        t.type,
        t.payment_method
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Monitor and analyze all payment transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryMetrics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalVolume)}</div>
              <p className="text-xs text-muted-foreground">
                {summaryMetrics.totalTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryMetrics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {summaryMetrics.failedCount} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.avgTransactionSize)}</div>
              <p className="text-xs text-muted-foreground">
                Per successful payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.netRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                After {formatCurrency(summaryMetrics.totalFees)} fees
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Transaction List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="failures">Failed Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>View and manage all payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Table */}
              {isLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">Failed to load transactions</div>
              ) : transactions.length > 0 ? (
                <TransactionTable 
                  transactions={transactions}
                  onSort={(column) => {
                    if (column === sortBy) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(column);
                      setSortOrder('asc');
                    }
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found. <a href="/dashboard/settings" className="text-primary hover:underline">Seed test data</a> to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Transaction success vs failure rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="text-center py-8 text-muted-foreground">
            Transaction analytics coming soon...
          </div>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments Analysis</CardTitle>
              <CardDescription>Identify and resolve payment failures</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.transactions && data.transactions.filter(t => t.status === 'failed').length > 0 ? (
                <div className="space-y-4">
                  {data.transactions
                    .filter(t => t.status === 'failed')
                    .slice(0, 20)
                    .map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="font-medium">
                              Transaction #{transaction.id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            {formatCurrency(transaction.amount)}
                          </div>
                          <Badge variant="destructive">
                            {transaction.metadata?.failure_reason || 'Unknown error'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No failed transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}