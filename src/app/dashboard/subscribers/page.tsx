"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { useSubscribers } from "@/hooks/use-subscribers";
import { Search, DollarSign, Users, AlertCircle, Filter, Download, Shield, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CleanSubscriberTable } from "@/components/dashboard/clean-subscriber-table";
import { AdvancedFilterPanel } from "@/components/dashboard/advanced-filter-panel";

export default function SubscribersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    revenueRange: 'all',
    creatorRange: 'all',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, error, isLoading, isError, refetch } = useSubscribers(debouncedSearch);

  if (!mounted) {
    return null;
  }

  // Calculate total MRR from active agencies
  const totalMRR = data?.subscribers
    ?.filter(s => s.payment_status === 'active')
    .reduce((sum, s) => sum + s.monthly_fee, 0) || 0;

  const activeCount = data?.subscribers?.filter(s => s.payment_status === 'active').length || 0;
  const totalCount = data?.subscribers?.length || 0;

  const exportSubscribers = (subscribers: any[]) => {
    if (!subscribers) return;
    
    const csv = [
      ['Agency Name', 'Creators', 'Monthly Fee', 'Status', 'Health Score', 'Last Payment', 'Created'],
      ...subscribers.map(s => [
        s.name,
        s.creators_count,
        s.monthly_fee,
        s.payment_status,
        s.health_score || 0,
        s.last_payment_date || 'Never',
        s.created_at
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Subscriber Management</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => exportSubscribers(data?.subscribers || [])}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced MRR Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMRR)}</div>
            <p className="text-xs text-muted-foreground">
              From {activeCount} active {activeCount === 1 ? 'agency' : 'agencies'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active, {totalCount - activeCount} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue per Agency</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCount > 0 ? formatCurrency(totalMRR / activeCount) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on active agencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSubscribers > 0 ? ((activeCount / totalSubscribers) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Active subscribers
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilterPanel 
          filters={filters} 
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Enhanced Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Subscribers</CardTitle>
          <CardDescription>
            Manage agency subscriptions and monitor payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by agency name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load subscriber data. {error?.message || 'Please try again later.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Subscriber Table */}
          {!isLoading && !isError && data && (
            <CleanSubscriberTable 
              subscribers={data.subscribers}
              selectedSubscribers={selectedSubscribers}
              onSelectionChange={setSelectedSubscribers}
              onSort={(column) => setFilters({...filters, sortBy: column, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'})}
              sortColumn={filters.sortBy}
              sortDirection={filters.sortOrder}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}