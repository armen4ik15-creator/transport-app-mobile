/** Design tokens aligned with v0 Transportation app UI (dark Material 3). */
export const darkTheme = {
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#2C2C2C',
  primary: '#1A73E8',
  primaryMuted: '#1e3a5f',
  profit: '#00C853',
  loss: '#FF1744',
  warning: '#FB8C00',
  accent: '#7C4DFF',
  text: '#FFFFFF',
  textMuted: '#B0B0B0',
  border: '#333333',
  tabBar: '#1A1A1A',
  tabActive: '#1A73E8',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export type AppColors = typeof darkTheme;

/** Active palette — swap here to change the whole app look. */
export const colors: AppColors = darkTheme;
