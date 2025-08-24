'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Settings,
  BarChart,
  FileText,
  Webhook,
  TestTube,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Subscribers', href: '/dashboard/subscribers', icon: Users },
  { name: 'Transactions', href: '/dashboard/transactions', icon: CreditCard },
  { name: 'Agencies', href: '/dashboard/agencies', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Test Payments', href: '/test-payments', icon: TestTube },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}