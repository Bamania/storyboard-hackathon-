/**
 * coordinator.ts — retired.
 *
 * The coordinator LLM agent is no longer needed. Sequencing is handled
 * directly in SceneOrchestratorAgent (scene_orchestrator.ts) which runs
 * 2 rounds of [Director → Cinematographer → Editor → ProductionDesigner]
 * per scene. Each agent writes its own parameters via a dedicated tool.
 */


