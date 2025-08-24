"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Input } from "@/registry/new-york-v4/ui/input";
import { Skeleton } from "@/registry/new-york-v4/ui/skeleton";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { 
  Search, Users, DollarSign, TrendingUp, AlertCircle, 
  Building, Activity, Calendar, RefreshCw 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

export default function AgenciesPage() {
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agencies", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const response = await fetch(`/api/v1/subscribers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch agencies");
      return response.json();
    },
    refetchInterval: 30000,
  });

  if (!mounted) return null;

  const agencies = data?.subscribers || [];
  const totalAgencies = agencies.length;
  const activeAgencies = agencies.filter((a: any) => a.payment_status === 'active').length;
  const totalMRR = agencies
    .filter((a: any) => a.payment_status === 'active')
    .reduce((sum: number, a: any) => sum + (a.monthly_fee || 0), 0);
  const ETH_PRICE_USD = 3500;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agencies</h1>
          <p className="text-muted-foreground">Manage and monitor all agency accounts</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgencies}</div>
            <p className="text-xs text-muted-foreground">
              {activeAgencies} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMRR.toFixed(4)} ETH</div>
            <p className="text-xs text-muted-foreground">
              ${(totalMRR * ETH_PRICE_USD).toFixed(2)} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Agency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAgencies > 0 ? (totalMRR / activeAgencies).toFixed(4) : '0'} ETH
            </div>
            <p className="text-xs text-muted-foreground">
              ${activeAgencies > 0 ? ((totalMRR / activeAgencies) * ETH_PRICE_USD).toFixed(2) : '0.00'} USD
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
              {totalAgencies > 0 ? ((activeAgencies / totalAgencies) * 100).toFixed(1) : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Subscription active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agency List */}
      <Card>
        <CardHeader>
          <CardTitle>All Agencies</CardTitle>
          <CardDescription>
            Complete list of registered agencies and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agencies..."
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
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load agencies. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Agency Cards */}
          {!isLoading && !error && agencies.length > 0 ? (
            <div className="space-y-4">
              {agencies.map((agency: any) => (
                <div key={agency.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{agency.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agency.creators_count} creators • {(agency.monthly_fee || 0).toFixed(4)} ETH/month
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge 
                        variant={
                          agency.payment_status === 'active' ? 'default' :
                          agency.payment_status === 'inactive' ? 'secondary' : 'destructive'
                        }
                      >
                        {agency.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !isLoading && !error && (
            <div className="text-center py-8 text-muted-foreground">
              No agencies found. <a href="/dashboard/settings" className="text-primary hover:underline">Seed test data</a> to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}