/**
 * Vegapunk Dashboard - Main App Component
 * Real-time monitoring and control interface for the multi-agent system
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client';
import { SnackbarProvider } from 'notistack';

// Theme
import { theme } from './theme';

// Apollo Client
import { apolloClient } from './services/apollo';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';

// Pages
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AgentsPage } from './pages/Agents';
import { TasksPage } from './pages/Tasks';
import { CollaborationsPage } from './pages/Collaborations';
import { WorkflowsPage } from './pages/Workflows';
import { SystemPage } from './pages/System';
import { MetricsPage } from './pages/Metrics';
import { AnalyticsPage } from './pages/Analytics';
import { SettingsPage } from './pages/Settings';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ApolloProvider client={apolloClient}>
          <SnackbarProvider 
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <AuthProvider>
              <Router>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Private Routes */}
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Layout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="agents/*" element={<AgentsPage />} />
                    <Route path="tasks/*" element={<TasksPage />} />
                    <Route path="collaborations/*" element={<CollaborationsPage />} />
                    <Route path="workflows/*" element={<WorkflowsPage />} />
                    <Route path="system" element={<SystemPage />} />
                    <Route path="metrics" element={<MetricsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </SnackbarProvider>
        </ApolloProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;