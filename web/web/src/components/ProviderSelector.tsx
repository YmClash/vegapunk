import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Computer as OllamaIcon,
  Cloud as HuggingFaceIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ProviderStatus {
  ollama?: {
    status: string;
    currentModel?: string;
    totalModels?: number;
  };
  huggingface?: {
    status: string;
    currentModel?: string;
    totalModels?: number;
    apiKeyConfigured?: boolean;
  };
  currentProvider?: string;
  availableProviders?: string[];
}

export function ProviderSelector() {
  const [currentProvider, setCurrentProvider] = useState<string>('ollama');
  const [availableProviders, setAvailableProviders] = useState<string[]>(['ollama']);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current provider and available providers
      const currentResponse = await axios.get('http://localhost:8080/api/providers/current');
      setCurrentProvider(currentResponse.data.currentProvider);
      setAvailableProviders(currentResponse.data.availableProviders);

      // Get health status
      const healthResponse = await axios.get('http://localhost:8080/api/health');
      setProviderStatus(healthResponse.data.services);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch provider information');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (newProvider: string) => {
    try {
      setLoading(true);
      setError(null);

      await axios.post('http://localhost:8080/api/providers/switch', {
        provider: newProvider
      });

      setCurrentProvider(newProvider);
      
      // Refresh provider info after switch
      await fetchProviderInfo();
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to switch provider');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderInfo();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchProviderInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return <OllamaIcon fontSize="small" />;
      case 'huggingface':
        return <HuggingFaceIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return 'Ollama (Local)';
      case 'huggingface':
        return 'Hugging Face';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  const getProviderStatusChip = (provider: string) => {
    const status = providerStatus[provider as keyof ProviderStatus] as any;
    
    if (!status) {
      return <Chip label="Unknown" color="default" size="small" />;
    }

    if (status.status === 'healthy') {
      return <Chip label="Healthy" color="success" size="small" />;
    } else if (status.status === 'unhealthy') {
      return <Chip label="Unhealthy" color="error" size="small" />;
    } else if (status.status === 'unavailable') {
      return <Chip label="Unavailable" color="warning" size="small" />;
    } else {
      return <Chip label={status.status} color="default" size="small" />;
    }
  };

  const getCurrentProviderInfo = () => {
    const status = providerStatus[currentProvider as keyof ProviderStatus] as any;
    if (!status) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current Configuration:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {status.currentModel && (
            <Typography variant="body2">
              <strong>Model:</strong> {status.currentModel}
            </Typography>
          )}
          {status.totalModels !== undefined && (
            <Typography variant="body2">
              <strong>Available Models:</strong> {status.totalModels}
            </Typography>
          )}
          {currentProvider === 'huggingface' && (
            <Typography variant="body2">
              <strong>API Key:</strong> {status.apiKeyConfigured ? '✅ Configured' : '❌ Missing'}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🤖 LLM Provider
        </Typography>
        <Tooltip title="Refresh provider status">
          <IconButton onClick={fetchProviderInfo} disabled={loading} size="small">
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Provider</InputLabel>
        <Select
          value={currentProvider}
          label="Select Provider"
          onChange={(e) => handleProviderChange(e.target.value)}
          disabled={loading}
        >
          {availableProviders.map((provider) => (
            <MenuItem key={provider} value={provider}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {getProviderIcon(provider)}
                <Typography sx={{ flexGrow: 1 }}>
                  {getProviderDisplayName(provider)}
                </Typography>
                {getProviderStatusChip(provider)}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Provider Status Summary */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {availableProviders.map((provider) => (
          <Box key={provider} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getProviderIcon(provider)}
            <Typography variant="caption" sx={{ mr: 0.5 }}>
              {getProviderDisplayName(provider)}:
            </Typography>
            {getProviderStatusChip(provider)}
          </Box>
        ))}
      </Box>

      {/* Current Provider Details */}
      {getCurrentProviderInfo()}

      {/* Hugging Face Configuration Hint */}
      {availableProviders.includes('huggingface') && 
       providerStatus.huggingface?.apiKeyConfigured === false && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>💡 Tip:</strong> To use Hugging Face, set the <code>HUGGING_FACE_API_KEY</code> environment variable with your API key from{' '}
            <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener">
              huggingface.co/settings/tokens
            </a>
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}