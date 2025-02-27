import { AccountSelector } from '@/components/account-selector';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardShell } from '@/components/dashboard-shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DirectTokenForm } from '@/components/direct-token-form';
import { AccountManager } from '@/components/account-manager';

export default function Home() {
  return (
    <DashboardShell>
      <DashboardHeader 
        heading="Facebook Lead Forms Manager" 
        text="Manage and download lead data from your Facebook pages"
      />
      <div className="grid gap-4">
        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">Direct Token Access</TabsTrigger>
            <TabsTrigger value="accounts">Account Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="mt-4">
            <DirectTokenForm />
          </TabsContent>
          
          <TabsContent value="accounts" className="mt-4">
            <AccountManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}