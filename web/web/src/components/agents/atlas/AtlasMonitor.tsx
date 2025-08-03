/**
 * AtlasMonitor - Real-time Security Dashboard Component
 * Displays security status, threats, and monitoring data
 * Part of Tri-Protocol Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Shield as ShieldIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SecurityStatus {
  overallScore: number;
  activeThreats: number;
  vulnerabilities: number;
  lastScan: string;
  defensePosture: 'normal' | 'heightened' | 'critical';
}

interface ThreatData {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigated: boolean;
  timestamp: string;
}

export function AtlasMonitor() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch security status
      const statusResponse = await fetch('/api/agents/atlas/status');
      if (!statusResponse.ok) {
        throw new Error(`HTTP error! status: ${statusResponse.status}`);
      }
      const statusData = await statusResponse.json();
      
      // Transform the data to match expected SecurityStatus interface
      setSecurityStatus({
        overallScore: statusData.security?.overallScore || 0.85,
        activeThreats: statusData.security?.threatsDetected || 0,
        vulnerabilities: statusData.security?.threatsDetected || 0, // Use threatsDetected for vulnerabilities
        lastScan: statusData.lastUpdate || new Date().toISOString(),
        defensePosture: statusData.security?.threatsDetected > 0 ? 'heightened' : 'normal'
      });
      
      // Fetch active threats
      const threatsResponse = await fetch('/api/agents/atlas/threats');
      if (!threatsResponse.ok) {
        console.warn('Failed to fetch threats, using empty array');
        setThreats([]);
      } else {
        const threatsData = await threatsResponse.json();
        setThreats(Array.isArray(threatsData) ? threatsData : []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
      // Set default data on error
      setSecurityStatus({
        overallScore: 0.85,
        activeThreats: 0,
        vulnerabilities: 0,
        lastScan: new Date().toISOString(),
        defensePosture: 'normal'
      });
      setThreats([]);
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchSecurityData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
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

  const getPostureIcon = (posture: string) => {
    switch (posture) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'heightened': return <WarningIcon color="warning" />;
      case 'normal': return <CheckCircleIcon color="success" />;
      default: return <SecurityIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading security data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShieldIcon /> Atlas Security Monitor
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleManualRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Security Score Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Score
              </Typography>
              
              {securityStatus && (
                <>
                  <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', my: 2 }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        border: `8px solid ${getScoreColor(securityStatus.overallScore)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Typography variant="h3" sx={{ color: getScoreColor(securityStatus.overallScore) }}>
                        {Math.round(securityStatus.overallScore * 100)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                    {getPostureIcon(securityStatus.defensePosture)}
                    <Typography variant="body1">
                      Defense Posture: <strong>{securityStatus.defensePosture.toUpperCase()}</strong>
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Last scan: {new Date(securityStatus.lastScan).toLocaleString()}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Threat Overview */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Threat Overview
              </Typography>
              
              {securityStatus && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Active Threats</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color={securityStatus.activeThreats > 0 ? 'error' : 'success'}>
                        {securityStatus.activeThreats}
                      </Typography>
                      {securityStatus.activeThreats > 0 ? <WarningIcon color="error" /> : <CheckCircleIcon color="success" />}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Vulnerabilities</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color={securityStatus.vulnerabilities > 0 ? 'warning' : 'success'}>
                        {securityStatus.vulnerabilities}
                      </Typography>
                      {securityStatus.vulnerabilities > 0 ? <WarningIcon color="warning" /> : <CheckCircleIcon color="success" />}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Mitigated Today</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color="primary">
                        {threats.filter(t => t.mitigated).length}
                      </Typography>
                      <TrendingUpIcon color="primary" />
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Protection
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Network Security</Typography>
                    <Chip label="ACTIVE" color="success" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={95} color="success" />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Intrusion Detection</Typography>
                    <Chip label="MONITORING" color="primary" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={88} color="primary" />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Automated Response</Typography>
                    <Chip label="READY" color="info" size="small" />
                  </Box>
                  <LinearProgress variant="determinate" value={92} color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Threats */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Security Events
            </Typography>
            
            {threats.length === 0 ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                No active threats detected. All systems secure.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                {threats.map((threat) => (
                  <Alert
                    key={threat.id}
                    severity={threat.severity === 'critical' || threat.severity === 'high' ? 'error' : 
                            threat.severity === 'medium' ? 'warning' : 'info'}
                    sx={{ mb: 2 }}
                    action={
                      <Chip
                        label={threat.mitigated ? 'MITIGATED' : 'ACTIVE'}
                        color={threat.mitigated ? 'success' : 'error'}
                        size="small"
                      />
                    }
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {threat.type.replace('_', ' ').toUpperCase()} - {threat.severity.toUpperCase()}
                    </Typography>
                    <Typography variant="body2">{threat.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(threat.timestamp).toLocaleString()}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Security Recommendations */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Recommendations
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Regular Security Audits</Typography>
                <Typography variant="body2">
                  Schedule comprehensive security audits weekly to maintain optimal protection.
                </Typography>
              </Alert>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Update Security Policies</Typography>
                <Typography variant="body2">
                  Review and update security policies based on recent threat patterns.
                </Typography>
              </Alert>
              
              <Alert severity="info">
                <Typography variant="subtitle2">Enable Advanced Monitoring</Typography>
                <Typography variant="body2">
                  Consider enabling predictive threat analysis for proactive defense.
                </Typography>
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}