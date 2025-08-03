import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  IconButton,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Chat as ChatIcon,
  Clear as ClearIcon,
  AutoFixHigh as AutoFixHighIcon,
  ContentCopy as ContentCopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useChatContext } from '../contexts/ChatContext';

interface EthicalMessage {
  id: string;
  text: string;
  sender: 'user' | 'shaka';
  timestamp: Date;
  isEthical: boolean;
  analysis?: {
    compliance: number;
    concerns: number;
    recommendations: number;
    processingTime: number;
  };
}

export function ShakaChat() {
  const theme = useTheme();
  let chatContext;
  try {
    chatContext = useChatContext();
  } catch {
    chatContext = null;
  }
  const [ethicalMode, setEthicalMode] = useState(false);
  const [messages, setMessages] = useState<EthicalMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-detect ethical queries
  const detectEthicalContent = async (message: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/agents/shaka/detect-ethics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.requiresEthicalAnalysis;
      }
    } catch (err) {
      console.error('Failed to detect ethical content:', err);
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: EthicalMessage = {
      id: `user_${Date.now()}`,
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      isEthical: false
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);
    setError(null);

    try {
      let response;
      let isEthical = false;

      // Check if ethical mode is enabled or if content requires ethical analysis
      if (ethicalMode || await detectEthicalContent(currentMessage)) {
        isEthical = true;
        // Send to ShakaAgent for ethical analysis
        response = await fetch('/api/agents/shaka/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: currentMessage,
            context: {
              action: currentMessage,
              intent: 'User ethical inquiry',
              stakeholders: ['user', 'system']
            },
            framework: 'all'
          })
        });
      } else {
        // Send to regular chat if ChatContext is available
        if (chatContext && chatContext.sendMessage) {
          chatContext.sendMessage(currentMessage);
          setLoading(false);
          return;
        } else {
          throw new Error('Chat service not available');
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.statusText}`);
      }

      const data = await response.json();
      
      const shakaMessage: EthicalMessage = {
        id: `shaka_${Date.now()}`,
        text: data.data.response,
        sender: 'shaka',
        timestamp: new Date(),
        isEthical,
        analysis: isEthical ? {
          compliance: data.data.confidence,
          concerns: data.data.analysis.concerns.length,
          recommendations: data.data.recommendations.length,
          processingTime: data.data.processingTime
        } : undefined
      };

      setMessages(prev => [...prev, shakaMessage]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getComplianceColor = (score: number) => {
    if (score >= 0.8) return theme.palette.success.main;
    if (score >= 0.6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">🧠 ShakaChat</Typography>
            {ethicalMode && (
              <Chip
                icon={<AutoFixHighIcon />}
                label="Ethical Mode"
                color="primary"
                size="small"
              />
            )}
          </Box>
        }
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={ethicalMode}
                  onChange={(e) => setEthicalMode(e.target.checked)}
                  color="primary"
                  size="small"
                />
              }
              label="Ethical Mode"
            />
            <Tooltip title="Clear chat">
              <IconButton onClick={clearMessages} disabled={messages.length === 0}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
        subheader={
          ethicalMode
            ? "All messages will be analyzed through ethical frameworks"
            : "Ethical queries will be automatically detected and analyzed"
        }
      />

      <Divider />

      {/* Messages Area */}
      <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {messages.length === 0 && (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            height="100%" 
            color="text.secondary"
          >
            <PsychologyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Start an Ethical Conversation
            </Typography>
            <Typography variant="body2" textAlign="center">
              Ask about ethics, policies, moral dilemmas, or enable Ethical Mode for comprehensive analysis
            </Typography>
          </Box>
        )}

        <List sx={{ p: 0 }}>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'stretch', p: 1 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '85%',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  bgcolor: message.sender === 'user' 
                    ? 'primary.main' 
                    : message.isEthical 
                      ? theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50'
                      : 'background.paper',
                  color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                  border: message.isEthical ? `2px solid ${theme.palette.primary.main}` : 'none'
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                  <Avatar
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: message.sender === 'user' ? 'primary.light' : 'secondary.main'
                    }}
                  >
                    {message.sender === 'user' ? (
                      <ChatIcon fontSize="small" />
                    ) : (
                      <PsychologyIcon fontSize="small" />
                    )}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                      {message.text}
                    </Typography>
                    
                    {/* Ethical Analysis Summary */}
                    {message.analysis && (
                      <Box mt={1} p={1} bgcolor="rgba(0,0,0,0.1)" borderRadius={1}>
                        <Typography variant="caption" fontWeight="medium" display="block" mb={0.5}>
                          📊 Ethical Analysis:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          <Chip
                            size="small"
                            label={`${Math.round(message.analysis.compliance * 100)}% Compliance`}
                            sx={{
                              bgcolor: getComplianceColor(message.analysis.compliance),
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          />
                          {message.analysis.concerns > 0 && (
                            <Chip
                              size="small"
                              label={`${message.analysis.concerns} Concerns`}
                              color="warning"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          <Chip
                            size="small"
                            label={`${message.analysis.recommendations} Recommendations`}
                            color="info"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            size="small"
                            label={`${message.analysis.processingTime}ms`}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                  
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Tooltip title="Copy message">
                      <IconButton size="small" onClick={() => copyMessage(message.text)}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {message.sender === 'shaka' && (
                      <>
                        <Tooltip title="Helpful response">
                          <IconButton size="small">
                            <ThumbUpIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Needs improvement">
                          <IconButton size="small">
                            <ThumbDownIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  {message.timestamp.toLocaleTimeString()}
                  {message.isEthical && ' • Ethical Analysis'}
                </Typography>
              </Paper>
            </ListItem>
          ))}
        </List>

        {loading && (
          <Box display="flex" alignItems="center" gap={1} p={2}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <PsychologyIcon />
            </Avatar>
            <Paper elevation={1} sx={{ p: 2, flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {ethicalMode ? 'Analyzing through ethical frameworks...' : 'Processing message...'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <Divider />

      {/* Input Area */}
      <Box p={2}>
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={3}
            variant="outlined"
            placeholder={
              ethicalMode 
                ? "Ask an ethical question or describe a moral dilemma..."
                : "Type your message... (ethical queries will be auto-detected)"
            }
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={loading || !currentMessage.trim()}
            sx={{ p: 1.5 }}
          >
            {loading ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>

        {ethicalMode && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            🧠 Ethical Mode: All messages will be analyzed using utilitarian, deontological, virtue ethics, and care ethics frameworks
          </Typography>
        )}
      </Box>
    </Card>
  );
}