# Vegapunk Architecture Diagrams

## 1. System Overview

```mermaid
graph TB
    subgraph "External Interfaces"
        UI["🖥️ React Dashboard<br/>(Material-UI)"]
        REST["🔌 REST API<br/>(Express)"]
        GQL["📊 GraphQL API<br/>(Apollo)"]
        WS["🔄 WebSocket<br/>(Subscriptions)"]
    end

    subgraph "Orchestration Layer"
        SO["🎭 StellarOrchestra<br/>(Central Orchestrator)"]
        TA["📋 TaskAllocator"]
        CE["🤝 CollaborationEngine"]
        SYS["⚙️ SystemOptimizer"]
        AMB["📡 AdvancedMessageBus"]
    end

    subgraph "Specialized Agents"
        SHAKA["⚔️ ShakaAgent<br/>(Ethics & Wisdom)"]
        ATLAS["🛡️ AtlasAgent<br/>(Security & Automation)"]
        EDISON["💡 EdisonAgent<br/>(Innovation & Logic)"]
        PYTHAG["📐 PythagorasAgent<br/>(Data & Research)"]
        LILITH["🎨 LilithAgent<br/>(Creativity & Chaos)"]
        YORK["⚡ YorkAgent<br/>(Efficiency & Resources)"]
    end

    subgraph "Core Infrastructure"
        LLM["🧠 LLM Adapter<br/>(Ollama/OpenAI)"]
        MEM["💾 Memory System<br/>(Multi-tier)"]
        KNOW["📚 Knowledge Base"]
        TASK["📝 Task Manager"]
    end

    subgraph "Analytics & Learning"
        AE["📈 Analytics Engine"]
        FL["🔐 Federated Learning"]
        PA["🔒 Privacy Analytics"]
    end

    %% UI Connections
    UI --> REST
    UI --> GQL
    UI --> WS

    %% API to Orchestration
    REST --> SO
    GQL --> SO
    WS --> SO

    %% Orchestration Components
    SO --> TA
    SO --> CE
    SO --> SYS
    SO <--> AMB

    %% Message Bus to Agents
    AMB <--> SHAKA
    AMB <--> ATLAS
    AMB <--> EDISON
    AMB <--> PYTHAG
    AMB <--> LILITH
    AMB <--> YORK

    %% Agents to Infrastructure
    SHAKA --> LLM
    ATLAS --> LLM
    EDISON --> LLM
    PYTHAG --> LLM
    LILITH --> LLM
    YORK --> LLM

    %% Memory connections
    SHAKA <--> MEM
    ATLAS <--> MEM
    EDISON <--> MEM
    PYTHAG <--> MEM
    LILITH <--> MEM
    YORK <--> MEM

    %% Analytics connections
    SO --> AE
    AE --> FL
    AE --> PA
    
    %% Task Manager
    TA --> TASK
    TASK --> AMB

    classDef ui fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef orchestration fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef agent fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef infra fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef analytics fill:#F44336,stroke:#D32F2F,stroke-width:2px,color:#fff

    class UI,REST,GQL,WS ui
    class SO,TA,CE,SYS,AMB orchestration
    class SHAKA,ATLAS,EDISON,PYTHAG,LILITH,YORK agent
    class LLM,MEM,KNOW,TASK infra
    class AE,FL,PA analytics
```

## 2. Agent Architecture Detail

