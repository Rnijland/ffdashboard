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
import { Button } from "@/registry/new-york-v4/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowUpDown, ExternalLink, Copy, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/registry/new-york-v4/ui/dropdown-menu";
import { toast } from "sonner";

interface Transaction {
  id: number;
  created_at: string;
  thirdweb_transaction_id?: string;
  type: string;
  amount: number;
  fee?: number;
  net_amount?: number;
  status: 'completed' | 'failed' | 'pending';
  payment_method?: string;
  wallet_address?: string;
  agency?: number;
  creator?: number;
  metadata?: any;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onSort: (column: string) => void;
}

export function TransactionTable({ transactions, onSort }: TransactionTableProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Badge variant="outline">Subscription</Badge>;
      case 'one-time':
        return <Badge variant="outline">One-time</Badge>;
      case 'refund':
        return <Badge variant="destructive">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              <SortableHeader column="id">ID</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="created_at">Date</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="agency">Agency</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="type">Type</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="amount">Amount</SortableHeader>
            </TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net</TableHead>
            <TableHead>
              <SortableHeader column="status">Status</SortableHeader>
            </TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">#{transaction.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {format(new Date(transaction.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(transaction.created_at), 'HH:mm:ss')}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">Agency #{transaction.agency}</div>
                {transaction.creator && (
                  <div className="text-sm text-muted-foreground">
                    Creator #{transaction.creator}
                  </div>
                )}
              </TableCell>
              <TableCell>{getTypeBadge(transaction.type)}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.fee ? formatCurrency(transaction.fee) : '-'}
              </TableCell>
              <TableCell className="font-medium">
                {transaction.net_amount ? formatCurrency(transaction.net_amount) : 
                 formatCurrency(transaction.amount - (transaction.fee || 0))}
              </TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {transaction.payment_method || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyToClipboard(transaction.id.toString())}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy ID
                    </DropdownMenuItem>
                    {transaction.thirdweb_transaction_id && (
                      <DropdownMenuItem onClick={() => copyToClipboard(transaction.thirdweb_transaction_id!)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Thirdweb ID
                      </DropdownMenuItem>
                    )}
                    {transaction.wallet_address && (
                      <DropdownMenuItem onClick={() => copyToClipboard(transaction.wallet_address!)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Wallet
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </DropdownMenuItem>
                    {transaction.status === 'failed' && (
                      <DropdownMenuItem>
                        Retry Payment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}