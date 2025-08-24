"use client";

import { useState } from "react";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york-v4/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Textarea } from "@/registry/new-york-v4/ui/textarea";
import { Input } from "@/registry/new-york-v4/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { 
  Edit, Save, Users, DollarSign, TrendingUp, X
} from "lucide-react";

export interface CleanSubscriber {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  creators_count: number;
  subscription_status: string;
  payment_status: 'active' | 'overdue' | 'suspended';
  created_at: string;
  onboarding_status?: string;
  monthly_fee?: number;
}

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
  const [notes, setNotes] = useState('');
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

  // Calculate ETH price in USD (approximate)
  const ETH_PRICE_USD = 3500; // You can fetch this from an API
  const monthlyFeeETH = subscriber.monthly_fee || 0;
  const monthlyFeeUSD = monthlyFeeETH * ETH_PRICE_USD;

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
            <Button size="sm" onClick={onClose} variant="outline">
              Close
            </Button>
          </DialogTitle>
          <DialogDescription>
            Agency ID: {subscriber.id} • Joined {formatDistanceToNow(new Date(parseInt(subscriber.created_at)), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriber.creators_count}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyFeeETH.toFixed(4)} ETH</div>
              <p className="text-xs text-muted-foreground">${monthlyFeeUSD.toFixed(2)} USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{subscriber.subscription_status}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{subscriber.payment_status}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="details" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Creators Count</span>
                  {isEditingCreators ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={creatorCount}
                        onChange={(e) => setCreatorCount(parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button size="sm" onClick={handleUpdateCreatorCount}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingCreators(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{subscriber.creators_count}</span>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingCreators(true)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Fee (ETH)</span>
                  <span className="font-medium">{monthlyFeeETH.toFixed(4)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Fee (USD)</span>
                  <span className="font-medium">${monthlyFeeUSD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subscription Status</span>
                  <Badge>{subscriber.subscription_status}</Badge>
                </div>
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
                  <Badge variant="outline">{subscriber.onboarding_status || 'Not Set'}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}