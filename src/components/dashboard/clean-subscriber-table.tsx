"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table";
import { Checkbox } from "@/registry/new-york-v4/ui/checkbox";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, ArrowUpDown, Eye } from "lucide-react";
import { SimpleSubscriberModal } from "./simple-subscriber-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";

export interface CleanSubscriber {
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

interface CleanSubscriberTableProps {
  subscribers: CleanSubscriber[];
  selectedSubscribers: number[];
  onSelectionChange: (selected: number[]) => void;
  onSort: (column: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

export function CleanSubscriberTable({
  subscribers,
  selectedSubscribers,
  onSelectionChange,
  onSort,
  sortColumn,
  sortDirection
}: CleanSubscriberTableProps) {
  const [selectedSubscriber, setSelectedSubscriber] = useState<CleanSubscriber | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(subscribers.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSubscribers, id]);
    } else {
      onSelectionChange(selectedSubscribers.filter(s => s !== id));
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 hover:bg-transparent"
      onClick={() => onSort(column)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedSubscribers.length === subscribers.length && subscribers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>
                <SortableHeader column="name">Name</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="creators_count">Creators</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="monthly_fee">Monthly Fee</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="payment_status">Status</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="last_payment_date">Last Payment</SortableHeader>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSubscribers.includes(subscriber.id)}
                    onCheckedChange={(checked) => handleSelectOne(subscriber.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{subscriber.name}</div>
                    <div className="text-sm text-muted-foreground">{subscriber.slug}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{subscriber.creators_count}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{formatCurrency(subscriber.monthly_fee)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    subscriber.payment_status === 'active' ? 'default' :
                    subscriber.payment_status === 'overdue' ? 'secondary' : 'destructive'
                  }>
                    {subscriber.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {subscriber.last_payment_date
                    ? formatDistanceToNow(new Date(subscriber.last_payment_date), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedSubscriber(subscriber)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Simple Modal */}
      {selectedSubscriber && (
        <SimpleSubscriberModal
          subscriber={selectedSubscriber}
          open={!!selectedSubscriber}
          onClose={() => setSelectedSubscriber(null)}
        />
      )}
    </>
  );
}

