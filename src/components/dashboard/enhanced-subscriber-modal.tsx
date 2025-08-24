"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york-v4/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Progress } from "@/registry/new-york-v4/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { 
  DollarSign, Users, Calendar, Shield, Activity, 
  TrendingUp, AlertCircle, Clock, CreditCard, FileText, 
  Wallet, CheckCircle, XCircle, Copy, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import type { RealEnhancedSubscriber } from "./enhanced-real-subscriber-table";

interface EnhancedSubscriberModalProps {
  subscriber: RealEnhancedSubscriber;
  open: boolean;
  onClose: () => void;
}

interface TransactionData {
  id: number;
  created_at: string;
  amount: number;
  status: 'completed' | 'failed' | 'pending';
  type: string;
  payment_method: string;
}

export function EnhancedSubscriberModal({
  subscriber,
  open,
  onClose
}: EnhancedSubscriberModalProps) {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && subscriber.id) {
      fetchTransactionHistory();
    }
  }, [open, subscriber.id]);

  const fetchTransactionHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/transactions?agency=${subscriber.id}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getHealthScoreAnalysis = (score?: number) => {
    if (!score) return { label: 'Unknown', description: 'No health data available' };
    if (score >= 80) return { label: 'Excellent', description: 'Highly engaged, consistent payments' };
    if (score >= 60) return { label: 'Good', description: 'Regular activity, mostly successful' };
    if (score >= 40) return { label: 'Fair', description: 'Some issues, needs attention' };
    return { label: 'Poor', description: 'Multiple failed payments, at risk' };
  };

  const healthAnalysis = getHealthScoreAnalysis(subscriber.health_score);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>{subscriber.name}</span>
              <Badge variant={
                subscriber.subscription_status === 'active' ? 'default' :
                subscriber.subscription_status === 'suspended' ? 'destructive' : 'secondary'
              }>
                {subscriber.subscription_status}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(subscriber.wallet_address)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Wallet
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Agency ID: {subscriber.id} • Joined {formatDistanceToNow(new Date(subscriber.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        {/* Health Score Overview */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Health Score Analysis</span>
              <Badge variant={subscriber.health_score && subscriber.health_score >= 60 ? 'default' : 'destructive'}>
                {healthAnalysis.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {subscriber.health_score && subscriber.health_score >= 80 ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : subscriber.health_score && subscriber.health_score >= 40 ? (
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <div className="text-3xl font-bold">{subscriber.health_score || 0}%</div>
                    <p className="text-sm text-muted-foreground">{healthAnalysis.description}</p>
                  </div>
                </div>
                <Progress value={subscriber.health_score || 0} className="w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(subscriber.monthly_revenue || 0)}</div>
              <p className="text-xs text-muted-foreground">From {subscriber.creators_count} creators</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(subscriber.lifetime_value || 0)}</div>
              <p className="text-xs text-muted-foreground">Total revenue generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriber.success_rate || 100}%</div>
              <p className="text-xs text-muted-foreground">Payment success</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={
                subscriber.onboarding_status === 'completed' ? 'default' :
                subscriber.onboarding_status === 'in_progress' ? 'secondary' : 'outline'
              }>
                {subscriber.onboarding_status || 'pending'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agency Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Wallet Address</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs">{subscriber.wallet_address.slice(0, 20)}...</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(subscriber.wallet_address)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Referral Code</span>
                    <div className="font-medium">{subscriber.referral_code || 'None'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <div className="font-medium">
                      {format(new Date(subscriber.updated_at), 'PPP')}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Creator Count</span>
                    <div className="font-medium">{subscriber.creators_count} creators</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Last 10 transactions for this agency</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          {tx.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : tx.status === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          <div>
                            <div className="font-medium">{formatCurrency(tx.amount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            tx.status === 'completed' ? 'default' :
                            tx.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {tx.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {tx.payment_method}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No transactions found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Month</span>
                      <span className="font-medium">{formatCurrency(subscriber.monthly_revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Monthly</span>
                      <span className="font-medium">
                        {formatCurrency((subscriber.lifetime_value || 0) / 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projected Annual</span>
                      <span className="font-medium">
                        {formatCurrency((subscriber.monthly_revenue || 0) * 12)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Payment Success</span>
                      <span className="font-medium">{subscriber.success_rate || 100}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Failed Payments</span>
                      <span className="font-medium">{subscriber.failed_payments_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue per Creator</span>
                      <span className="font-medium">
                        {formatCurrency((subscriber.monthly_revenue || 0) / (subscriber.creators_count || 1))}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button variant="outline">
                    Update Subscription Status
                  </Button>
                  <Button variant="outline">
                    Process Manual Payment
                  </Button>
                  <Button variant="outline">
                    Recalculate Health Score
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Danger Zone
                  </p>
                  <Button variant="destructive">
                    Suspend Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}