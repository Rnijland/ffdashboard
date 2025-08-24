"use client";

import { useState } from "react";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Checkbox } from "@/registry/new-york-v4/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/new-york-v4/ui/table";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { SubscriberDetailModal } from "./subscriber-detail-modal";

export interface RealEnhancedSubscriber {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  creators_count: number;
  subscription_status: 'active' | 'inactive' | 'suspended';
  payment_status: 'active' | 'overdue' | 'suspended';
  created_at: string;
  updated_at: number;
  onboarding_status?: string;
  monthly_fee?: number;
  last_payment_date?: number;
  failed_payments_count?: number;
  success_rate?: number;
}

interface EnhancedRealSubscriberTableProps {
  subscribers: RealEnhancedSubscriber[];
  selectedSubscribers: number[];
  onSelectionChange: (selected: number[]) => void;
  onSort: (column: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

export function EnhancedRealSubscriberTable({
  subscribers,
  selectedSubscribers,
  onSelectionChange,
  onSort,
  sortColumn,
  sortDirection
}: EnhancedRealSubscriberTableProps) {
  const [selectedSubscriber, setSelectedSubscriber] = useState<RealEnhancedSubscriber | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const ETH_PRICE_USD = 3500; // You can fetch this from an API

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
      onSelectionChange(selectedSubscribers.filter(subId => subId !== id));
    }
  };

  const openDetails = (subscriber: RealEnhancedSubscriber) => {
    setSelectedSubscriber(subscriber);
    setDetailsOpen(true);
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(column)}
      className="h-8 px-2 lg:px-3"
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const getOnboardingBadge = (status?: string) => {
    if (!status || status === '') return <Badge variant="outline">Not Set</Badge>;
    
    const variants: Record<string, any> = {
      'completed': 'default',
      'in_progress': 'secondary',
      'pending': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <>
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
              <SortableHeader column="name">Agency</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="monthly_fee">Monthly Fee</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="creators_count">Creators</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="subscription_status">Status</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="payment_status">Payment</SortableHeader>
            </TableHead>
            <TableHead>Onboarding</TableHead>
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
                <div className="flex flex-col">
                  <span className="font-medium">
                    {(subscriber.monthly_fee || 0).toFixed(4)} ETH
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ${((subscriber.monthly_fee || 0) * ETH_PRICE_USD).toFixed(2)} USD
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{subscriber.creators_count}</span>
                  <span className="text-xs text-muted-foreground">
                    {subscriber.creators_count * 0.004} ETH/mo
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={
                  subscriber.subscription_status === 'active' ? 'default' :
                  subscriber.subscription_status === 'suspended' ? 'destructive' : 'secondary'
                }>
                  {subscriber.subscription_status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={
                  subscriber.payment_status === 'active' ? 'default' :
                  subscriber.payment_status === 'overdue' ? 'secondary' : 'destructive'
                }>
                  {subscriber.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                {getOnboardingBadge(subscriber.onboarding_status)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openDetails(subscriber)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon")}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Agency
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => toast.info("Suspend feature coming soon")}
                    >
                      Suspend Agency
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedSubscriber && (
        <SubscriberDetailModal
          subscriber={{
            ...selectedSubscriber,
            payment_status: selectedSubscriber.payment_status as 'active' | 'overdue' | 'suspended'
          }}
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedSubscriber(null);
          }}
          onUpdate={() => {
            // Refresh data if needed
          }}
        />
      )}
    </>
  );
}