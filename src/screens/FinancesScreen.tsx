import { useAuth } from '../auth/AuthContext';
import { AdminFinancesScreen } from './AdminFinancesScreen';
import { DriverFinancesScreen } from './DriverFinancesScreen';

export function FinancesScreen() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminFinancesScreen />;
  return <DriverFinancesScreen />;
}
