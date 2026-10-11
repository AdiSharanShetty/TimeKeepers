import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './AdminTheme.css';

// VISUAL ONLY. Admin-wide MUI theme: dark + gold to match the site palette
// (gold #cf9d3f on near-black #14120f, same as AuthRedesign.css). Wrapping the
// admin routes in this provider also restyles components that render in React
// portals (Dialogs, Select menus), which scoped CSS cannot reach. No data,
// fetching, or rendering logic is changed anywhere.
const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#cf9d3f', light: '#e0b563', dark: '#a97f2f', contrastText: '#14120f' },
    secondary: { main: '#e08d6f', light: '#f0a98c', dark: '#c97457', contrastText: '#14120f' },
    success: { main: '#66bb6a' },
    warning: { main: '#ffb74d' },
    error: { main: '#ef5350' },
    info: { main: '#64b5f6' },
    background: { default: '#14120f', paper: '#1d1a15' },
    text: { primary: '#f4efe3', secondary: 'rgba(244, 239, 227, 0.62)' },
    divider: 'rgba(224, 181, 99, 0.16)',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
    h4: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(224, 181, 99, 0.25)',
          backgroundImage: 'none',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { color: '#e0b563', fontWeight: 700 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10 } },
    },
    MuiTableCell: {
      styleOverrides: { head: { fontWeight: 600, color: '#e0b563' } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
  },
});

const AdminTheme = ({ children }) => (
  <ThemeProvider theme={adminTheme}>{children}</ThemeProvider>
);

export default AdminTheme;