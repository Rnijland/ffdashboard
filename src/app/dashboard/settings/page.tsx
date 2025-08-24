"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Alert, AlertDescription } from "@/registry/new-york-v4/ui/alert";
import { Badge } from "@/registry/new-york-v4/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york-v4/ui/tabs";
import { Database, AlertCircle, CheckCircle, Loader2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    stats?: any;
  } | null>(null);

  const handleSeedDatabase = async () => {
    setSeedLoading(true);
    setSeedResult(null);

    try {
      const response = await fetch('/api/v1/seed/subscribers', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setSeedResult({
          success: true,
          message: data.message,
          stats: data.stats,
        });
      } else {
        setSeedResult({
          success: false,
          message: data.message || 'Failed to seed database',
        });
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Error seeding database: ' + (error instanceof Error ? error.message : 'Unknown error'),
      });
    } finally {
      setSeedLoading(false);
    }
  };

  const handleResetSeed = async () => {
    try {
      const response = await fetch('/api/v1/seed/subscribers', {
        method: 'DELETE',
      });

      const data = await response.json();
      setSeedResult({
        success: true,
        message: data.message,
      });
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Error resetting seed flag',
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="database" className="space-y-4">
        <TabsList>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="api">API Configuration</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Manage test data and database operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium">Seed Test Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Create 10 test agencies with realistic subscription data
                      </p>
                    </div>
                    <Database className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleSeedDatabase}
                      disabled={seedLoading}
                      size="sm"
                    >
                      {seedLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Seed Database
                    </Button>
                    <Button
                      onClick={handleResetSeed}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Seed Flag
                    </Button>
                  </div>

                  {seedResult && (
                    <Alert variant={seedResult.success ? "default" : "destructive"}>
                      {seedResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {seedResult.message}
                        {seedResult.stats && (
                          <div className="mt-2 text-xs">
                            Created {seedResult.stats.agencies_created} agencies and{' '}
                            {seedResult.stats.transactions_created} transactions
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Test Data Details</h3>
                    <p className="text-sm text-muted-foreground">
                      The seed operation will create:
                    </p>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 10 agencies with varying creator counts (1-15)</li>
                    <li>• Mix of payment statuses (active, overdue, suspended)</li>
                    <li>• Subscription transactions for active agencies</li>
                    <li>• Realistic payment history with proper timestamps</li>
                    <li>• Monthly fees calculated at $40 per creator</li>
                  </ul>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Seeding can only be done once per server session to prevent duplicates.
                      Use the Reset button if you need to seed again after a failed attempt.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                API endpoints and integration settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Xano API</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Thirdweb SDK</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Polling Interval</span>
                    <span className="text-sm text-muted-foreground">30 seconds</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Thirdweb webhook endpoint and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Webhook Endpoint</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      /api/webhooks/thirdweb
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Signature Verification</span>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Webhook Received</span>
                    <span className="text-sm text-muted-foreground">-</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}