```mermaid
graph TB
    subgraph "Agent Architecture"
        subgraph "Base Agent (AgenticSatellite)"
            CORE["🎯 Core Engine"]
            THINK["🤔 think()"]
            ACT["🎬 act()"]
            EVAL["📊 evaluate()"]
            LEARN["📚 learn()"]
        end

        subgraph "Specialized Components"
            subgraph "ShakaAgent"
                EM["⚖️ EthicalMatrix"]
                WK["🧘 WisdomKeeper"]
                CF["🤲 ConflictResolver"]
            end

            subgraph "AtlasAgent"
                SM["🔍 SecurityMonitor"]
                IR["🚨 IncidentResponder"]
                AUT["🤖 AutomationEngine"]
            end

            subgraph "EdisonAgent"
                PS["🧩 ProblemSolver"]
                IE["💡 InnovationEngine"]
                LE["🧮 LogicEngine"]
            end

            subgraph "PythagorasAgent"
                DA["📊 DataAnalyzer"]
                RE["🔬 ResearchEngine"]
                CE["🧮 ComputationalEngine"]
            end

            subgraph "LilithAgent"
                CR["🎨 CreativityEngine"]
                EX["🌌 ExplorationEngine"]
                QT["🌀 QuantumThinking"]
            end

            subgraph "YorkAgent"
                RO["📈 ResourceOptimizer"]
                SM2["🔧 SystemMaintainer"]
                PE["⚡ PerformanceEngine"]
            end
        end

        subgraph "Shared Systems"
            MEM_SYS["💾 Memory System"]
            LLM_INT["🧠 LLM Interface"]
            MSG_BUS["📡 Message Bus"]
            KNOW_BASE["📚 Knowledge Base"]
        end
    end

    %% Core connections
    CORE --> THINK
    THINK --> ACT
    ACT --> EVAL
    EVAL --> LEARN
    LEARN --> CORE

    %% Shaka connections
    THINK -.-> EM
    THINK -.-> WK
    ACT -.-> CF

    %% Atlas connections
    THINK -.-> SM
    ACT -.-> IR
    ACT -.-> AUT

    %% Edison connections
    THINK -.-> PS
    THINK -.-> IE
    THINK -.-> LE

    %% Pythagoras connections
    THINK -.-> DA
    THINK -.-> RE
    ACT -.-> CE

    %% Lilith connections
    THINK -.-> CR
    THINK -.-> EX
    THINK -.-> QT

    %% York connections
    THINK -.-> RO
    ACT -.-> SM2
    EVAL -.-> PE

    %% Shared system connections
    CORE <--> MEM_SYS
    CORE <--> LLM_INT
    CORE <--> MSG_BUS
    CORE <--> KNOW_BASE

    classDef core fill:#3F51B5,stroke:#303F9F,stroke-width:2px,color:#fff
    classDef specialized fill:#00BCD4,stroke:#0097A7,stroke-width:2px,color:#fff
    classDef shared fill:#FFC107,stroke:#FFA000,stroke-width:2px,color:#000

    class CORE,THINK,ACT,EVAL,LEARN core
    class EM,WK,CF,SM,IR,AUT,PS,IE,LE,DA,RE,CE,CR,EX,QT,RO,SM2,PE specialized
    class MEM_SYS,LLM_INT,MSG_BUS,KNOW_BASE shared
```

## 3. Memory System Architecture

```mermaid
graph LR
    subgraph "Memory Tiers"
        subgraph "Short-term Memory"
            STM["🧠 Working Memory<br/>(100 items)"]
            CACHE["⚡ Quick Cache"]
        end

        subgraph "Long-term Memory"
            LTM["💾 Persistent Storage<br/>(1000+ items)"]
            INDEX["🔍 Semantic Index"]
        end

        subgraph "Episodic Memory"
            EPM["📖 Experience Store<br/>(50 episodes)"]
            CONTEXT["🎯 Context Tracker"]
        end

        subgraph "Semantic Memory"
            SEM["🌐 Knowledge Graph"]
            EMBED["🔢 Embeddings"]
        end
    end

    subgraph "Memory Operations"
        STORE["💾 Store"]
        RETRIEVE["🔍 Retrieve"]
        FORGET["🗑️ Forget"]
        CONSOLIDATE["🔄 Consolidate"]
    end

    %% Flow connections
    STORE --> STM
    STM --> CACHE
    STM --> LTM
    LTM --> INDEX
    
    RETRIEVE --> CACHE
    CACHE --> STM
    INDEX --> LTM
    
    STM --> EPM
    EPM --> CONTEXT
    
    LTM --> SEM
    SEM --> EMBED
    
    FORGET --> STM
    FORGET --> LTM
    
    CONSOLIDATE --> STM
    CONSOLIDATE --> LTM
    CONSOLIDATE --> EPM

    classDef memory fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef operation fill:#607D8B,stroke:#455A64,stroke-width:2px,color:#fff

    class STM,CACHE,LTM,INDEX,EPM,CONTEXT,SEM,EMBED memory
    class STORE,RETRIEVE,FORGET,CONSOLIDATE operation
```

## 4. LLM Integration Architecture

