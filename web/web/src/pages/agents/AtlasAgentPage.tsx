/**
 * AtlasAgentPage - Complete Atlas Security Management Interface
 * Integrates all Atlas components in a unified dashboard
 * Part of Tri-Protocol Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  AutoMode as AutoModeIcon,
  Policy as PolicyIcon,
  Assessment as AssessmentIcon,
  Hub as HubIcon,
  Lan as LanIcon,
  Extension as ExtensionIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Import Atlas components
import { AtlasMonitor } from '../../components/agents/atlas/AtlasMonitor';
import { SecurityIncidentPanel } from '../../components/agents/atlas/SecurityIncidentPanel';
import { AutomationControlPanel } from '../../components/agents/atlas/AutomationControlPanel';
import { ComplianceReportViewer } from '../../components/agents/atlas/ComplianceReportViewer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`atlas-tabpanel-${index}`}
      aria-labelledby={`atlas-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface AtlasStatus {
  agent: string;
  version: string;
  state: string;
  uptime: number;
  security: {
    overallScore: number;
    threatsDetected: number;
    threatsNeutralized: number;
    incidentsResolved: number;
    falsePositiveRate: number;
  };
  automation: {
    tasksCompleted: number;
    averageResponseTime: number;
  };
  capabilities: {
    a2aEnabled: boolean;
    langGraphEnabled: boolean;
    mcpEnabled: boolean;
  };
  lastUpdate: string;
}

export function AtlasAgentPage() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [status, setStatus] = useState<AtlasStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAtlasStatus();
    const interval = setInterval(fetchAtlasStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAtlasStatus = async () => {
    try {
      const response = await fetch('/api/agents/atlas/status');
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch Atlas status:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getUptimeString = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'running': return 'success';
      case 'idle': return 'info';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading Atlas Agent...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 80, height: 80, bgcolor: theme.palette.primary.main }}>
                <ShieldIcon sx={{ fontSize: 48 }} />
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                Atlas Security Agent
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Advanced security and automation specialist protecting the Vegapunk ecosystem
              </Typography>
              {status && (
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Chip
                    label={`v${status.version}`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={status.state.toUpperCase()}
                    size="small"
                    color={getStateColor(status.state) as any}
                  />
                  <Chip
                    label={`Uptime: ${getUptimeString(status.uptime)}`}
                    size="small"
                  />
                </Box>
              )}
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  icon={<HubIcon />}
                  label="A2A"
                  color={status?.capabilities.a2aEnabled ? 'success' : 'default'}
                />
                <Chip
                  icon={<LanIcon />}
                  label="LangGraph"
                  color={status?.capabilities.langGraphEnabled ? 'success' : 'default'}
                />
                <Chip
                  icon={<ExtensionIcon />}
                  label="MCP"
                  color={status?.capabilities.mcpEnabled ? 'success' : 'default'}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Quick Stats */}
        {status && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Security Score
                  </Typography>
                  <Typography variant="h4" color={status.security.overallScore > 0.8 ? 'success.main' : 'warning.main'}>
                    {Math.round(status.security.overallScore * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Threats Neutralized
                  </Typography>
                  <Typography variant="h4">
                    {status.security.threatsNeutralized}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {status.security.threatsDetected} detected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Automation Tasks
                  </Typography>
                  <Typography variant="h4">
                    {status.automation.tasksCompleted}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Response Time
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(status.automation.averageResponseTime)}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Content Tabs */}
        <Paper elevation={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label="Security Monitor"
            />
            <Tab
              icon={<WarningIcon />}
              iconPosition="start"
              label="Incidents"
            />
            <Tab
              icon={<AutoModeIcon />}
              iconPosition="start"
              label="Automation"
            />
            <Tab
              icon={<PolicyIcon />}
              iconPosition="start"
              label="Compliance"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              <AtlasMonitor />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <SecurityIncidentPanel />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <AutomationControlPanel />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <ComplianceReportViewer />
            </TabPanel>
          </Box>
        </Paper>

        {/* Collaboration Notice */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Multi-Agent Security Collaboration Active
          </Typography>
          <Typography variant="body2">
            Atlas is actively collaborating with ShakaAgent for ethical security decisions and other agents
            for comprehensive system protection. All automated actions undergo ethical review before execution.
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
}