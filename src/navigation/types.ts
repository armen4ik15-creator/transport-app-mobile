export type AdminTabParamList = {
  AdminHome: undefined;
  Contractors: undefined;
  Drivers: undefined;
  Expenses: undefined;
  Orders: undefined;
  RegistryReport: undefined;
  FinancesHub: undefined;
  AdminMore: undefined;
};

export type DriverTabParamList = {
  DriverHome: undefined;
  DriverOrders: undefined;
  FinancesHub: undefined;
  DriverMore: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminHome: undefined;
  Contractors: undefined;
  Drivers: undefined;
  Expenses: undefined;
  Orders: undefined;
  RegistryReport: undefined;
  FinancesHub: undefined;
  AdminMore: undefined;
  DriverHome: undefined;
  DriverOrders: undefined;
  DriverFinancesHub: undefined;
  DriverMore: undefined;
  OrderCreate: { templateId?: number } | undefined;
  OrderEdit: { id: number };
  Templates: undefined;
  OrderTemplates: undefined;
  OrderDetail: { id: number };
  Finances: undefined;
  AdminFinances: undefined;
  DriverFinances: undefined;
  Earnings: undefined;
  Salary: undefined;
  ContractorDebt: undefined;
  Materials: undefined;
  Vehicles: undefined;
  Waybills: undefined;
  Invoices: undefined;
  Notifications: undefined;
  ActivityLog: undefined;
  FinanceReport: undefined;
  CompleteProfile: undefined;
  Documents: undefined;
  Reports: undefined;
  TripCreate: { orderId: number };
  TripPhotos: undefined;
  ServerSetup: { reason?: string } | undefined;
};
