---
name: Create Trading Agent
description: Generates a new fully-configured Agent class in the TradeTaper backend that hooks into the LLM orchestrator and EventBus.
---
# TradeTaper: Create Trading Agent Skill

Follow these steps exactly when the user asks to create a new AI Trading Agent for the backend.

1. **Understand Requirements**:
   Ask the user what the agent's name is, what its primary capabilities are, and what keywords should trigger it.

2. **Create the Agent File**:
   Create a new file in `tradetaper-backend/src/agents/implementations/[agent-name].agent.ts`.
   Use the `BaseAgent` class and implement the `processMessage` method. Inject `AgentRegistryService`, `EventBusService`, and `MultiModelOrchestratorService`.

3. **Register the Agent**:
   Open `tradetaper-backend/src/agents/implementations/agents-implementation.module.ts`.
   Add the newly created agent to the `providers` and `exports` arrays. 

4. **Verify Implementation**:
   Ensure the agent correctly defines its `capabilities` array (with `id`, `description`, and `keywords`).
   Ensure the `agentId`, `name`, and `priority` are all assigned as `readonly` class properties.

5. **Test the Build**:
   Run `cd tradetaper-backend && npm run build` to ensure the new typescript code compiles correctly without breaking the nest modules.
