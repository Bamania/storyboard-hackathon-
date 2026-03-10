# 🎬 THE CRUCIBLE STUDIO: Project Architecture & Design Rules

## 1. Project Overview
The Crucible Studio is an AI-powered cinematic pre-production suite. It uses a multi-agent "Virtual Film Crew" to translate directorial text prompts into physically accurate, continuity-checked storyboard sequences. It prioritizes real-world camera physics and lighting rules over generic AI image generation.

## 2. Tech Stack & Repository Structure
* **Architecture:** Monorepo (`/client` and `/server`).
* **Frontend:** React + Vite + TypeScript.
* **UI/Styling:** Ant Design (AntD) + Tailwind CSS. 
* **Canvas Engine:** React-Konva / Konva (for drawing vector arrows/markup over images).
* **Backend:** Node.js + Express + TypeScript.
* **AI Orchestration:** Google Agent Development Kit (ADK) + Gemini 1.5 Pro/Flash + Imagen 3.

## 3. UI/UX Design System (STRICTLY ENFORCED)
The application must feel like professional cinematic software (e.g., DaVinci Resolve, Figma, Unreal Engine). NO generic B2B SaaS aesthetics.

* **Theme:** Ultra-minimalist OLED Dark Mode.
* **Colors:**
  * App Background: Deep OLED Black (`#0a0a0a`)
  * Surface/Containers: Charcoal (`#121212` or `#1a1a1a`)
  * Primary Accent: Muted Neon Blue (`#00e5ff`) for active states/buttons.
  * Warning/Alert: Amber (`#ffb300`) for agent physics/continuity conflicts.
* **Typography:**
  * UI Elements (Buttons, Headers): Clean sans-serif (`Inter` or `San Francisco`).
  * Technical Data & Logs: Monospace (`Roboto Mono`).
* **Component Usage:** Use Ant Design (`<Input>`, `<Slider>`, `<Collapse>`, `<Modal>`) for heavy functionality, but rely on Tailwind utility classes for layout, padding, and flexbox positioning.

## 4. The Multi-Agent Architecture (The Virtual Crew)
The backend utilizes the Google ADK to orchestrate specialized agents. Copilot must structure API routes to handle asynchronous agent debate, not just single text-to-image API calls.

1.  **Director/Orchestrator:** Manages the worker agents and handles the main loop.
2.  **Script Analyst:** Parses subtext and pacing. Uses NLP to split single sentences with multiple verbs into distinct storyboard panels.
3.  **DP (Cinematographer) Agent:** Controls Optics. Outputs strict parameters: Focal Length (mm), Sensor Size, Aperture (f-stop). Adjusts prompt weights for aspect-ratio cropping.
4.  **Gaffer (Lighting) Agent:** Controls Illumination. Outputs parameters: Color Temp (Kelvin), Contrast Ratio, Volumetric Haze. Maintains 3D spatial lighting logic across reverse shots.
5.  **Script Supervisor (Continuity):** Checks the database against the 180-degree rule and enforces global "Character Seeds" to maintain facial consistency across the sequence.
6.  **Line Producer (Physics Logic):** A strict validation tool/agent that throws errors if the DP and Gaffer parameters violate real-world physics (e.g., trying to shoot f/22 with only candlelight).

## 5. Core UX Flow (The 4 Screens)
Copilot must adhere to this exact macro-to-micro user journey:

* **Screen 1: The Director's Desk:** Clean input field (prompt) + a "Coverage/Pacing" Slider. NO dashboards.
* **Screen 2: Agent Debate & Text Approval:** An API-saving checkpoint. Shows a monospace live terminal of agents debating, followed by a text-list of proposed shots. User approves text *before* image generation.
* **Screen 3: The Call Sheet:** A masonry grid of generated 2.39:1 image cards, each with a monospace metadata footer (Lens, Lighting).
* **Screen 4: Viewfinder (Micro-Edit Modal):** Split screen. Left: React-Konva canvas for drawing motion arrows. Right: AntD Accordions to edit specific Optics/Lighting sliders for that single frame. 

## 6. Coding Constraints & Best Practices
* **TypeScript:** Use strict typing. Define exact interfaces for `AgentPayload`, `CameraState`, and `LightingState`. Do not use `any`.
* **Error Handling:** Agent deadlocks (e.g., physics violations) must NOT crash the app. They must surface gracefully to the frontend as an amber "Director's Call" modal for human resolution.
* **Environment Variables:** Never commit `.env` files. Ensure the Gemini API key is securely managed in the Node backend.