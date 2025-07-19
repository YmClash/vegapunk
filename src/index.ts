import 'dotenv/config';
import { logger } from './utils/logger';
import { startDashboardOnly } from './dashboard-bootstrap';

// 🚫 TEMPORAIREMENT COMMENTÉ - À RÉACTIVER PROGRESSIVEMENT
// import { StellarOrchestra } from './orchestration/StellarOrchestra';
// import { AtlasAgent } from './agents/atlas/AtlasAgent';
// import { EdisonAgent } from './agents/edison/EdisonAgent';
// import { ShakaAgent } from './agents/shaka/ShakaAgent';
// import { YorkAgent } from './agents/york/YorkAgent';
// import { PythagorasAgent } from './agents/pythagoras/PythagorasAgent';
// import { LilithAgent } from './agents/lilith/LilithAgent';

// ✅ ACTIF - Dashboard + Chat seulement
async function startVegapunkDashboard(): Promise<void> {
  try {
    logger.info('🚀 Starting Vegapunk Dashboard with Chat...');
    logger.info('📊 Phase 1: Dashboard + Ollama Integration');
    
    // Phase 1: Dashboard + Ollama Chat seulement
    await startDashboardOnly();
    
    // 🚫 PHASE 2 - À réactiver plus tard
    // await initializeAgents();
    // await startOrchestration();
    
  } catch (error) {
    logger.error('❌ Failed to start Vegapunk Dashboard:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('⚠️ Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⚠️ Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the dashboard application
void startVegapunkDashboard();