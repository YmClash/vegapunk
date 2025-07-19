/**
 * Metrics Card Component
 * Animated card showing real-time metric updates
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, Skeleton, Trend } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MetricsCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number; // Percentage change
  trendPeriod?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
  animate?: boolean;
  format?: (value: number | string) => string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  unit = '',
  trend,
  trendPeriod = '24h',
  icon,
  color = '#00E5FF',
  loading = false,
  animate = true,
  format,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    if (animate && typeof value === 'number' && typeof displayValue === 'number') {
      const startValue = displayValue as number;
      const endValue = value as number;
      const duration = 1000; // 1 second
      const steps = 60;
      const increment = (endValue - startValue) / steps;
      
      setIsIncreasing(endValue > startValue);
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setDisplayValue(startValue + increment * currentStep);
        } else {
          clearInterval(interval);
          setDisplayValue(endValue);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  const getTrendIcon = () => {
    if (!trend) return <TrendingFlatIcon />;
    return trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text.secondary';
    return trend > 0 ? 'success.main' : 'error.main';
  };

  const formatValue = () => {
    if (format) {
      return format(displayValue);
    }
    if (typeof displayValue === 'number') {
      return displayValue.toFixed(displayValue < 10 ? 1 : 0);
    }
    return displayValue;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" height={60} />
          <Skeleton variant="text" width="40%" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          },
          '&:hover::before': {
            width: 6,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            {icon && (
              <Box sx={{ color, opacity: 0.8 }}>
                {icon}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 700,
                color: isIncreasing && animate ? 'success.main' : 'text.primary',
                transition: 'color 0.3s ease',
              }}
            >
              {formatValue()}
            </Typography>
            {unit && (
              <Typography variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                {unit}
              </Typography>
            )}
          </Box>

          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: getTrendColor(), display: 'flex', alignItems: 'center' }}>
                {getTrendIcon()}
              </Box>
              <Typography variant="body2" color={getTrendColor()}>
                {Math.abs(trend)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                vs {trendPeriod}
              </Typography>
            </Box>
          )}

          {animate && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  backgroundColor: color,
                  animation: 'shimmer 2s infinite',
                  '@keyframes shimmer': {
                    '0%': {
                      transform: 'translateX(-100%)',
                    },
                    '100%': {
                      transform: 'translateX(200%)',
                    },
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};