/**
 * SecurityIncidentPanel - Incident Management Interface
 * Handles security incident response and tracking
 * Part of Tri-Protocol Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SecurityIncident {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'contained' | 'resolved';
  affectedSystems: string[];
  createdAt: string;
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  timestamp: string;
  event: string;
  actor: string;
}

interface IncidentResponse {
  incidentId: string;
  responseStatus: string;
  estimatedResolution: string;
  message: string;
}

export function SecurityIncidentPanel() {
  const theme = useTheme();
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState('automatic');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await fetch('/api/agents/atlas/incidents');
      const data = await response.json();
      setIncidents(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setLoading(false);
    }
  };

  const handleRespond = (incident: SecurityIncident) => {
    setSelectedIncident(incident);
    setResponseDialog(true);
  };

  const executeResponse = async () => {
    if (!selectedIncident) return;

    setResponding(true);
    try {
      const response = await fetch('/api/agents/atlas/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          responseType,
          severity: selectedIncident.severity,
          affectedSystems: selectedIncident.affectedSystems,
        }),
      });

      const result: IncidentResponse = await response.json();
      
      // Update incident status locally
      setIncidents(prev => prev.map(inc => 
        inc.id === selectedIncident.id 
          ? { ...inc, status: 'contained' as const }
          : inc
      ));

      setResponseDialog(false);
      setSelectedIncident(null);
    } catch (error) {
      console.error('Failed to respond to incident:', error);
    } finally {
      setResponding(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.error.light;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'contained': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon />;
      case 'medium':
        return <WarningIcon />;
      case 'low':
        return <InfoIcon />;
      default:
        return <SecurityIcon />;
    }
  };

  // Mock data for demonstration
  const mockIncidents: SecurityIncident[] = [
    {
      id: 'inc-001',
      type: 'unauthorized_access',
      severity: 'high',
      status: 'active',
      affectedSystems: ['web-server-01', 'api-gateway'],
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      timeline: [
        {
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          event: 'Suspicious login attempts detected',
          actor: 'atlas-monitor'
        },
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          event: 'Threat severity escalated to HIGH',
          actor: 'atlas-analyzer'
        }
      ]
    },
    {
      id: 'inc-002',
      type: 'network_anomaly',
      severity: 'medium',
      status: 'contained',
      affectedSystems: ['database-02'],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      timeline: [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          event: 'Unusual network traffic pattern detected',
          actor: 'atlas-monitor'
        },
        {
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          event: 'Automated containment protocols activated',
          actor: 'atlas-responder'
        }
      ]
    }
  ];

  const displayIncidents = incidents.length > 0 ? incidents : mockIncidents;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon /> Security Incidents
      </Typography>

      {displayIncidents.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          No active security incidents. All systems operating normally.
        </Alert>
      ) : (
        <TableContainer component={Paper} elevation={3} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Incident ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Affected Systems</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getSeverityIcon(incident.severity)}
                      {incident.type.replace('_', ' ').toUpperCase()}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.severity.toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: getSeverityColor(incident.severity),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={incident.status.toUpperCase()}
                      color={getStatusColor(incident.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {incident.affectedSystems.map((system, idx) => (
                      <Chip
                        key={idx}
                        label={system}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {new Date(incident.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Respond to incident">
                      <IconButton
                        color="primary"
                        onClick={() => handleRespond(incident)}
                        disabled={incident.status === 'resolved'}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Incident Timeline */}
      {displayIncidents.filter(i => i.status === 'active').map((incident) => (
        <Paper key={incident.id} elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Incident Timeline: {incident.id}
          </Typography>
          <Timeline>
            {incident.timeline.map((event, idx) => (
              <TimelineItem key={idx}>
                <TimelineSeparator>
                  <TimelineDot color={idx === 0 ? 'error' : 'primary'} />
                  {idx < incident.timeline.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2">{event.event}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(event.timestamp).toLocaleString()} - {event.actor}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      ))}

      {/* Response Dialog */}
      <Dialog open={responseDialog} onClose={() => setResponseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Execute Incident Response
        </DialogTitle>
        <DialogContent>
          {selectedIncident && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Responding to {selectedIncident.severity.toUpperCase()} severity incident affecting {selectedIncident.affectedSystems.length} systems
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Response Type</InputLabel>
                <Select
                  value={responseType}
                  onChange={(e) => setResponseType(e.target.value)}
                  label="Response Type"
                >
                  <MenuItem value="automatic">Automatic Response</MenuItem>
                  <MenuItem value="semi-automatic">Semi-Automatic (Supervised)</MenuItem>
                  <MenuItem value="manual">Manual Response</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Response Actions:
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 3 }}>
                  <li>Isolate affected systems</li>
                  <li>Block suspicious IP addresses</li>
                  <li>Initiate forensic analysis</li>
                  <li>Notify security team</li>
                  <li>Generate incident report</li>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon fontSize="small" />
                  This response will be coordinated with ShakaAgent for ethical oversight
                </Box>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={executeResponse}
            disabled={responding}
            startIcon={<PlayArrowIcon />}
          >
            {responding ? 'Executing...' : 'Execute Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}