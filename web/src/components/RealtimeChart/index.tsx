/**
 * Real-time Chart Component
 * Displays live updating metrics with smooth animations
 */

import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  time: string;
  [key: string]: any;
}

interface RealtimeChartProps {
  title: string;
  data: DataPoint[];
  lines?: Array<{
    dataKey: string;
    color: string;
    name: string;
    type?: 'line' | 'area';
  }>;
  height?: number;
  maxDataPoints?: number;
  updateInterval?: number;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({
  title,
  data: initialData,
  lines = [],
  height = 300,
  maxDataPoints = 50,
  updateInterval = 1000,
}) => {
  const theme = useTheme();
  const [data, setData] = useState<DataPoint[]>(initialData);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Simulate real-time data updates (replace with actual data source)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newPoint: DataPoint = {
        time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`,
      };

      // Generate random data for each line
      lines.forEach(line => {
        const lastValue = dataRef.current[dataRef.current.length - 1]?.[line.dataKey] || 50;
        const change = (Math.random() - 0.5) * 10;
        newPoint[line.dataKey] = Math.max(0, Math.min(100, lastValue + change));
      });

      setData(prevData => {
        const newData = [...prevData, newPoint];
        return newData.slice(-maxDataPoints);
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [lines, maxDataPoints, updateInterval]);

  const hasAreaChart = lines.some(line => line.type === 'area');

  const renderChart = () => {
    if (hasAreaChart) {
      return (
        <AreaChart data={data}>
          <defs>
            {lines.map(line => (
              <linearGradient key={line.dataKey} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={line.color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={line.color} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}
          />
          <Legend />
          {lines.map(line => (
            line.type === 'area' ? (
              <Area
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                fill={`url(#gradient-${line.dataKey})`}
                strokeWidth={2}
                name={line.name}
              />
            ) : (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                name={line.name}
              />
            )
          ))}
        </AreaChart>
      );
    }

    return (
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey="time" 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.5)"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
          }}
        />
        <Legend />
        {lines.map(line => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            name={line.name}
            animationDuration={300}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};