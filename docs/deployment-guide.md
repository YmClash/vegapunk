# Guide de Déploiement - Vegapunk Agentic System

## 🚀 Guide de Déploiement Complet

### Prérequis Système

#### Versions Minimales
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **RAM**: >= 4GB recommandé (minimum 2GB)
- **Storage**: >= 2GB d'espace libre
- **OS**: Linux, macOS, Windows (WSL2 recommandé)

#### Services Externes (Optionnels)
- **Redis**: Pour cache mémoire distribué
- **Neo4j**: Pour graphe de connaissances
- **PostgreSQL**: Pour stockage persistant
- **Ollama**: Pour modèles LLM locaux

### Installation Rapide

#### 1. Clone et Setup
```bash
git clone https://github.com/yourusername/vegapunk.git
cd vegapunk
npm install
```

#### 2. Configuration Environment
```bash
cp .env.example .env
# Éditer .env avec vos configurations
```

#### 3. Validation Système
```bash
npm run test:health
npm run validate
```

#### 4. Build et Démarrage
```bash
npm run build
npm start
```

## 🔧 Configurations de Déploiement

### Développement Local

#### Configuration Standard
```bash
# .env
NODE_ENV=development
LLM_PROVIDER=ollama
OLLAMA_MODEL=mistral:latest
PROACTIVE_MONITORING=true
ETHICAL_STRICTNESS=balanced
```

#### Démarrage Développement
```bash
npm run dev
# Ou avec Docker
docker-compose up -d
```

### Production

#### Configuration Production
```bash
# .env.production
NODE_ENV=production
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
LLM_MODEL=gpt-4
REDIS_URL=redis://redis-server:6379
DATABASE_URL=postgresql://user:pass@postgres:5432/vegapunk
LOG_LEVEL=info
LOG_FORMAT=json
METRICS_ENABLED=true
```

#### Build Production
```bash
npm run build
npm run start

# Ou avec Docker
docker build -t vegapunk-agentic .
docker run -p 3000:3000 --env-file .env.production vegapunk-agentic
```

### Cloud Déploiement (AWS/Azure/GCP)

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vegapunk-agentic
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vegapunk-agentic
  template:
    metadata:
      labels:
        app: vegapunk-agentic
    spec:
      containers:
      - name: vegapunk
        image: vegapunk-agentic:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LLM_PROVIDER
          value: "openai"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## ⚙️ Configuration Détaillée

### ShakaAgent Configuration

#### Mode Strict (Haute Sécurité)
```typescript
const shakaConfig = {
  ethicalStrictness: 'strict',
  proactiveMonitoring: true,
  conflictResolution: true,
  learningEnabled: false, // Désactivé en mode strict
  autonomyLevel: 7,
  requiresApproval: true
};
```

#### Mode Équilibré (Recommandé)
```typescript
const shakaConfig = {
  ethicalStrictness: 'balanced',
  proactiveMonitoring: true,
  conflictResolution: true,
  learningEnabled: true,
  autonomyLevel: 8,
  requiresApproval: false
};
```

#### Mode Permissif (Développement)
```typescript
const shakaConfig = {
  ethicalStrictness: 'permissive',
  proactiveMonitoring: true,
  conflictResolution: true,
  learningEnabled: true,
  autonomyLevel: 9,
  requiresApproval: false
};
```

### LLM Provider Setup

#### OpenAI
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
LLM_MODEL=gpt-4
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2048
```

#### Mistral AI
```bash
LLM_PROVIDER=mistral
MISTRAL_API_KEY=your-mistral-key
LLM_MODEL=mistral-large-latest
```

#### Ollama (Local)
```bash
LLM_PROVIDER=ollama
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=mistral:latest
```

## 📊 Monitoring et Observabilité

### Métriques Système
```bash
# Endpoint métriques
curl http://localhost:9090/metrics

