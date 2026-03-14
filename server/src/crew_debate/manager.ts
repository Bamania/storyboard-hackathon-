import { FunctionTool, LoopAgent, SequentialAgent } from "@google/adk";
import { cinematographerAgent, directorAgent, editorAgent, productionDesignerAgent } from "./agents.js";
import z from "zod";

// this will run the agent in sequence ! 
// const pipeline=new SequentialAgent({name:'SceneOrchestrator',subAgents:[directorAgent,cinematographerAgent,editorAgent,productionDesignerAgent  ]})



export const rootAgent=new LoopAgent({
  name:'SceneOrchestrator',
  subAgents:[directorAgent,cinematographerAgent,editorAgent,productionDesignerAgent],
  maxIterations:2,
  description:`An agent that orchestrates creative decisions for a scene in a screenplay. It runs in a loop, passes the
   current InvocationContext to each crew member sub-agent (Director, Cinematographer, Editor, Production Designer) on every iteration,
   For eg it passes the whole initialState to eachAgent ,so that agent could keep knowing what is the value of the initialState after each iteration !`,
 

})