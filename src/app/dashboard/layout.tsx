import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/icons';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <Sidebar>
          <SidebarHeader>
             <div className="flex items-center gap-2 p-2">
              <Logo className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold">BudgetWise</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <div className="p-2">
              <MainNav />
            </div>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-2">
              <UserNav />
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="w-full flex-1">
              {/* Future search bar */}
            </div>
            <AddTransactionDialog />
            <UserNav />
          </header>
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