# Health check
curl http://localhost:3000/health
```

### Logging Configuration
```bash
# Development
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Production  
LOG_LEVEL=info
LOG_FORMAT=json
```

### Prometheus Integration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'vegapunk-agentic'
    static_configs:
      - targets: ['localhost:9090']
```

## 🔒 Sécurité

### Variables d'Environnement Sensibles
```bash
# Ne jamais committer ces valeurs
OPENAI_API_KEY=sk-...
MISTRAL_API_KEY=...
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
DATABASE_URL=postgresql://...
```

### Garde-fous de Production
```typescript
const productionGuardrails = {
  maxExecutionTime: 300000, // 5 minutes
  maxMemoryUsage: 512, // MB
  maxApiCalls: 1000,
  maxConcurrentOperations: 5,
  ethicalConstraints: [
    'never_compromise_user_safety',
    'maintain_transparency',
    'respect_privacy',
    'ensure_fairness'
  ]
};
```

## 🧪 Tests et Validation

### Tests Pre-Déploiement
```bash
# Validation complète
npm run test:all

# Tests critiques uniquement
npm run ci

# Validation rapide
npm run validate
```

### Tests de Charge
```bash
# Tests de performance
npm run test:performance

# Tests E2E
npm run test:e2e
```

### Health Checks Continus
```bash
# Vérification système
npm run test:health

# Monitoring continu
watch -n 30 'curl -s http://localhost:3000/health'
```

## 🔄 Mise à Jour et Maintenance

### Mise à Jour Graduelle
```bash
# 1. Backup configuration
cp .env .env.backup

# 2. Test en environnement staging
git checkout new-version
npm run test:all

# 3. Déploiement production
npm run build
npm run start

# 4. Validation post-déploiement
npm run validate
```

### Rollback Procédure
```bash
# Retour version précédente
git checkout previous-stable-version
npm run build
npm run start
```

## 📱 APIs et Endpoints

### Endpoints Principaux
```bash
# Agent status
GET /api/agents/shaka/status

# Ethical analysis
POST /api/agents/shaka/analyze
{
  "action": "process_data",
  "context": {...}
}

# Metrics
GET /api/metrics

# Health
GET /health
```

### WebSocket Events
```javascript
// Connexion monitoring
const ws = new WebSocket('ws://localhost:3001');

ws.on('agent:status', (data) => {
  console.log('Agent status:', data);
});

ws.on('alert:created', (alert) => {
  console.log('New alert:', alert);
});
```

## 🐛 Dépannage

### Problèmes Courants

#### LLM Provider Indisponible
```bash
# Vérifier connectivité
curl http://localhost:11434/api/tags

# Fallback automatique activé
LLM_PROVIDER=auto
```

#### Mémoire Insuffisante
```bash
# Réduire capacité mémoire
MEMORY_MAX_SIZE=500
MEMORY_CACHE_TTL=1800

# Monitoring mémoire
node --max-old-space-size=1024 dist/index.js
```

#### Performance Dégradée
```bash
# Réduire concurrence
AGENT_MAX_CONCURRENT_TASKS=3
AGENT_CYCLE_INTERVAL=5000

# Désactiver apprentissage temporairement
ENABLE_LEARNING=false
```

### Logs de Debug
```bash
# Mode debug détaillé
LOG_LEVEL=debug
ENABLE_DEBUG_MODE=true

# Suivre logs en temps réel
tail -f logs/combined.log
```

## 📞 Support et Maintenance

### Contacts d'Urgence
- **Issues GitHub**: [Repository Issues](https://github.com/yourusername/vegapunk/issues)
- **Documentation**: `/docs` dans le repository
- **Community**: Discord/Slack channel

### Maintenance Planifiée
- **Backup quotidien**: Automatique
- **Updates sécurité**: Mensuel
- **Performance review**: Trimestriel
- **Architecture review**: Semestriel

---

**Status**: Production Ready ✅  
**Dernière mise à jour**: 2025-01-07  
**Version**: 1.0.0