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
import { Progress } from "@/registry/new-york-v4/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  MoreHorizontal, ArrowUpDown, Eye, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Clock, DollarSign
} from "lucide-react";
import { EnhancedSubscriberModal } from "./enhanced-subscriber-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu";

export interface RealEnhancedSubscriber {
  id: number;
  name: string;
  slug: string;
  wallet_address: string;
  creators_count: number;
  subscription_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  // Real fields from your database
  health_score?: number;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  monthly_revenue?: number;
  lifetime_value?: number;
  referral_code?: string;
  // Calculated fields
  payment_status?: 'active' | 'overdue' | 'suspended';
  last_payment_date?: string;
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

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthScoreIcon = (score?: number) => {
    if (!score) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    if (score >= 40) return <TrendingDown className="h-4 w-4 text-orange-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getOnboardingBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
                <SortableHeader column="name">Agency</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="health_score">Health</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="monthly_revenue">Monthly Revenue</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="lifetime_value">Lifetime Value</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="creators_count">Creators</SortableHeader>
              </TableHead>
              <TableHead>
                <SortableHeader column="subscription_status">Status</SortableHeader>
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
                  <div className="flex items-center space-x-2">
                    {getHealthScoreIcon(subscriber.health_score)}
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${getHealthScoreColor(subscriber.health_score)}`}>
                        {subscriber.health_score ? `${subscriber.health_score}%` : 'N/A'}
                      </span>
                      {subscriber.health_score && (
                        <Progress value={subscriber.health_score} className="h-1 w-16" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(subscriber.monthly_revenue || 0)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {formatCurrency(subscriber.lifetime_value || 0)}
                    </span>
                    {subscriber.success_rate && (
                      <span className="text-xs text-muted-foreground">
                        {subscriber.success_rate}% success
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{subscriber.creators_count}</span>
                    <span className="text-xs text-muted-foreground">
                      ${subscriber.creators_count * 40}/mo
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
                      <DropdownMenuItem onClick={() => setSelectedSubscriber(subscriber)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>Process Payment</DropdownMenuItem>
                      <DropdownMenuItem>Update Health Score</DropdownMenuItem>
                      <DropdownMenuItem>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Enhanced Modal with real data */}
      {selectedSubscriber && (
        <EnhancedSubscriberModal
          subscriber={selectedSubscriber}
          open={!!selectedSubscriber}
          onClose={() => setSelectedSubscriber(null)}
        />
      )}
    </>
  );
}