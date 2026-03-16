import { PageContainer } from '../layout/PageContainer';
import { FinancialSettings } from './FinancialSettings';
import { CategoryManager } from './CategoryManager';
import { DataManagement } from './DataManagement';
import { BankConnection } from '../plaid/BankConnection';
import { PlaidInsights } from '../plaid/PlaidInsights';
import { Card } from '../ui/Card';

export function SettingsPage() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">Settings</h1>

      <BankConnection />
      <PlaidInsights />
      <FinancialSettings />
      <CategoryManager />
      <DataManagement />

      <Card className="text-center">
        <p className="text-sm text-text-muted">Unlock v1.0</p>
        <p className="text-xs text-text-muted mt-1">Your data is stored locally on this device.</p>
      </Card>
    </PageContainer>
  );
}
