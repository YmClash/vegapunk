# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vegapunk is an agentic AI project inspired by the One Piece character, designed to create autonomous agents (satellites) based on LLMs for collaborative intelligence tasks. The agents specialize in areas like ethics, creativity, innovation, analysis, execution, and coding.

## Repository Status

This is currently an empty repository with only initial setup files (README.md and LICENSE).

## Development Guidelines

As this is a new project focused on creating agentic AI systems, future development should consider:

1. **Architecture**: When implementing the multi-agent system, ensure clear separation between different agent roles (ethics, creativity, innovation, analysis, execution, coding)

2. **Agent Communication**: Design robust inter-agent communication protocols for the collective intelligence aspect

3. **Modularity**: Each "satellite" agent should be a separate module with well-defined interfaces

## Common Commands

```bash
# Development
npm run dev              # Start in development mode with hot reload
npm run build           # Build for production
npm start               # Run production build

# Testing
npm test                # Run all tests with coverage
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests
npm run test:watch      # Run tests in watch mode

# Code Quality
npm run lint            # Check code style
npm run lint:fix        # Fix code style issues
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types

# Docker
docker-compose up -d    # Start all services
docker-compose down     # Stop all services
docker-compose logs -f  # View logs
```

## Key Architecture Guidelines

Based on Anthropic's "Building Effective Agents" best practices:

1. **Start Simple**: Begin with basic workflows before adding agent autonomy
2. **Clear Tool Interfaces**: Every agent tool must have well-defined inputs/outputs
3. **Guardrails First**: Implement safety limits before autonomous features
4. **Iterative Development**: Build → Test → Measure → Improve

## Important Files

- `/docs/anthropic-building-effective-agents.md` - Architecture best practices
- `/vegapunk_agentic_implementation_guide.md` - Detailed implementation guide
- `/Phase1_note.md` - Current development progress tracking