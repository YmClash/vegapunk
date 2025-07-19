/**
 * Real-time Metrics Hook
 * Subscribes to GraphQL subscriptions for live metrics updates
 */

import { useEffect, useState } from 'react';
import { useSubscription, gql } from '@apollo/client';
import { useSnackbar } from 'notistack';

// GraphQL Subscriptions
const AGENT_STATUS_SUBSCRIPTION = gql`
  subscription OnAgentStatusChanged($agentId: UUID) {
    agentStatusChanged(agentId: $agentId) {
      agentId
      agentName
      previousStatus
      newStatus
      timestamp
    }
  }
`;

const TASK_STATUS_SUBSCRIPTION = gql`
  subscription OnTaskStatusChanged($taskId: UUID) {
    taskStatusChanged(taskId: $taskId) {
      taskId
      taskDescription
      previousStatus
      newStatus
      assignedAgent
      timestamp
    }
  }
`;

const PERFORMANCE_METRICS_SUBSCRIPTION = gql`
  subscription OnPerformanceMetrics {
    performanceMetrics {
      timestamp
      systemLoad
      activeAgents
      tasksInProgress
      averageResponseTime
      errorRate
    }
  }
`;

const SYSTEM_EVENT_SUBSCRIPTION = gql`
  subscription OnSystemEvent($severity: EventSeverity) {
    systemEvent(severity: $severity) {
      id
      type
      severity
      message
      timestamp
      affectedComponents
    }
  }
`;

export interface RealtimeMetrics {
  systemLoad: number;
  activeAgents: number;
  tasksInProgress: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdate: Date;
}

export interface SystemEvent {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: Date;
  affectedComponents: string[];
}

interface UseRealtimeMetricsOptions {
  enableNotifications?: boolean;
  agentId?: string;
  taskId?: string;
  severityFilter?: string;
}

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions = {}) {
  const { enqueueSnackbar } = useSnackbar();
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    systemLoad: 0,
    activeAgents: 0,
    tasksInProgress: 0,
    averageResponseTime: 0,
    errorRate: 0,
    lastUpdate: new Date(),
  });
  const [events, setEvents] = useState<SystemEvent[]>([]);

  // Agent status subscription
  const { data: agentStatusData } = useSubscription(AGENT_STATUS_SUBSCRIPTION, {
    variables: { agentId: options.agentId },
    skip: !options.agentId && options.agentId !== null,
  });

  // Task status subscription
  const { data: taskStatusData } = useSubscription(TASK_STATUS_SUBSCRIPTION, {
    variables: { taskId: options.taskId },
    skip: !options.taskId && options.taskId !== null,
  });

  // Performance metrics subscription
  const { data: performanceData } = useSubscription(PERFORMANCE_METRICS_SUBSCRIPTION);

  // System events subscription
  const { data: systemEventData } = useSubscription(SYSTEM_EVENT_SUBSCRIPTION, {
    variables: { severity: options.severityFilter },
  });

  // Handle agent status changes
  useEffect(() => {
    if (agentStatusData?.agentStatusChanged && options.enableNotifications) {
      const { agentName, previousStatus, newStatus } = agentStatusData.agentStatusChanged;
      const severity = newStatus === 'ERROR' ? 'error' : 
                      newStatus === 'ACTIVE' ? 'success' : 'info';
      
      enqueueSnackbar(
        `Agent ${agentName}: ${previousStatus} → ${newStatus}`,
        { variant: severity }
      );
    }
  }, [agentStatusData, options.enableNotifications, enqueueSnackbar]);

  // Handle task status changes
  useEffect(() => {
    if (taskStatusData?.taskStatusChanged && options.enableNotifications) {
      const { taskDescription, newStatus } = taskStatusData.taskStatusChanged;
      const severity = newStatus === 'FAILED' ? 'error' : 
                      newStatus === 'COMPLETED' ? 'success' : 'info';
      
      enqueueSnackbar(
        `Task: ${taskDescription} - ${newStatus}`,
        { variant: severity }
      );
    }
  }, [taskStatusData, options.enableNotifications, enqueueSnackbar]);

  // Update performance metrics
  useEffect(() => {
    if (performanceData?.performanceMetrics) {
      setMetrics({
        ...performanceData.performanceMetrics,
        lastUpdate: new Date(performanceData.performanceMetrics.timestamp),
      });
    }
  }, [performanceData]);

  // Handle system events
  useEffect(() => {
    if (systemEventData?.systemEvent) {
      const event = {
        ...systemEventData.systemEvent,
        timestamp: new Date(systemEventData.systemEvent.timestamp),
      };

      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep last 100 events

      if (options.enableNotifications) {
        const severity = event.severity === 'CRITICAL' ? 'error' :
                        event.severity === 'WARNING' ? 'warning' : 'info';
        
        enqueueSnackbar(event.message, { 
          variant: severity,
          persist: event.severity === 'CRITICAL',
        });
      }
    }
  }, [systemEventData, options.enableNotifications, enqueueSnackbar]);

  return {
    metrics,
    events,
    isConnected: true, // You can add WebSocket connection state here
  };
}

// Hook for subscribing to workflow execution updates
export function useWorkflowExecution(workflowId: string) {
  const WORKFLOW_STATE_SUBSCRIPTION = gql`
    subscription OnWorkflowStateChanged($workflowId: UUID!) {
      workflowStateChanged(workflowId: $workflowId) {
        messages
        currentAgent
        taskStatus
        collaborationState
        workflowMetadata
      }
    }
  `;

  const { data, loading, error } = useSubscription(WORKFLOW_STATE_SUBSCRIPTION, {
    variables: { workflowId },
  });

  return {
    state: data?.workflowStateChanged,
    loading,
    error,
  };
}

// Hook for subscribing to collaboration updates
export function useCollaborationUpdates(collaborationId: string) {
  const COLLABORATION_UPDATE_SUBSCRIPTION = gql`
    subscription OnCollaborationUpdated($collaborationId: UUID) {
      collaborationUpdated(collaborationId: $collaborationId) {
        id
        status
        progress
        participants
        lastUpdate
      }
    }
  `;

  const MESSAGE_RECEIVED_SUBSCRIPTION = gql`
    subscription OnMessageReceived($collaborationId: UUID!) {
      messageReceived(collaborationId: $collaborationId) {
        id
        sender {
          id
          name
        }
        content
        timestamp
        priority
      }
    }
  `;

  const { data: updateData } = useSubscription(COLLABORATION_UPDATE_SUBSCRIPTION, {
    variables: { collaborationId },
  });

  const { data: messageData } = useSubscription(MESSAGE_RECEIVED_SUBSCRIPTION, {
    variables: { collaborationId },
  });

  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (messageData?.messageReceived) {
      setMessages(prev => [...prev, messageData.messageReceived]);
    }
  }, [messageData]);

  return {
    collaboration: updateData?.collaborationUpdated,
    messages,
  };
}