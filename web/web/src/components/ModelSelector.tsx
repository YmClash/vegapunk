import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  Divider,
  Tab,
  Tabs
} from '@mui/material';
import {
  SmartToy as ModelIcon,
  SwapHoriz as SwitchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Star as DefaultIcon,
  Computer as OllamaIcon,
  Cloud as HuggingFaceIcon
} from '@mui/icons-material';
import axios from 'axios';

interface ModelInfo {
  currentModel: string;
  defaultModel: string;
  models?: string[];
  status?: string;
}

interface ProviderInfo {
  currentProvider: string;
  availableProviders: string[];
}

export function ModelSelector() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProviderInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/providers/current');
      const data = response.data;
      
      setProviderInfo(data);
      setSelectedProvider(data.currentProvider);
      
      // Fetch models for current provider
      await fetchModelsForProvider(data.currentProvider);
      
    } catch (err: any) {
      console.error('Failed to fetch provider info:', err);
      setError('Failed to fetch provider information');
    }
  };

  const fetchModelsForProvider = async (provider: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [modelsResponse, currentResponse] = await Promise.all([
        axios.get(`http://localhost:8080/api/providers/${provider}/models`),
        axios.get('http://localhost:8080/api/models/current')
      ]);
      
      const modelsData = modelsResponse.data;
      const currentData = currentResponse.data;
      
      setAvailableModels(modelsData.models || []);
      setModelInfo({
        currentModel: currentData.currentModel,
        defaultModel: currentData.defaultModel,
        models: modelsData.models || [],
        status: 'healthy'
      });
      setSelectedModel(currentData.currentModel);
      
    } catch (err: any) {
      console.error('Failed to fetch models:', err);
      setError(`Failed to fetch models for ${provider}`);
      setAvailableModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelSwitch = async () => {
    if (!selectedModel || selectedModel === modelInfo?.currentModel || !selectedProvider) {
      return;
    }
    
    setSwitching(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await axios.post(`http://localhost:8080/api/providers/${selectedProvider}/models/switch`, {
        modelName: selectedModel
      });
      
      if (response.data.success) {
        setSuccess(`Successfully switched to model: ${selectedModel}`);
        await fetchModelsForProvider(selectedProvider); // Refresh model info
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to switch model:', err);
      setError(err.response?.data?.error || 'Failed to switch model');
    } finally {
      setSwitching(false);
    }
  };

  const handleProviderChange = async (newProvider: string) => {
    if (newProvider === selectedProvider) return;
    
    setSelectedProvider(newProvider);
    await fetchModelsForProvider(newProvider);
  };

  useEffect(() => {
    fetchProviderInfo();
    
    // Refresh provider info every 30 seconds
    const interval = setInterval(fetchProviderInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatModelName = (modelName: string) => {
    // For Hugging Face models, show organization/model name
    if (modelName.includes('/')) {
      const parts = modelName.split('/');
      return `${parts[0]}/${parts[1]?.split(':')[0] || parts[1]}`;
    }
    // For Ollama models, extract just the model name without version tags
    return modelName.split(':')[0];
  };

  const getModelVersion = (modelName: string) => {
    // Extract version tag if present
    const parts = modelName.split(':');
    return parts.length > 1 ? parts[1] : 'latest';
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return <OllamaIcon />;
      case 'huggingface':
        return <HuggingFaceIcon />;
      default:
        return <ModelIcon />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'ollama':
        return 'Ollama (Local)';
      case 'huggingface':
        return 'Hugging Face (Cloud)';
      default:
        return provider;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <ModelIcon sx={{ mr: 1, color: 'primary.main' }} />
          Model Selection
        </Typography>
        <Tooltip title="Refresh Models">
          <IconButton onClick={fetchProviderInfo} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Provider Tabs */}
      {providerInfo && providerInfo.availableProviders.length > 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={selectedProvider} 
            onChange={(e, newValue) => handleProviderChange(newValue)}
            variant="fullWidth"
          >
            {providerInfo.availableProviders.map((provider) => (
              <Tab
                key={provider}
                label={getProviderLabel(provider)}
                value={provider}
                icon={getProviderIcon(provider)}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box>
          {/* Current Model Info */}
          {modelInfo && providerInfo && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getProviderIcon(selectedProvider)}
                    Current Model ({getProviderLabel(selectedProvider)})
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={formatModelName(modelInfo.currentModel)}
                      size="small"
                      sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 'bold' }}
                    />
                    <Typography variant="caption">
                      v{getModelVersion(modelInfo.currentModel)}
                    </Typography>
                    {modelInfo.currentModel === modelInfo.defaultModel && (
                      <Tooltip title="Default Model">
                        <DefaultIcon fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: 'secondary.light', borderRadius: 2, color: 'white' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Available Models
                  </Typography>
                  <Typography variant="h6">
                    {availableModels.length}
                  </Typography>
                  <Typography variant="caption">
                    Models ready for use
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Model Selection */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 200, flex: 1 }}>
              <InputLabel>Select {selectedProvider ? getProviderLabel(selectedProvider) : ''} Model</InputLabel>
              <Select
                value={selectedModel}
                label={`Select ${selectedProvider ? getProviderLabel(selectedProvider) : ''} Model`}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={switching || availableModels.length === 0}
              >
                {availableModels.map((model) => (
                  <MenuItem key={model} value={model}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography>{formatModelName(model)}</Typography>
                      <Chip 
                        label={getModelVersion(model)}
                        size="small"
                        variant="outlined"
                      />
                      {model === modelInfo?.currentModel && (
                        <CheckIcon color="success" fontSize="small" />
                      )}
                      {model === modelInfo?.defaultModel && (
                        <DefaultIcon color="warning" fontSize="small" />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              onClick={handleModelSwitch}
              disabled={
                switching || 
                !selectedModel || 
                selectedModel === modelInfo?.currentModel ||
                availableModels.length === 0
              }
              startIcon={switching ? <CircularProgress size={16} /> : <SwitchIcon />}
              sx={{ minWidth: 120 }}
            >
              {switching ? 'Switching...' : 'Switch Model'}
            </Button>
          </Box>

          {/* Model List */}
          {availableModels.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Models ({availableModels.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableModels.map((model) => (
                  <Chip
                    key={model}
                    label={model}
                    size="small"
                    variant={model === modelInfo?.currentModel ? 'filled' : 'outlined'}
                    color={model === modelInfo?.currentModel ? 'primary' : 'default'}
                    onClick={() => setSelectedModel(model)}
                    icon={
                      model === modelInfo?.currentModel ? <CheckIcon /> : 
                      model === modelInfo?.defaultModel ? <DefaultIcon /> : 
                      <ModelIcon />
                    }
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {availableModels.length === 0 && !loading && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No models available. Please ensure Ollama is running and has models installed.
              <br />
              <Typography variant="caption">
                Try running: <code>ollama pull llama2</code> or <code>ollama pull qwen2:7b</code>
              </Typography>
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}