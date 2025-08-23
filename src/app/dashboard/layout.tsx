import { Sidebar } from '@/components/layout/sidebar';
import { Card } from '@/registry/new-york-v4/ui/card';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Card className="flex flex-col flex-grow h-full rounded-none border-r border-l-0 border-t-0 border-b-0">
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">FanFlow Admin</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </Card>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}