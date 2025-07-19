// React import not needed with new JSX transform
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  RefreshOutlined as RefreshIcon,
  Memory as MemoryIcon,
  SmartToy as BotIcon,
  Api as ApiIcon
} from '@mui/icons-material';

interface SystemHealthStatus {
  status: string;
  timestamp: string;
  services: {
    dashboard: string;
    chat: string;
    ollama: {
      status: string;
      version?: string;
      models?: string[];
      currentModel?: string;
      defaultModel?: string;
      availableModels?: string[];
      totalModels?: number;
      error?: string;
      lastCheck: string;
    };
  };
  system?: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
    };
  };
}

interface SystemStatusProps {
  health: SystemHealthStatus | null;
  error: string | null;
  onRefresh: () => void;
}

export function SystemStatus({ health, error, onRefresh }: SystemStatusProps) {
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'operational':
      case 'healthy':
        return 'success';
      case 'unhealthy':
      case 'error':
        return 'error';
      case 'connecting':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    if (color === 'success') {
      return <CheckIcon color="success" />;
    } else if (color === 'error') {
      return <ErrorIcon color="error" />;
    } else {
      return <CircularProgress size={20} />;
    }
  };

  if (error) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" gutterBottom>
              System Status
            </Typography>
            <IconButton onClick={onRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Box>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h5" component="h2" display="flex" alignItems="center">
            <MemoryIcon sx={{ mr: 1 }} />
            System Status
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="caption" color="text.secondary">
              Last update: {new Date(health.timestamp).toLocaleTimeString()}
            </Typography>
            <Tooltip title="Refresh status">
              <IconButton onClick={onRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Dashboard Service */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center">
                  <ApiIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle1">Dashboard API</Typography>
                </Box>
                {getStatusIcon(health.services.dashboard)}
              </Box>
              <Chip
                label={health.services.dashboard}
                color={getStatusColor(health.services.dashboard)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Chat Service */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center">
                  <BotIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="subtitle1">Chat Engine</Typography>
                </Box>
                {getStatusIcon(health.services.chat)}
              </Box>
              <Chip
                label={health.services.chat}
                color={getStatusColor(health.services.chat)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          </Grid>

          {/* Ollama Service */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center">
                  <MemoryIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="subtitle1">Ollama LLM</Typography>
                </Box>
                {getStatusIcon(health.services.ollama.status)}
              </Box>
              <Chip
                label={health.services.ollama.status}
                color={getStatusColor(health.services.ollama.status)}
                size="small"
                sx={{ mt: 1 }}
              />
              {health.services.ollama.version && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Version: {health.services.ollama.version}
                </Typography>
              )}
              {health.services.ollama.currentModel && (
                <Box mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    Current Model:
                  </Typography>
                  <Chip
                    label={health.services.ollama.currentModel}
                    size="small"
                    color="primary"
                    sx={{ ml: 0.5, fontSize: '0.75rem' }}
                  />
                </Box>
              )}
              {health.services.ollama.totalModels !== undefined && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Total Models: {health.services.ollama.totalModels}
                </Typography>
              )}
              {health.services.ollama.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {health.services.ollama.error}
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* System Information */}
        {health.system && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Uptime
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.floor(health.system.uptime / 3600)}h {Math.floor((health.system.uptime % 3600) / 60)}m
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Node.js
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {health.system.nodeVersion}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Platform
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {health.system.platform}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {Math.round((health.system.memory.used / health.system.memory.total) * 100)}%
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Overall System Status */}
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: health.status === 'OK' ? 'success.dark' : 'error.dark',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.05))'
          }}
        >
          <Typography variant="subtitle2" align="center" color="white">
            Overall System Status: {health.status}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}