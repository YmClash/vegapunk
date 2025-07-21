import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Psychology as PsychologyIcon,
  Favorite as FavoriteIcon,
  Balance as BalanceIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Lightbulb as LightbulbIcon,
  Analytics as AnalyticsIcon,
  Send as SendIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface EthicalAnalysis {
  compliance: number;
  concerns: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedPolicies: string[];
    suggestedActions: string[];
  }>;
  recommendations: string[];
  reasoning: string;
  frameworkAnalyses: Array<{
    framework: string;
    score: number;
    reasoning: string;
    keyPoints: string[];
  }>;
}

interface AnalysisResult {
  analysis: EthicalAnalysis;
  summary: {
    compliance: number;
    concernsCount: number;
    recommendationsCount: number;
  };
}

export function EthicalAnalysisInterface() {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [framework, setFramework] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const frameworks = [
    { value: 'all', label: 'All Frameworks', icon: <AnalyticsIcon /> },
    { value: 'utilitarian', label: 'Utilitarian', icon: <BalanceIcon /> },
    { value: 'deontological', label: 'Deontological', icon: <GavelIcon /> },
    { value: 'virtue_ethics', label: 'Virtue Ethics', icon: <PsychologyIcon /> },
    { value: 'care_ethics', label: 'Care Ethics', icon: <FavoriteIcon /> }
  ];

  const handleAnalyze = async () => {
    if (!content.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/agents/shaka/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          metadata: {
            framework,
            timestamp: new Date().toISOString(),
            source: 'manual_analysis'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setContent('');
    setResult(null);
    setError(null);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getComplianceLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Good';
    if (score >= 0.7) return 'Acceptable';
    if (score >= 0.6) return 'Concerning';
    return 'Critical';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case 'utilitarian': return <BalanceIcon />;
      case 'deontological': return <GavelIcon />;
      case 'virtue_ethics': return <PsychologyIcon />;
      case 'care_ethics': return <FavoriteIcon />;
      default: return <AnalyticsIcon />;
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6">Ethical Analysis Interface</Typography>
          </Box>
        }
        subheader="Analyze content for ethical compliance across multiple frameworks"
      />
      
      <CardContent>
        <Grid container spacing={3}>
          {/* Input Section */}
          <Grid item xs={12}>
            <Box mb={2}>
              <TextField
                fullWidth
                multiline
                rows={6}
                variant="outlined"
                label="Content to Analyze"
                placeholder="Enter text, code, policy, or any content you want to analyze for ethical implications..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Ethical Framework</InputLabel>
                  <Select
                    value={framework}
                    label="Ethical Framework"
                    onChange={(e) => setFramework(e.target.value)}
                    disabled={loading}
                  >
                    {frameworks.map((fw) => (
                      <MenuItem key={fw.value} value={fw.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {fw.icon}
                          {fw.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box flexGrow={1} />
                
                <Button
                  variant="outlined"
                  onClick={handleClear}
                  disabled={loading || (!content && !result)}
                  startIcon={<ClearIcon />}
                >
                  Clear
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleAnalyze}
                  disabled={loading || !content.trim()}
                  startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
                >
                  Analyze
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Error Display */}
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Grid>
          )}

          {/* Loading */}
          {loading && (
            <Grid item xs={12}>
              <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={3}>
                <LinearProgress sx={{ width: '100%' }} />
                <Typography variant="body2" color="text.secondary">
                  Analyzing content across ethical frameworks...
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Results */}
          {result && !loading && (
            <Grid item xs={12}>
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Analysis Results
                </Typography>
                
                {/* Compliance Score */}
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Overall Ethical Compliance
                    </Typography>
                    <Chip
                      label={getComplianceLabel(result.analysis.compliance)}
                      color={result.analysis.compliance >= 0.7 ? 'success' : 
                             result.analysis.compliance >= 0.6 ? 'warning' : 'error'}
                    />
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress
                      variant="determinate"
                      value={result.analysis.compliance * 100}
                      sx={{ 
                        flexGrow: 1, 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getComplianceColor(result.analysis.compliance)
                        }
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold" color={getComplianceColor(result.analysis.compliance)}>
                      {Math.round(result.analysis.compliance * 100)}%
                    </Typography>
                  </Box>
                </Paper>

                {/* Framework Analysis */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Framework Analysis ({result.analysis.frameworkAnalyses.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {result.analysis.frameworkAnalyses.map((fw) => (
                        <Grid item xs={12} sm={6} key={fw.framework}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              {getFrameworkIcon(fw.framework)}
                              <Typography variant="subtitle2" fontWeight="medium">
                                {fw.framework.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Typography>
                              <Box flexGrow={1} />
                              <Typography variant="h6" color={getComplianceColor(fw.score)}>
                                {Math.round(fw.score * 100)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={fw.score * 100}
                              sx={{ 
                                mb: 1, 
                                height: 4, 
                                borderRadius: 2,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getComplianceColor(fw.score)
                                }
                              }}
                            />
                            {fw.keyPoints.length > 0 && (
                              <List dense>
                                {fw.keyPoints.slice(0, 2).map((point, index) => (
                                  <ListItem key={index} sx={{ pl: 0 }}>
                                    <ListItemText
                                      primary={point}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Concerns */}
                {result.analysis.concerns.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Ethical Concerns ({result.analysis.concerns.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {result.analysis.concerns.map((concern) => (
                          <ListItem key={concern.id} divider>
                            <ListItemIcon>
                              {concern.severity === 'critical' && <ErrorIcon color="error" />}
                              {concern.severity === 'high' && <ErrorIcon color="error" />}
                              {concern.severity === 'medium' && <WarningIcon color="warning" />}
                              {concern.severity === 'low' && <WarningIcon color="info" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={concern.description}
                              secondary={
                                <Box mt={1}>
                                  <Chip 
                                    size="small" 
                                    label={concern.severity.toUpperCase()} 
                                    color={getSeverityColor(concern.severity) as any}
                                    sx={{ mr: 1 }}
                                  />
                                  {concern.suggestedActions.length > 0 && (
                                    <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                                      Suggested: {concern.suggestedActions[0]}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Recommendations */}
                {result.analysis.recommendations.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Recommendations ({result.analysis.recommendations.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {result.analysis.recommendations.map((recommendation, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <LightbulbIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={recommendation} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Reasoning */}
                {result.analysis.reasoning && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Detailed Reasoning
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                        {result.analysis.reasoning}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}