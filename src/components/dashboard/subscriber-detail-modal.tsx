"use client";

import { useState } from "react";
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
import { Textarea } from "@/registry/new-york-v4/ui/textarea";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Label } from "@/registry/new-york-v4/ui/label";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { 
  DollarSign, Users, Calendar, Shield, Activity, 
  MessageSquare, Edit, Save, X, TrendingUp, AlertCircle,
  Clock, CreditCard, FileText, Wallet
} from "lucide-react";
import { toast } from "sonner";
import type { CleanSubscriber } from "./clean-subscriber-table";

interface SubscriberDetailModalProps {
  subscriber: CleanSubscriber;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function SubscriberDetailModal({
  subscriber,
  open,
  onClose,
  onUpdate
}: SubscriberDetailModalProps) {
  const [notes, setNotes] = useState(subscriber.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [creatorCount, setCreatorCount] = useState(subscriber.creators_count);
  const [isEditingCreators, setIsEditingCreators] = useState(false);

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`/api/v1/subscribers/${subscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        toast.success("Notes updated successfully");
        setIsEditingNotes(false);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to update notes");
    }
  };

  const handleUpdateCreatorCount = async () => {
    try {
      const response = await fetch(`/api/v1/subscribers/${subscriber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creators_count: creatorCount })
      });

      if (response.ok) {
        toast.success("Creator count updated");
        setIsEditingCreators(false);
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to update creator count");
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Payment history would come from real transaction data

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span>{subscriber.name}</span>
              <Badge variant={
                subscriber.payment_status === 'active' ? 'default' :
                subscriber.payment_status === 'overdue' ? 'secondary' : 'destructive'
              }>
                {subscriber.payment_status}
              </Badge>
            </div>
            <div className="flex space-x-2">
              <Button size="sm">
                <Wallet className="mr-2 h-4 w-4" />
                View Wallet
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            Agency ID: {subscriber.id} • Joined {formatDistanceToNow(new Date(subscriber.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(subscriber.monthly_fee)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lifetime Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(subscriber.lifetime_value || subscriber.monthly_fee * 6)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthScoreColor(subscriber.health_score)}`}>
                {subscriber.health_score || 75}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriber.creators_count}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Internal Notes</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                  >
                    {isEditingNotes ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this subscriber..."
                      rows={4}
                    />
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Notes
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {notes || "No notes added yet."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Agency Details */}
            <Card>
              <CardHeader>
                <CardTitle>Agency Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wallet Address</span>
                  <code className="text-xs">{subscriber.wallet_address}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Onboarding Status</span>
                  <Badge variant="outline">{subscriber.onboarding_status || 'completed'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Security Rating</span>
                  <Badge variant={
                    subscriber.security_rating === 'high' ? 'destructive' :
                    subscriber.security_rating === 'medium' ? 'secondary' : 'default'
                  }>
                    <Shield className="mr-1 h-3 w-3" />
                    {subscriber.security_rating || 'low'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed Payments</span>
                  <span className="text-sm">{subscriber.failed_payments_count || 0}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Transaction history for this agency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(payment.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>All activities for this subscriber</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Creator Count</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {isEditingCreators ? (
                      <>
                        <Input
                          type="number"
                          value={creatorCount}
                          onChange={(e) => setCreatorCount(parseInt(e.target.value))}
                          className="w-32"
                        />
                        <Button size="sm" onClick={handleUpdateCreatorCount}>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          setIsEditingCreators(false);
                          setCreatorCount(subscriber.creators_count);
                        }}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{creatorCount}</span>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingCreators(true)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly fee: {formatCurrency(creatorCount * 40)}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      Suspend Subscription
                    </Button>
                    <Button variant="outline">
                      Process Manual Payment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}