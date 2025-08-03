import express from 'express';
import { ShakaAgentExecutor } from './ShakaAgentExecutor';
import { InMemoryTaskStore } from './ShakaAgentTypes';
import { shakaAgentCard } from './ShakaAgentCard';

export function createShakaA2AServer(executor: ShakaAgentExecutor) {
  const app = express();
  const taskStore = new InMemoryTaskStore();
  
  app.use(express.json());

  // A2A Discovery endpoint
  app.get('/.well-known/ai-agent', (req, res) => {
    res.json({
      name: "Shaka - Ethics & Analysis Agent",
      version: "2.0.0",
      protocol_version: "0.1.0",
      description: "Ethical reasoning and conflict resolution specialist",
      capabilities: shakaAgentCard.capabilities
    });
  });

  // Agent card endpoint
  app.get('/agent-card', (req, res) => {
    res.json(shakaAgentCard);
  });

  // Task execution endpoint
  app.post('/execute', async (req, res) => {
    try {
      const task = req.body;
      const taskId = `shaka-task-${Date.now()}`;
      
      // Store task
      taskStore.addTask({
        id: taskId,
        ...task,
        status: 'processing',
        createdAt: new Date()
      });

      // Execute task
      const result = await executor.executeTask(task);
      
      // Update task status
      taskStore.updateTask(taskId, {
        status: 'completed',
        result: result,
        completedAt: new Date()
      });

      res.json({
        taskId,
        status: 'completed',
        result
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        status: 'failed'
      });
    }
  });

  // Task status endpoint
  app.get('/tasks/:taskId', (req, res) => {
    const task = taskStore.getTask(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  });

  // List all tasks
  app.get('/tasks', (req, res) => {
    const tasks = taskStore.getAllTasks();
    res.json({ tasks });
  });

  // Health check
  app.get('/health', async (req, res) => {
    const status = await executor.getStatus();
    res.json({
      status: 'healthy',
      agent: 'shaka',
      details: status
    });
  });

  // Ethical consultation endpoint (specialized for Shaka)
  app.post('/consult', async (req, res) => {
    try {
      const consultation = {
        skill: 'inter_agent_consultation',
        input: req.body
      };
      
      const result = await executor.executeTask(consultation);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        status: 'failed'
      });
    }
  });

  // Quick ethical assessment endpoint
  app.post('/assess', async (req, res) => {
    try {
      const assessment = {
        skill: 'ethical_risk_assessment',
        input: req.body
      };
      
      const result = await executor.executeTask(assessment);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
        status: 'failed'
      });
    }
  });

  return app;
}