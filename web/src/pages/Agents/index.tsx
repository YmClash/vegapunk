/**
 * Agents Page
 * Displays and manages all agents in the system
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Avatar,
  LinearProgress,
  Tooltip,
  Dialog,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { AgentDetailsDialog } from './AgentDetailsDialog';
import { CreateAgentDialog } from './CreateAgentDialog';

// GraphQL Queries and Mutations
const AGENTS_QUERY = gql`
  query GetAgents($status: AgentStatus) {
    agents(status: $status) {
      edges {
        node {
          id
          name
          type
          status
          capabilities
          currentWorkload
          memoryUsage {
            total
            limit
          }
          performance {
            successRate
            averageTaskTime
            tasksCompleted
            efficiencyRating
          }
          tasks(limit: 5) {
            id
            description
            status
          }
        }
      }
    }
  }
`;

const START_AGENT_MUTATION = gql`
  mutation StartAgent($id: UUID!) {
    startAgent(id: $id) {
      id
      status
    }
  }
`;

const STOP_AGENT_MUTATION = gql`
  mutation StopAgent($id: UUID!) {
    stopAgent(id: $id) {
      id
      status
    }
  }
`;

const agentTypeColors: Record<string, string> = {
  ATLAS: '#00E5FF',
  EDISON: '#FF4081',
  PYTHAGORAS: '#69F0AE',
  LILITH: '#FFB74D',
  YORK: '#40C4FF',
  SHAKA: '#B388FF',
};

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuAgent, setMenuAgent] = useState<any>(null);

  const { data, loading, error, refetch } = useQuery(AGENTS_QUERY, {
    variables: { status: statusFilter },
    pollInterval: 10000, // Refresh every 10 seconds
  });

  const [startAgent] = useMutation(START_AGENT_MUTATION, {
    refetchQueries: [{ query: AGENTS_QUERY, variables: { status: statusFilter } }],
  });

  const [stopAgent] = useMutation(STOP_AGENT_MUTATION, {
    refetchQueries: [{ query: AGENTS_QUERY, variables: { status: statusFilter } }],
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, agent: any) => {
    setAnchorEl(event.currentTarget);
    setMenuAgent(agent);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAgent(null);
  };

  const handleStartStop = async (agent: any) => {
    try {
      if (agent.status === 'ACTIVE') {
        await stopAgent({ variables: { id: agent.id } });
      } else {
        await startAgent({ variables: { id: agent.id } });
      }
    } catch (error) {
      console.error('Error toggling agent status:', error);
    }
  };

  const filteredAgents = data?.agents?.edges?.filter((edge: any) => {
    const agent = edge.node;
    return agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           agent.type.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading agents...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography color="error">Error loading agents: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Agents
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => refetch()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Agent
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search agents..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="All"
            onClick={() => setStatusFilter(null)}
            color={statusFilter === null ? 'primary' : 'default'}
          />
          <Chip
            label="Active"
            onClick={() => setStatusFilter('ACTIVE')}
            color={statusFilter === 'ACTIVE' ? 'primary' : 'default'}
          />
          <Chip
            label="Inactive"
            onClick={() => setStatusFilter('INACTIVE')}
            color={statusFilter === 'INACTIVE' ? 'primary' : 'default'}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredAgents.map((edge: any) => {
          const agent = edge.node;
          const isActive = agent.status === 'ACTIVE';
          
          return (
            <Grid item xs={12} md={6} lg={4} key={agent.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'visible',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 4,
                    height: '100%',
                    backgroundColor: agentTypeColors[agent.type],
                    borderRadius: '4px 0 0 4px',
                  },
                }}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: agentTypeColors[agent.type],
                          width: 48,
                          height: 48,
                        }}
                      >
                        {agent.type[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {agent.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {agent.type} Agent
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Chip
                        label={agent.status}
                        size="small"
                        color={isActive ? 'success' : 'default'}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, agent);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Workload
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(agent.currentWorkload * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={agent.currentWorkload * 100}
                      color={agent.currentWorkload > 0.8 ? 'warning' : 'primary'}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Memory Usage
                      </Typography>
                      <Typography variant="body2">
                        {agent.memoryUsage.total} / {agent.memoryUsage.limit} MB
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(agent.memoryUsage.total / agent.memoryUsage.limit) * 100}
                      color="secondary"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Success Rate
                      </Typography>
                      <Typography variant="h6">
                        {Math.round(agent.performance.successRate * 100)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tasks Completed
                      </Typography>
                      <Typography variant="h6">
                        {agent.performance.tasksCompleted}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Capabilities
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {agent.capabilities.slice(0, 3).map((capability: string) => (
                        <Chip
                          key={capability}
                          label={capability}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Chip
                          label={`+${agent.capabilities.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleStartStop(menuAgent);
            handleMenuClose();
          }}
        >
          {menuAgent?.status === 'ACTIVE' ? (
            <>
              <StopIcon sx={{ mr: 1 }} /> Stop Agent
            </>
          ) : (
            <>
              <PlayIcon sx={{ mr: 1 }} /> Start Agent
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate(`/agents/${menuAgent?.id}/settings`);
            handleMenuClose();
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} /> Settings
        </MenuItem>
      </Menu>

      {selectedAgent && (
        <AgentDetailsDialog
          agent={selectedAgent}
          open={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      <CreateAgentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />
    </Box>
  );
};