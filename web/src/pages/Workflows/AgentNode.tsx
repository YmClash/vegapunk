/**
 * Agent Node Component for ReactFlow
 * Custom node representing an agent in the workflow graph
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography, Chip, Avatar } from '@mui/material';

const agentColors: Record<string, string> = {
  ATLAS: '#00E5FF',
  EDISON: '#FF4081',
  PYTHAGORAS: '#69F0AE',
  LILITH: '#FFB74D',
  YORK: '#40C4FF',
  SHAKA: '#B388FF',
};

export const AgentNode: React.FC<NodeProps> = ({ data, isConnectable }) => {
  const agentType = data.agentType || 'UNKNOWN';
  const color = agentColors[agentType] || '#666';

  return (
    <Box
      sx={{
        background: 'linear-gradient(145deg, #1A1F3A 0%, #141832 100%)',
        border: '2px solid',
        borderColor: color,
        borderRadius: 2,
        padding: 2,
        minWidth: 180,
        boxShadow: `0 4px 20px ${color}40`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 30px ${color}60`,
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{
          background: color,
          width: 10,
          height: 10,
          border: '2px solid #1A1F3A',
        }}
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: color,
            width: 32,
            height: 32,
            fontSize: '0.875rem',
          }}
        >
          {agentType[0]}
        </Avatar>
        <Box>
          <Typography variant="body1" fontWeight={600} color="white">
            {data.label}
          </Typography>
          <Chip
            label={agentType}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.75rem',
              bgcolor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`,
            }}
          />
        </Box>
      </Box>

      {data.config && (
        <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Config: {JSON.stringify(data.config).slice(0, 50)}...
          </Typography>
        </Box>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{
          background: color,
          width: 10,
          height: 10,
          border: '2px solid #1A1F3A',
        }}
      />
    </Box>
  );
};