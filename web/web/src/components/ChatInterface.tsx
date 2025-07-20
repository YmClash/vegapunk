import React, { useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Clear as ClearIcon,
  Stream as StreamIcon
} from '@mui/icons-material';
import { useChatContext } from '../contexts/ChatContext';

export function ChatInterface() {
  const {
    messages,
    currentMessage,
    isTyping,
    connected,
    streamMode,
    currentStreamMessage,
    setCurrentMessage,
    setStreamMode,
    sendMessage,
    clearMessages
  } = useChatContext();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim() || !connected) return;
    sendMessage(currentMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    clearMessages();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Box sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            size="small"
            label={connected ? 'Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            variant="outlined"
          />
          <FormControlLabel
            control={
              <Switch
                checked={streamMode}
                onChange={(e) => setStreamMode(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box display="flex" alignItems="center" gap={0.5}>
                <StreamIcon fontSize="small" />
                <Typography variant="caption">Stream</Typography>
              </Box>
            }
          />
        </Box>
        <Tooltip title="Clear chat history">
          <IconButton onClick={handleClearChat} size="small">
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages Area */}
      <Paper 
        variant="outlined" 
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          backgroundColor: 'background.default',
          p: 2
        }}
      >
        <List>
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  gap: 1,
                  px: 0
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                    width: 36,
                    height: 36
                  }}
                >
                  {message.sender === 'user' ? <UserIcon /> : <BotIcon />}
                </Avatar>
                <Box
                  sx={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      backgroundColor: message.sender === 'user' 
                        ? 'primary.dark' 
                        : 'background.paper',
                      borderRadius: 2,
                      borderTopLeftRadius: message.sender === 'bot' ? 0 : 16,
                      borderTopRightRadius: message.sender === 'user' ? 0 : 16,
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>
                  </Paper>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 0.5, px: 1 }}
                  >
                    {formatTime(message.timestamp)}
                  </Typography>
                </Box>
              </ListItem>
              {index < messages.length - 1 && <Divider sx={{ my: 1 }} />}
            </React.Fragment>
          ))}
          
          {/* Streaming Message */}
          {currentStreamMessage && (
            <ListItem 
              alignItems="flex-start"
              sx={{ 
                flexDirection: 'row',
                gap: 1,
                px: 0
              }}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                <BotIcon />
              </Avatar>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  borderTopLeftRadius: 0,
                  maxWidth: '70%'
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {currentStreamMessage}
                  <span className="typing-cursor">▋</span>
                </Typography>
              </Paper>
            </ListItem>
          )}
          
          {/* Typing Indicator */}
          {isTyping && !currentStreamMessage && (
            <ListItem alignItems="center" sx={{ px: 0 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', mr: 1, width: 36, height: 36 }}>
                <BotIcon />
              </Avatar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Vegapunk is thinking...
                </Typography>
              </Box>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={connected ? "Type your message..." : "Connecting to chat server..."}
          disabled={isTyping || !connected}
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!currentMessage.trim() || isTyping || !connected}
          endIcon={<SendIcon />}
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            height: 'fit-content',
            alignSelf: 'flex-end'
          }}
        >
          Send
        </Button>
      </Box>

      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0; }
            100% { opacity: 1; }
          }
          .typing-cursor {
            animation: blink 1s infinite;
            color: #00bcd4;
          }
        `}
      </style>
    </Box>
  );
}