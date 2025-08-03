/**
 * ComplianceReportViewer - Security Compliance Dashboard
 * Displays compliance status, audit reports, and policy violations
 * Part of Tri-Protocol Integration
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Policy as PolicyIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface ComplianceStatus {
  overallScore: number;
  lastAudit: string;
  nextAudit: string;
  policies: {
    total: number;
    compliant: number;
    violations: number;
  };
  certifications: string[];
  recommendations: string[];
}

interface PolicyViolation {
  id: string;
  policy: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

interface AuditReport {
  id: string;
  date: string;
  type: string;
  score: number;
  findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function ComplianceReportViewer() {
  const theme = useTheme();
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [auditReports, setAuditReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const response = await fetch('/api/agents/atlas/compliance');
      const data = await response.json();
      setCompliance(data);
      
      // Mock violations for demonstration
      setViolations([
        {
          id: 'viol-001',
          policy: 'Password Complexity',
          severity: 'medium',
          description: 'Password policy requires minimum 14 characters',
          detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          remediation: 'Update password policy configuration',
          status: 'open',
        },
        {
          id: 'viol-002',
          policy: 'MFA Enforcement',
          severity: 'high',
          description: 'Multi-factor authentication not enabled for admin accounts',
          detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          remediation: 'Enable MFA for all administrative users',
          status: 'in_progress',
        },
      ]);

      // Mock audit reports
      setAuditReports([
        {
          id: 'audit-001',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'Weekly Security Audit',
          score: 92,
          findings: 15,
          critical: 0,
          high: 2,
          medium: 5,
          low: 8,
        },
        {
          id: 'audit-002',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'Monthly Compliance Review',
          score: 88,
          findings: 23,
          critical: 1,
          high: 3,
          medium: 7,
          low: 12,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      setLoading(false);
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <ErrorIcon sx={{ color: theme.palette.error.light }} />;
      case 'medium': return <WarningIcon color="warning" />;
      case 'low': return <WarningIcon sx={{ color: theme.palette.warning.light }} />;
      default: return <PolicyIcon />;
    }
  };

  const getStatusChip = (status: string) => {
    const color = status === 'resolved' ? 'success' : 
                  status === 'in_progress' ? 'warning' : 'error';
    return <Chip label={status.replace('_', ' ').toUpperCase()} size="small" color={color as any} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedUserIcon /> Compliance & Security Policies
      </Typography>

      {/* Compliance Overview */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Score
              </Typography>
              {compliance && (
                <>
                  <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', my: 2 }}>
                    <CircularProgress
                      variant="determinate"
                      value={compliance.overallScore}
                      size={120}
                      thickness={6}
                      sx={{ color: getComplianceColor(compliance.overallScore) }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <Typography variant="h3" sx={{ color: getComplianceColor(compliance.overallScore) }}>
                        {compliance.overallScore}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Last audit: {new Date(compliance.lastAudit).toLocaleDateString()}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Policy Status
              </Typography>
              {compliance && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Compliant Policies</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color="success.main">
                        {compliance.policies.compliant}
                      </Typography>
                      <CheckCircleIcon color="success" />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2">Policy Violations</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" color="error">
                        {compliance.policies.violations}
                      </Typography>
                      <WarningIcon color="error" />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Total Policies</Typography>
                    <Typography variant="h6">{compliance.policies.total}</Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Certifications
              </Typography>
              {compliance && (
                <List dense>
                  {compliance.certifications.map((cert, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <VerifiedUserIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={cert} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Policy Violations */}
      <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active Policy Violations
        </Typography>
        {violations.length === 0 ? (
          <Alert severity="success">
            No active policy violations. All systems compliant.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Policy</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Detected</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getSeverityIcon(violation.severity)}
                        {violation.policy}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={violation.severity.toUpperCase()}
                        size="small"
                        color={violation.severity === 'critical' || violation.severity === 'high' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{violation.description}</TableCell>
                    <TableCell>{new Date(violation.detectedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusChip(violation.status)}</TableCell>
                    <TableCell>
                      <Tooltip title="View remediation">
                        <IconButton size="small">
                          <AssessmentIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Audit Reports */}
      <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Audit Reports
        </Typography>
        {auditReports.map((report) => (
          <Accordion key={report.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <DescriptionIcon />
                <Typography sx={{ flexGrow: 1 }}>{report.type}</Typography>
                <Chip
                  label={`Score: ${report.score}%`}
                  color={report.score >= 90 ? 'success' : report.score >= 70 ? 'warning' : 'error'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(report.date).toLocaleDateString()}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Findings Summary
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary={`Critical: ${report.critical}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary={`High: ${report.high}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary={`Medium: ${report.medium}`} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary={`Low: ${report.low}`} />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Actions
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Download Full Report
                  </Button>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Recommendations */}
      {compliance && compliance.recommendations.length > 0 && (
        <Paper elevation={3} sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Compliance Recommendations
          </Typography>
          <List>
            {compliance.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <SecurityIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Next Audit */}
      {compliance && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            Next compliance audit scheduled for: {new Date(compliance.nextAudit).toLocaleDateString()}
          </Box>
        </Alert>
      )}
    </Box>
  );
}