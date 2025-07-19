/**
 * System Health Indicator Component
 * Real-time system health visualization with animated indicators
 */

import React from 'react';
import { Box, Typography, CircularProgress, Chip, Tooltip } from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

interface SystemHealthIndicatorProps {
  health: number; // 0-1
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
}

export const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({
  health,
  status,
  label = 'System Health',
  showPercentage = true,
  size = 'medium',
  animate = true,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return '#69F0AE';
      case 'warning':
        return '#FFB74D';
      case 'critical':
        return '#FF5252';
      default:
        return '#666666';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'critical':
        return <ErrorIcon />;
      default:
        return <CircleIcon />;
    }
  };

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { circleSize: 80, strokeWidth: 4, fontSize: '1rem' };
      case 'large':
        return { circleSize: 160, strokeWidth: 8, fontSize: '2rem' };
      default:
        return { circleSize: 120, strokeWidth: 6, fontSize: '1.5rem' };
    }
  };

  const { circleSize, strokeWidth, fontSize } = getSizeProps();
  const normalizedHealth = Math.min(1, Math.max(0, health));

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: animate && status === 'critical' ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%': {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'translate(-50%, -50%) scale(1.1)',
                opacity: 0.8,
              },
              '100%': {
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
              },
            },
          }}
        >
          <CircularProgress
            variant="determinate"
            value={normalizedHealth * 100}
            size={circleSize}
            thickness={strokeWidth}
            sx={{
              color: getStatusColor(),
              transition: 'all 0.5s ease-in-out',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        </Box>
        
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {showPercentage ? (
            <Typography
              variant="h4"
              component="div"
              sx={{
                fontSize,
                fontWeight: 700,
                color: getStatusColor(),
              }}
            >
              {Math.round(normalizedHealth * 100)}%
            </Typography>
          ) : (
            <Box sx={{ color: getStatusColor(), fontSize: fontSize }}>
              {getStatusIcon()}
            </Box>
          )}
        </Box>

        <CircularProgress
          variant="determinate"
          value={100}
          size={circleSize}
          thickness={strokeWidth}
          sx={{
            color: 'rgba(255, 255, 255, 0.1)',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <Tooltip title={`System is ${status}`}>
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor(),
              border: `1px solid ${getStatusColor()}40`,
              fontWeight: 600,
            }}
            icon={getStatusIcon()}
          />
        </Tooltip>
      </Box>

      {animate && (
        <Box
          sx={{
            position: 'absolute',
            width: circleSize * 1.5,
            height: circleSize * 1.5,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getStatusColor()}20 0%, transparent 70%)`,
            animation: 'ripple 2s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
            left: '50%',
            top: '50%',
            pointerEvents: 'none',
            '@keyframes ripple': {
              '0%': {
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: 1,
              },
              '100%': {
                transform: 'translate(-50%, -50%) scale(1.4)',
                opacity: 0,
              },
            },
          }}
        />
      )}
    </Box>
  );
};