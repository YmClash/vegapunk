import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Tabs,
  Tab,
  Paper,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Fade
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Monitor as MonitorIcon,
  Analytics as AnalyticsIcon,
  Chat as ChatIcon,
  Science as ScienceIcon,
  Help as HelpIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Import our Shaka components
import { ShakaMonitor } from '../components/ShakaMonitor';
import { EthicalAnalysisInterface } from '../components/EthicalAnalysisInterface';
import { ShakaChat } from '../components/ShakaChat';
import { ShakaMetrics } from '../components/ShakaMetrics';

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
      id={`shaka-tabpanel-${index}`}
      aria-labelledby={`shaka-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={300}>
          <Box sx={{ pt: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `shaka-tab-${index}`,
    'aria-controls': `shaka-tabpanel-${index}`,
  };
}

export function ShakaAgentPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const tabs = [
    {
      label: 'Monitor',
      icon: <MonitorIcon />,
      description: 'Real-time agent status and controls'
    },
    {
      label: 'Analysis',
      icon: <ScienceIcon />,
      description: 'Ethical content analysis interface'
    },
    {
      label: 'Chat',
      icon: <ChatIcon />,
      description: 'Ethical conversation interface'
    },
    {
      label: 'Metrics',
      icon: <AnalyticsIcon />,
      description: 'Performance and analytics dashboard'
    }
  ];

  return (
    <Container maxWidth="xl">
      {/* Header Section */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🧠 ShakaAgent
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Ethics & Analysis Specialist - Autonomous Ethical Intelligence
            </Typography>
          </Box>
          <Box flexGrow={1} />
          <Tooltip title="ShakaAgent Information">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Feature Overview */}
        <Alert 
          severity="info" 
          icon={<PsychologyIcon />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2">
            <strong>ShakaAgent</strong> provides autonomous ethical analysis using multiple frameworks:
            <Box component="span" sx={{ ml: 1 }}>
              <Chip label="Utilitarian" size="small" variant="outlined" sx={{ mr: 0.5 }} />
              <Chip label="Deontological" size="small" variant="outlined" sx={{ mr: 0.5 }} />
              <Chip label="Virtue Ethics" size="small" variant="outlined" sx={{ mr: 0.5 }} />
              <Chip label="Care Ethics" size="small" variant="outlined" />
            </Box>
          </Typography>
        </Alert>
      </Box>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="ShakaAgent interface tabs"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none'
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              icon={tab.icon}
              label={
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {tab.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tab.description}
                  </Typography>
                </Box>
              }
              {...a11yProps(index)}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ShakaMonitor />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <EthicalAnalysisInterface />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <ShakaChat />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Box mb={3}>
              <ShakaMonitor />
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ShakaMetrics />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Footer Information */}
      <Box mt={6} mb={3}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                🎯 Core Capabilities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Multi-framework ethical analysis<br/>
                • Real-time monitoring and alerts<br/>
                • Autonomous conflict resolution<br/>
                • Proactive ethical guidance
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                🔬 Ethical Frameworks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Utilitarian:</strong> Greatest good for greatest number<br/>
                • <strong>Deontological:</strong> Duty-based ethical reasoning<br/>
                • <strong>Virtue Ethics:</strong> Character and moral virtues<br/>
                • <strong>Care Ethics:</strong> Relationships and caring
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom color="primary">
                ⚡ Real-time Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Automatic ethical query detection<br/>
                • Live performance metrics<br/>
                • Intelligent alert system<br/>
                • Continuous learning and adaptation
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Quick Help */}
      <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
        <HelpIcon color="disabled" sx={{ mr: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Need help? Try asking ethical questions in the Chat tab or analyze content in the Analysis tab.
        </Typography>
      </Box>
    </Container>
  );
}