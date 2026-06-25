/**
 * Design tokens from design/transport-company-app-ref (globals.css).
 * Slate dark theme — единая палитра для всего приложения.
 */
export const darkTheme = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceElevated: '#243043',
  secondary: '#243043',
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  primaryMuted: 'rgba(59, 130, 246, 0.15)',
  profit: '#10b981',
  profitMuted: 'rgba(16, 185, 129, 0.2)',
  loss: '#ef4444',
  lossMuted: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  warningMuted: 'rgba(245, 158, 11, 0.2)',
  accent: '#8b5cf6',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
  input: '#334155',
  tabBar: 'rgba(30, 41, 59, 0.95)',
  tabActive: '#3b82f6',
  overlay: 'rgba(15, 23, 42, 0.75)',
} as const;

export type AppColors = typeof darkTheme;

export const colors: AppColors = darkTheme;
