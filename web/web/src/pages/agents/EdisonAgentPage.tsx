/**
 * Edison Agent Page
 * Main interface for Edison innovation and logic agent
 */

import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  Breadcrumbs,
  Link,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
  Science as ScienceIcon,
  Engineering as EngineeringIcon,
  AutoAwesome as InnovationIcon
} from '@mui/icons-material';

// Import Edison components
import { EdisonMonitor } from '@components/agents/edison/EdisonMonitor';
import { ProblemAnalysisPanel } from '@components/agents/edison/ProblemAnalysisPanel';
import { SolutionExplorer } from '@components/agents/edison/SolutionExplorer';
import { LogicReasoningView } from '@components/agents/edison/LogicReasoningView';

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
      id={`edison-tabpanel-${index}`}
      aria-labelledby={`edison-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `edison-tab-${index}`,
    'aria-controls': `edison-tabpanel-${index}`,
  };
}

export function EdisonAgentPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedProblemId, setSelectedProblemId] = useState<string | undefined>();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProblemAnalysis = (problemId: string) => {
    setSelectedProblemId(problemId);
    setActiveTab(2); // Switch to Solutions tab
  };

  const handleSolutionImplement = (solutionId: string) => {
    console.log('Implementing solution:', solutionId);
    // Implementation logic here
  };

  const handleSolutionRefine = (solutionId: string) => {
    console.log('Refining solution:', solutionId);
    setActiveTab(1); // Go back to Problem Analysis
  };

  const handleSolutionCollaborate = (solutionId: string) => {
    console.log('Collaborating on solution:', solutionId);
    // Could navigate to collaboration interface
  };

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Dashboard
          </Link>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/agents');
            }}
          >
            Agents
          </Link>
          <Typography color="text.primary">Edison</Typography>
        </Breadcrumbs>

        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <InnovationIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Edison - Innovation & Logic Agent
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Advanced problem-solving through creative innovation and logical reasoning
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1}>
          <Chip 
            label="Innovation Engine" 
            color="primary" 
            variant="outlined"
            icon={<LightbulbIcon />}
          />
          <Chip 
            label="Multi-Paradigm Logic" 
            color="secondary" 
            variant="outlined"
            icon={<PsychologyIcon />}
          />
          <Chip 
            label="Problem Solver" 
            color="success" 
            variant="outlined"
            icon={<EngineeringIcon />}
          />
          <Chip 
            label="Research Automation" 
            color="info" 
            variant="outlined"
            icon={<ScienceIcon />}
          />
        </Box>
      </Box>

      {/* Main Content */}
      <Paper 
        sx={{ 
          borderRadius: 2,
          boxShadow: theme.shadows[2],
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02)
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="Edison agent tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
              }
            }}
          >
            <Tab 
              label="Overview" 
              icon={<DashboardIcon />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Problem Analysis" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label="Solution Explorer" 
              icon={<LightbulbIcon />} 
              iconPosition="start"
              {...a11yProps(2)} 
            />
            <Tab 
              label="Logic Reasoning" 
              icon={<PsychologyIcon />} 
              iconPosition="start"
              {...a11yProps(3)} 
            />
            <Tab 
              label="Research Lab" 
              icon={<ScienceIcon />} 
              iconPosition="start"
              {...a11yProps(4)} 
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <EdisonMonitor />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <ProblemAnalysisPanel
              onAnalysisComplete={(decomposition) => {
                console.log('Analysis complete:', decomposition);
                // Could automatically switch to solutions tab
              }}
              onSolveSubProblem={(subProblemId) => {
                console.log('Solving sub-problem:', subProblemId);
                handleProblemAnalysis(subProblemId);
              }}
              onDelegateSubProblem={(subProblemId, agent) => {
                console.log(`Delegating sub-problem ${subProblemId} to ${agent}`);
                // Could trigger cross-agent collaboration
              }}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <SolutionExplorer
              problemId={selectedProblemId}
              onImplement={handleSolutionImplement}
              onRefine={handleSolutionRefine}
              onCollaborate={handleSolutionCollaborate}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <LogicReasoningView
              onReasoningComplete={(process) => {
                console.log('Reasoning complete:', process);
              }}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Research Laboratory
              </Typography>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <ScienceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Research Module Coming Soon
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Advanced research automation, literature review, hypothesis generation,
                  and experimental design capabilities will be available here.
                </Typography>
              </Paper>
            </Box>
          </TabPanel>
        </Box>
      </Paper>

      {/* Footer Info */}
      <Box sx={{ mt: 3, mb: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Edison Agent v1.0.0 | Powered by Multi-Paradigm Innovation Engine
        </Typography>
      </Box>
    </Container>
  );
}