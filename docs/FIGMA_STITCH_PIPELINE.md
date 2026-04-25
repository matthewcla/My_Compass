# Figma ↔ Stitch ↔ Antigravity Pipeline

This document outlines the setup and execution loop for the autonomous, continuous design-to-deployment pipeline using Figma, Google Stitch, and the Antigravity agent.

This workflow eliminates traditional developer handoff by synchronizing visual designs directly into React Native code.

---

## Step 1: Initialize the Stitch Project

First, you need a dedicated container in Google Stitch to hold the app's design state.

1. Open a chat with Antigravity.
2. Prompt: *"Create a Stitch project for My Compass."*
3. Antigravity will use the `mcp_StitchMCP_create_project` tool to generate a new project and provide you with a unique `projectId`.

## Step 2: Connect Figma to Stitch

You need to push your Figma frames and design tokens into the Stitch project created in Step 1.

1. Install the **Google Stitch Figma Plugin** (or your organization's designated export plugin) in your Figma workspace.
2. Configure the plugin using the `projectId` provided by Antigravity.
3. Push your screens (e.g., "Duty Roster") and export your global design tokens.

## Step 3: Set up the Design System Baseline

Before generating specific screens, ensure the core styling (colors, typography, border radii) matches perfectly.

1. Once you've pushed your tokens from Figma, prompt Antigravity: *"Sync the design system from Stitch."*
2. Antigravity will retrieve the tokens via `mcp_StitchMCP_list_design_systems`.
3. Antigravity will autonomously overwrite your `tailwind.config.js` and `global.css` to perfectly map to your Figma styles.

## Step 4: The Handoff Loop (Continuous Execution)

Now the pipeline is established. Whenever you make a change or create a new screen in Figma, execute this loop:

1. **Design:** Click "Push/Export" in your Figma plugin.
2. **Trigger:** Switch to your IDE and prompt Antigravity: *"Pull the [Screen Name] screen from Stitch and build it."*
3. **Execution:** Antigravity will:
   - Use `mcp_StitchMCP_list_screens` to find the new screen.
   - Pull the exact component hierarchy and spatial data using `mcp_StitchMCP_get_screen`.
   - Write the React Native + NativeWind code in the appropriate route (e.g., `app/(tabs)/...`).
   - Wire the UI to Zustand stores according to the project's `GEMINI.md` architectural rules.

---

**Note:** Since Antigravity operates on a conversational loop rather than listening to background webhooks, the pipeline requires the "Trigger" prompt in Step 4 to initiate the code generation process.