```mermaid
graph TB
    subgraph "LLM Adapters"
        FACTORY["🏭 LLMAdapterFactory"]
        
        subgraph "Providers"
            OLLAMA["🦙 OllamaAdapter<br/>(Primary)"]
            OPENAI["🤖 OpenAIAdapter"]
            MISTRAL["🌟 MistralAdapter"]
            FUTURE["🔮 Future Providers"]
        end

        subgraph "Features"
            CHAT["💬 Chat Completion"]
            STREAM["🌊 Streaming"]
            EMBED2["🔢 Embeddings"]
            MODELS["📦 Model Management"]
        end
    end

    subgraph "Ollama Specific"
        PULL["⬇️ Pull Models"]
        CREATE["🛠️ Create Models"]
        MODELFILE["📄 Modelfiles"]
        LOCAL["💾 Local Storage"]
    end

    subgraph "Enhanced Provider"
        ENHANCED["✨ EnhancedLLMProvider"]
        BRIDGE["🌉 Bridge Pattern"]
        AUTO["🔄 Auto-detect"]
        RETRY["🔁 Retry Logic"]
    end

    %% Factory connections
    FACTORY --> OLLAMA
    FACTORY --> OPENAI
    FACTORY --> MISTRAL
    FACTORY -.-> FUTURE

    %% Feature connections
    OLLAMA --> CHAT
    OLLAMA --> STREAM
    OLLAMA --> EMBED2
    OLLAMA --> MODELS

    OPENAI --> CHAT
    OPENAI --> STREAM
    OPENAI --> EMBED2

    %% Ollama specific
    MODELS --> PULL
    MODELS --> CREATE
    CREATE --> MODELFILE
    PULL --> LOCAL
    CREATE --> LOCAL

    %% Enhanced provider
    ENHANCED --> BRIDGE
    BRIDGE --> FACTORY
    ENHANCED --> AUTO
    ENHANCED --> RETRY

    classDef provider fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef feature fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef ollama fill:#FF5722,stroke:#E64A19,stroke-width:2px,color:#fff
    classDef enhanced fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff

    class OLLAMA,OPENAI,MISTRAL,FUTURE provider
    class CHAT,STREAM,EMBED2,MODELS feature
    class PULL,CREATE,MODELFILE,LOCAL ollama
    class ENHANCED,BRIDGE,AUTO,RETRY enhanced
```

## 5. Task Orchestration Flow

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Orchestra as StellarOrchestra
    participant Allocator as TaskAllocator
    participant Bus as MessageBus
    participant Agent1 as Agent 1
    participant Agent2 as Agent 2
    participant Analytics

    User->>API: Submit Task
    API->>Orchestra: Process Task Request
    
    Orchestra->>Allocator: Analyze Task Requirements
    Allocator->>Allocator: Score Agents
    Allocator-->>Orchestra: Allocation Plan
    
    Orchestra->>Bus: Broadcast Task
    
    par Agent Execution
        Bus->>Agent1: Task Assignment
        Agent1->>Agent1: think()
        Agent1->>Agent1: act()
        Agent1->>Agent1: evaluate()
        Agent1-->>Bus: Task Result
    and
        Bus->>Agent2: Sub-task Assignment
        Agent2->>Agent2: think()
        Agent2->>Agent2: act()
        Agent2->>Agent2: evaluate()
        Agent2-->>Bus: Sub-task Result
    end
    
    Bus-->>Orchestra: Aggregated Results
    Orchestra->>Orchestra: Validate & Combine
    
    Orchestra->>Analytics: Record Metrics
    Analytics-->>Orchestra: Performance Insights
    
    Orchestra-->>API: Final Result
    API-->>User: Task Complete
