"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/new-york-v4/ui/table";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/registry/new-york-v4/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { AlertCircle, TrendingUp, CreditCard, Users, DollarSign, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboard, type Transaction, type Agency, type DashboardMetrics } from "@/hooks/use-dashboard";

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Get badge variant for transaction status
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'processing':
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'refunded':
      return 'destructive';
    default:
      return 'outline';
  }
}

// Get badge variant for transaction type
function getTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'chat':
      return 'default';
    case 'script':
      return 'secondary';
    case 'media':
      return 'outline';
    case 'subscription':
      return 'default';
    default:
      return 'outline';
  }
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  trend 
}: { 
  title: string; 
  value: string; 
  description?: string; 
  icon?: any;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center text-xs text-green-600 mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Transaction Row Component
function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{transaction.id}</TableCell>
      <TableCell>
        <Badge variant={getTypeBadgeVariant(transaction.type)}>
          {transaction.type}
        </Badge>
      </TableCell>
      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
      <TableCell>{formatCurrency(transaction.fee)}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(transaction.status)}>
          {transaction.status}
        </Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {transaction.wallet_address ? 
          `${transaction.wallet_address.slice(0, 6)}...${transaction.wallet_address.slice(-4)}` : 
          '-'
        }
      </TableCell>
      <TableCell className="text-right">
        {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
      </TableCell>
    </TableRow>
  );
}

// Loading skeleton for metrics
function MetricsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[120px] mb-1" />
            <Skeleton className="h-3 w-[80px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Loading skeleton for table
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-10 flex-1" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dashboard data with 30-second polling
  const { data, error, isLoading, isError } = useDashboard();

  if (!mounted) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <MetricsSkeleton />
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest payment activity across all types</CardDescription>
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. {error?.message || 'Please try again later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate derived metrics
  const successRate = data?.successRate || 0;
  const totalRevenue = data?.totalRevenue || 0;
  const totalTransactions = data?.totalTransactions || 0;
  const mrr = data?.monthlyRecurringRevenue || 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="mr-1 h-3 w-3" />
            Live
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          description="All-time revenue"
          icon={DollarSign}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          description="Payment success rate"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Transactions"
          value={totalTransactions.toLocaleString()}
          description="All payment types"
          icon={CreditCard}
        />
        <MetricCard
          title="Monthly Recurring"
          value={formatCurrency(mrr)}
          description="MRR from subscriptions"
          icon={Users}
        />
      </div>

      {/* Transaction Type Breakdown */}
      {data?.transactionsByType && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Breakdown</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.transactionsByType).map(([type, count]) => (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <p className="text-xs text-muted-foreground capitalize">{type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest payment activity across all transaction types
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTransactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agency Subscribers</CardTitle>
              <CardDescription>
                Agencies with active subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.agencies && data.agencies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency Name</TableHead>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.agencies.map((agency) => (
                      <TableRow key={agency.id}>
                        <TableCell className="font-medium">{agency.name}</TableCell>
                        <TableCell className="text-xs">
                          {agency.wallet_address ? 
                            `${agency.wallet_address.slice(0, 6)}...${agency.wallet_address.slice(-4)}` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDistanceToNow(new Date(agency.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No agencies found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}