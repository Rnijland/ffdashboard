"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Label } from "@/registry/new-york-v4/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/registry/new-york-v4/ui/select";
import { Slider } from "@/registry/new-york-v4/ui/slider";
import { X, RotateCcw } from "lucide-react";

interface FilterPanelProps {
  filters: {
    status: string;
    revenueRange: string;
    creatorRange: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  onClose: () => void;
}

export function AdvancedFilterPanel({ filters, onFiltersChange, onClose }: FilterPanelProps) {
  const handleReset = () => {
    onFiltersChange({
      status: 'all',
      revenueRange: 'all',
      creatorRange: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Advanced Filters</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Range */}
          <div className="space-y-2">
            <Label>Monthly Revenue</Label>
            <Select 
              value={filters.revenueRange} 
              onValueChange={(value) => onFiltersChange({ ...filters, revenueRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All ranges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="0-100">$0 - $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="1000+">$1,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creator Count Range */}
          <div className="space-y-2">
            <Label>Creator Count</Label>
            <Select 
              value={filters.creatorRange} 
              onValueChange={(value) => onFiltersChange({ ...filters, creatorRange: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All ranges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranges</SelectItem>
                <SelectItem value="1-5">1-5 creators</SelectItem>
                <SelectItem value="6-10">6-10 creators</SelectItem>
                <SelectItem value="11-20">11-20 creators</SelectItem>
                <SelectItem value="20+">20+ creators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <div className="flex space-x-2">
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="monthly_fee">Revenue</SelectItem>
                  <SelectItem value="creators_count">Creators</SelectItem>
                  <SelectItem value="last_payment">Last Payment</SelectItem>
                  <SelectItem value="health_score">Health Score</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}