"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/registry/new-york-v4/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  DollarSign, Users, Calendar, FileText, Wallet, CreditCard
} from "lucide-react";
import type { CleanSubscriber } from "./clean-subscriber-table";

interface SimpleSubscriberModalProps {
  subscriber: CleanSubscriber;
  open: boolean;
  onClose: () => void;
}

export function SimpleSubscriberModal({
  subscriber,
  open,
  onClose
}: SimpleSubscriberModalProps) {

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
              <Button size="sm" variant="outline">
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
        <div className="grid gap-4 md:grid-cols-3 mt-4">
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
              <CardTitle className="text-sm">Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriber.creators_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">{subscriber.subscription_status}</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Agency Details */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Agency Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Wallet Address</span>
              <code className="text-xs">{subscriber.wallet_address}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Slug</span>
              <span className="text-sm">{subscriber.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Payment</span>
              <span className="text-sm">
                {subscriber.last_payment_date 
                  ? formatDistanceToNow(new Date(subscriber.last_payment_date), { addSuffix: true })
                  : 'Never'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-2 mt-4">
          <Button variant="outline">
            Suspend Subscription
          </Button>
          <Button variant="outline">
            Process Manual Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}