```

## 6. Analytics & Privacy Flow

```mermaid
graph TB
    subgraph "Data Collection"
        AGENTS["🤖 Agent Metrics"]
        SYSTEM["⚙️ System Metrics"]
        TASKS["📋 Task Metrics"]
        COLLAB["🤝 Collaboration Data"]
    end

    subgraph "Analytics Engine"
        COLLECT["📊 Metric Collection"]
        ANOMALY["🚨 Anomaly Detection"]
        INSIGHTS["💡 Insight Generation"]
        REPORTS["📈 Reporting"]
    end

    subgraph "Privacy Layer"
        DIFF["🔐 Differential Privacy"]
        KANON["👥 K-Anonymity"]
        MPC["🤝 Secure MPC"]
        HOMO["🔒 Homomorphic Ops"]
    end

    subgraph "Federated Learning"
        ROUNDS["🔄 Learning Rounds"]
        AGG["📊 Aggregation"]
        MODELS["🧠 Model Updates"]
        VALID["✅ Validation"]
    end

    subgraph "Output"
        DASHBOARD["📊 Analytics Dashboard"]
        EXPORT["💾 Data Export"]
        ALERTS["🚨 Real-time Alerts"]
    end

    %% Collection flow
    AGENTS --> COLLECT
    SYSTEM --> COLLECT
    TASKS --> COLLECT
    COLLAB --> COLLECT

    %% Analytics flow
    COLLECT --> ANOMALY
    COLLECT --> INSIGHTS
    ANOMALY --> INSIGHTS
    INSIGHTS --> REPORTS

    %% Privacy flow
    COLLECT --> DIFF
    DIFF --> KANON
    KANON --> MPC
    MPC --> HOMO

    %% Federated flow
    HOMO --> ROUNDS
    ROUNDS --> AGG
    AGG --> MODELS
    MODELS --> VALID

    %% Output flow
    REPORTS --> DASHBOARD
    REPORTS --> EXPORT
    ANOMALY --> ALERTS
    VALID --> DASHBOARD

    classDef data fill:#00BCD4,stroke:#0097A7,stroke-width:2px,color:#fff
    classDef analytics fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef privacy fill:#F44336,stroke:#D32F2F,stroke-width:2px,color:#fff
    classDef federated fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef output fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff

    class AGENTS,SYSTEM,TASKS,COLLAB data
    class COLLECT,ANOMALY,INSIGHTS,REPORTS analytics
    class DIFF,KANON,MPC,HOMO privacy
    class ROUNDS,AGG,MODELS,VALID federated
    class DASHBOARD,EXPORT,ALERTS output
```

## 7. Dashboard UI Architecture

```mermaid
graph TB
    subgraph "Frontend Stack"
        REACT["⚛️ React 18"]
        VITE["⚡ Vite"]
        MUI["🎨 Material-UI"]
        APOLLO["🚀 Apollo Client"]
    end

    subgraph "Pages"
        DASH["📊 Dashboard"]
        AGENTS_PAGE["🤖 Agents"]
        TASKS_PAGE["📋 Tasks"]
        WORKFLOWS["🔄 Workflows"]
        METRICS["📈 Metrics"]
        ANALYTICS_PAGE["📊 Analytics"]
    end

    subgraph "Components"
        CHARTS["📈 Real-time Charts"]
        DIALOGS["🗨️ Agent Dialogs"]
        VISUAL["🎨 Visualizations"]
        FORMS["📝 Forms"]
    end

    subgraph "Real-time Features"
        WS_SUB["🔄 WebSocket Subs"]
        HOOKS["🪝 Custom Hooks"]
        NOTIFY["🔔 Notifications"]
        STREAM_UI["🌊 Live Updates"]
    end

    subgraph "State Management"
        CONTEXT["🎯 React Context"]
        CACHE["💾 Apollo Cache"]
        LOCAL["📦 Local Storage"]
    end

    %% Stack connections
    REACT --> MUI
    REACT --> APOLLO
    VITE --> REACT

    %% Page connections
    REACT --> DASH
    REACT --> AGENTS_PAGE
    REACT --> TASKS_PAGE
    REACT --> WORKFLOWS
    REACT --> METRICS
    REACT --> ANALYTICS_PAGE

    %% Component usage
    DASH --> CHARTS
    AGENTS_PAGE --> DIALOGS
    WORKFLOWS --> VISUAL
    ANALYTICS_PAGE --> CHARTS

    %% Real-time
    APOLLO --> WS_SUB
    WS_SUB --> HOOKS
    HOOKS --> NOTIFY
    HOOKS --> STREAM_UI

    %% State
    REACT --> CONTEXT
    APOLLO --> CACHE
    CONTEXT --> LOCAL

    classDef stack fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef page fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef component fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef realtime fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef state fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff

    class REACT,VITE,MUI,APOLLO stack
    class DASH,AGENTS_PAGE,TASKS_PAGE,WORKFLOWS,METRICS,ANALYTICS_PAGE page
    class CHARTS,DIALOGS,VISUAL,FORMS component
    class WS_SUB,HOOKS,NOTIFY,STREAM_UI realtime
    class CONTEXT,CACHE,LOCAL state
```