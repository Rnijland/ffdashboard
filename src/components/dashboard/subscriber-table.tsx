"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface Subscriber {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  creators_count: number;
  monthly_fee: number;
  payment_status: 'active' | 'overdue' | 'suspended';
  last_payment_date?: string;
  subscription_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

interface SubscriberTableProps {
  subscribers: Subscriber[];
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" {
  switch (status) {
    case 'active':
      return 'default';
    case 'overdue':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function SubscriberTable({ subscribers }: SubscriberTableProps) {
  if (!subscribers || subscribers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No subscribers found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agency Name</TableHead>
          <TableHead>Creators</TableHead>
          <TableHead>Monthly Fee</TableHead>
          <TableHead>Payment Status</TableHead>
          <TableHead>Last Payment</TableHead>
          <TableHead>Wallet</TableHead>
          <TableHead className="text-right">Member Since</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {subscribers.map((subscriber) => (
          <TableRow key={subscriber.id}>
            <TableCell className="font-medium">{subscriber.name}</TableCell>
            <TableCell>{subscriber.creators_count}</TableCell>
            <TableCell>{formatCurrency(subscriber.monthly_fee)}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(subscriber.payment_status)}>
                {subscriber.payment_status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {subscriber.last_payment_date
                ? formatDistanceToNow(new Date(subscriber.last_payment_date), { addSuffix: true })
                : 'Never'}
            </TableCell>
            <TableCell className="text-xs">
              {subscriber.wallet_address
                ? `${subscriber.wallet_address.slice(0, 6)}...${subscriber.wallet_address.slice(-4)}`
                : '-'}
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(subscriber.created_at), { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}