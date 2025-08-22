/**
 * FanFlow Payment Gateway - Main Page
 * Next.js 15 starter with shadcn/ui components
 */
const Page = () => {
    return (
        <main className="min-h-screen bg-background flex items-center justify-center">
            <div className="container mx-auto px-4 text-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tight">
                    FanFlow Payment Gateway
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Next.js 15 foundation ready for payment processing development
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                    <span>✅ Next.js 15 + App Router</span>
                    <span>✅ TypeScript Strict Mode</span>
                    <span>✅ shadcn/ui Components</span>
                    <span>✅ Thirdweb SDK v5</span>
                    <span>✅ TanStack Query</span>
                    <span>✅ Zustand</span>
                </div>
            </div>
        </main>
    );
};

export default Page;
