# Storyboard Studio — Complete Product Specification
## Master prompt for a coding agent to build the full application

---

## WHAT IS THIS

Storyboard Studio is an AI-powered storyboard generation tool for film directors. The user inputs a story idea or script → the AI generates a full screenplay → the user reviews and edits it → locks character identities for visual consistency → 4 AI agents (Director, Cinematographer, Editor, Production Designer) debate and design shots per scene in real-time → the storyboard is generated as a grid of AI-rendered frames → the user edits individual frames using two tiers of controls (instant overlays + deep regeneration edits) and converses with agents using @mentions and #parameter hashtags.

The application has 5 pages that flow sequentially. Each page is a gate — the user must complete it before proceeding to the next. The overall flow is:

**Page 1: Story Input** → **Page 2: Screenplay Review** → **Page 3: Cast Sheet** → **Page 4: Shot Generation** → **Page 5: Storyboard Grid + Frame Editor**

---

## GLOBAL ELEMENTS (present on every page)

### Navigation Bar
- Fixed top, full width, semi-transparent frosted glass
- Left: app logo icon (terracotta clapperboard) + "Storyboard Studio" text (Playfair Display serif)
- Page 1: right side shows "Features", "Gallery", "Pricing" nav links + "Sign In" button
- Pages 2-5: right side shows a 4-step progress stepper — 4 small circles connected by a line. The current step's circle is filled terracotta. Completed steps are filled olive/green. Future steps are empty outlines. Labels below: "Script", "Cast", "Shots", "Board". Clicking a completed step navigates back to that page.
- Far right on pages 2-5: settings gear icon + "Export" button

### Background
- Every page shares the same warm ambient blurred gradient background (amber/terracotta/cream tones). This is the brand identity and must be identical across all pages.

### Surface Treatment
- All cards, panels, inputs, and interactive surfaces use frosted glass — semi-transparent white with backdrop blur, letting the warm gradient bleed through subtly. This creates the warm, cinematic, analog feel.

### 4 AI Agents (The Production Crew)
These agents appear throughout the application:
- **Director** 🎬 — terracotta color (#C4724B) — owns story, emotion, framing decisions. Shortcut: @dir
- **Cinematographer** 🎞 — dusty blue (#6B8CA6) — owns camera, lens, lighting. Shortcut: @dp
- **Editor** 🎛 — olive (#7A8B6F) — owns pacing, rhythm, continuity, movement. Shortcut: @ed
- **Production Designer** 🏗 — warm gold (#C4A04B) — owns world, color, era, environment. Shortcut: @pd

Agent colors appear as small dots (6px) next to labels, as border tints on their messages, and as text color for their names. Never as large background fills.

---

## PAGE 1: STORY INPUT

### Purpose
The entry point. User writes or pastes their story idea, then clicks Generate to create a screenplay.

### Layout
Full viewport height. Content vertically and horizontally centered. Max-width ~540px.

### Components (top to bottom)

1. **Pre-production label**: Small uppercase text "PRE-PRODUCTION" in a frosted pill badge, terracotta text.

2. **Headline**: "What's your story?" — large serif italic, dark text. This is the hero moment.

3. **Subtitle**: "Paste a script, describe your vision, or drop a treatment. Your production crew will bring it to life." — body font, muted text.

4. **Textarea**: Large frosted glass input (~540px wide, ~150px tall).
   - **Empty state**: Shows placeholder text in muted color: "A noir detective story set in a rain-soaked city at night..."
   - **Typing state**: User's text appears in dark color. The textarea border remains neutral.
   - **Focus state**: Border changes to terracotta.
   - **Disabled state**: During generation, the textarea becomes non-editable and slightly muted.

5. **Crew badges**: 4 horizontal pill badges showing each agent — colored dot + emoji icon + role name. These are decorative/informational, not interactive.

6. **Standby text**: "Your crew is standing by" — italic, muted text.

7. **Generate button**: "Generate Screenplay →"
   - **Disabled state**: When textarea is empty — button is muted/grayed.
   - **Enabled state**: When textarea has text — terracotta background, white text.
   - **Loading state**: When clicked — button text changes to "Generating screenplay..." with a small spinning circle animation. The button background becomes muted. The textarea becomes disabled. After ~2 seconds, auto-navigates to Page 2.

8. **Feature cards**: 3 frosted glass cards at the bottom — "Instant Visuals", "Collaboration First", "Cinematic Export" — each with an icon, title, and short description.

9. **Footer**: "© 2024 Storyboard Studio. Built for creators."

### Navigation
- "Generate Screenplay" button → navigates to Page 2 (after loading delay)
- No back navigation (this is the entry point)

---

## PAGE 2: SCREENPLAY REVIEW

### Purpose
Display the AI-generated screenplay in proper screenplay format. The user reviews, edits text, reorders scenes, and deletes unwanted scenes before approving.

### Layout
Single centered column, max-width ~740px. Scrollable.

### Header Section
- Progress stepper showing Step 1 active
- Title: "Screenplay" — serif
- Subtitle with scene count and instruction text
- **"Approve Script →" button**: Terracotta primary button. Always enabled. Clicking navigates to Page 3.
- **"↻ Regenerate" button**: Secondary/ghost button. Clicking regenerates the entire screenplay (replaces all scene cards with new content after a loading state).

### Scene Cards (8 total, vertically stacked)
Each card represents one screenplay scene. Cards are frosted glass with consistent structure:

**Card header bar**:
- Scene number in a circle badge (1, 2, 3...)
- Scene slug line in monospace, warm gold color: "EXT. CITY STREET — NIGHT"
- "Edit" text button (right side) — toggles the card into edit mode
- "✕" delete button (right side) — removes the scene from the list

**Card body**:
- Screenplay text in monospace font, formatted as a real screenplay:
  - Action/description lines are full-width
  - CHARACTER NAMES are centered, uppercase, bold
  - Dialogue is indented ~25% from left
  - Parentheticals are indented, italic
  - V.O. (voice over) tags appear after character names
  - "CUT TO:" directives are centered, muted
- The text contains actual screenplay content for a noir detective story across 8 scenes

**Card footer**:
- Character name tags with colored dots (matching agent colors assigned to each character)
- Location and time tag: "Downtown · Night"

### Interactive States

**Normal state**: Cards are read-only. Text is displayed as formatted screenplay.

**Edit mode** (triggered by clicking "Edit" on a specific card):
- That card's border changes to terracotta
- The slug line heading becomes an editable text input (same monospace font)
- The body text becomes a resizable textarea (same monospace font, editable)
- The "Edit" button text changes to "Done" (olive color)
- Clicking "Done" saves changes and returns to normal state
- Only ONE card can be in edit mode at a time

**Drag to reorder**:
- All cards are draggable (cursor shows grab icon)
- Dragging a card lifts it (stronger shadow, slight scale)
- Hovering over another card while dragging shows a terracotta drop indicator line between cards
- Dropping reorders the scene list
- Scene numbers update automatically after reorder

**Delete**:
- Clicking "✕" immediately removes the card from the list
- Remaining cards re-number

**"+ Add Scene" link**: At the bottom of all cards — adds a new blank scene card at the end

### Navigation
- "Approve Script →" → navigates to Page 3
- Progress stepper step 1 is clickable to return here from later pages

### Data passed to next page
The approved scene list (with any edits, reorders, or deletions) is passed to the Shot Generation page.

---

## PAGE 3: CAST SHEET

### Purpose
Display AI-proposed characters extracted from the screenplay. The user reviews each character, regenerates their appearance, uploads reference images, and locks their visual identity to ensure consistency across all storyboard frames.

### Layout
Single centered column, max-width ~700px. Scrollable.

### Header
- Progress stepper showing Step 2 active
- Title: "Cast Sheet"
- Subtitle about locking character identities
- **"Begin Shot Design →" button**: DISABLED until all characters are locked. When all locked, becomes terracotta and clickable → navigates to Page 4.

### Director's Note
A callout card with a terracotta left border accent:
- "🎬 Director's Note" header
- Body text advising the user to regenerate until satisfied and upload references to override AI

### Character Cards (3 initially, can add more)
Each card is a horizontal layout — portrait area left, details right.

**Left column (portrait area)**:
- Large circular avatar with character's initial letter, bordered in character's assigned color
  - Marcus "M" — terracotta border
  - Elara "E" — dusty blue border
  - Viktor "V" — warm gold border
- **"↻ Regenerate" button**: Visible when character is UNLOCKED. Triggers the regeneration flow. Hidden/disabled when locked.
- **"📎 Upload reference" link**: Opens a file picker for the user to upload a reference image that overrides the AI's interpretation.

**Right column (details)**:
- Character name (editable — clicking turns into an input field)
- Age tag
- **Description section**: Labeled "DESCRIPTION". Text is editable (clicking turns into a textarea). Contains a physical description of the character.
- **Visual Traits section**: Labeled "VISUAL TRAITS — consistency anchors". Displayed as small pill tags in monospace font (e.g., "Tall", "Lean", "Tired eyes"). These are the key features the AI uses for cross-frame consistency.
- **Lock button** (top-right of card):
  - **Unlocked state**: Shows "Lock" as a ghost/outline button
  - **Locked state**: Shows "✓ Locked" with the character's color as text/border. The card border also changes to the character's color.

### Interactive States

**Regeneration flow** (triggered by clicking "↻ Regenerate"):
1. The avatar circle shows a spinning animation in the character's color
2. The button text changes to "Reimagining..."
3. **Crew feedback appears** below the card — 3 sequential text messages from different agents commenting on the new version:
   - Director comments on emotional presence
   - Cinematographer comments on how the face interacts with lighting
   - Production Designer comments on wardrobe adjustments
4. After feedback: a **Variant Picker** appears — 3 small cards in a row (Variant A, B, C). Clicking one selects that version and updates the description. "Keep current" dismisses without changing.
5. After selecting a variant (or keeping current): the character returns to unlocked state with updated description

**Lock/Unlock toggle**:
- Clicking "Lock" marks the character as approved. The card border changes to character color. The lock badge appears. The regen button hides.
- Clicking "✓ Locked" unlocks the character again (re-enables editing and regeneration). Editing any text field also auto-unlocks.
- A locked character shows a bottom banner: "Identity locked across all frames"

**Add Character**: A dashed-border card at the bottom with "+" and "Add character" text. Clicking adds a new blank character card with default fields.

**Delete Character**: (Not explicitly in the current prototype but logically needed) — a subtle "✕" button on unlocked cards to remove a character.

### Navigation
- "Begin Shot Design →" (only enabled when ALL characters locked) → navigates to Page 4
- Progress stepper allows back-navigation to Pages 1-2

### Data passed to next page
The locked character profiles (name, description, traits, assigned color) are used by agents during shot generation and referenced in every frame for visual consistency.

---

## PAGE 4: SHOT GENERATION (Writers' Room)

### Purpose
4 AI agents debate and design shots for each screenplay scene in real-time. The user watches the debate stream in — like sitting in a production meeting. The agents discuss shot count, camera choices, lighting, pacing, and production design for each scene sequentially.

### Layout
Two-panel split — left sidebar (~250px) + main content area. Full viewport height.

### Left Sidebar

**Header section**:
- Progress stepper showing Step 3 active
- "Shot Design" title
- "Crew debates shots per scene" subtitle

**Crew roster**:
- 4 agent rows, each showing: colored dot/avatar + role name + domain subtitle
- **Speaking state**: When an agent's message is currently being "typed"/streamed — their row highlights: text becomes their color, weight becomes bold, the dot gets a subtle glow. This indicates who is currently contributing.
- **Idle state**: Muted text, normal weight

**Scene progress list**:
- 8 scene entries showing a checklist-style progress indicator
- **Completed scene**: Olive/green filled circle with ✓ checkmark, muted text
- **Active/current scene**: Terracotta filled circle, bold text — this scene is currently being debated
- **Pending scene**: Empty circle with border, muted text — hasn't been reached yet
- Scene entries show the truncated slug line: "City Street", "Dive Bar", "Gala", etc.

**Bottom of sidebar**:
- **Before completion**: Shows "X of 8 scenes" progress count
- **After all 8 scenes complete**: A "View Storyboard →" terracotta button appears, full-width. Clicking navigates to Page 5.

### Main Content Area

**Top bar**:
- Current scene heading in monospace, warm gold color: "EXT. CITY STREET — NIGHT"
- Right side: "X / 8" counter showing current scene number

**Chat/debate area** (fills remaining space, scrollable):
Agent messages stream in sequentially — one agent speaks, then the next, creating a real-time debate feel.

**Each message**:
- Small colored dot (agent color) + agent role name in their color, bold
- Message text below in body font, dark text, generous line-height
- Messages animate in with a slide-up + fade effect
- **Consensus messages** (containing ✓ checkmark): Text color shifts to agent color, weight becomes bold — signaling agreement/completion

**Debate content per scene**:
Each scene has ~4 messages (one per agent) discussing:
- Director: shot count, emotional arc, framing choices
- Cinematographer: lens choices, f-stops, lighting setup
- Editor: pacing, cut rhythm, movement decisions
- Production Designer: set dressing, color palette, period details

The messages contain real cinematographic language — focal lengths, f-stops, lighting directions, composition references — making the debate feel authentically professional.

**Scene transitions**:
When one scene's debate completes (all 4 agents have spoken with ✓ consensus):
1. The current scene is marked as complete in the sidebar (olive ✓)
2. After a brief pause (~800ms), the chat clears
3. The next scene heading appears in the top bar
4. The next scene's debate begins streaming
5. The sidebar updates to show the new active scene

**Auto-progression**: The debate runs automatically. The user watches passively (no intervention required). Each message appears after a delay proportional to its word count (longer messages take longer to appear, simulating typing).

### Navigation
- "View Storyboard →" (appears after all 8 scenes complete) → navigates to Page 5
- Progress stepper allows back-navigation

### Data generated
25 frame definitions (shots distributed across 8 scenes), each with: scene reference, shot title, description, character list, and technical parameters (focal length, aperture, color temp, shot type).

---

## PAGE 5: STORYBOARD GRID + FRAME EDITOR

### Purpose
The main deliverable view. Shows all generated frames in a grid. Clicking any frame opens an editor overlay panel with two tiers of parameter controls and an agent chat. This is the most complex page.

### Layout
Full-width. Two states:
- **Grid only** (default): Frame grid fills the page
- **Grid + Editor**: Grid compresses to ~60% width, a fixed editor panel (~420px) slides in from the right

### Header
- Progress stepper showing Step 4 active
- Title: "Storyboard"
- Stats: "25 frames · 8 scenes"
- **"Export" button**: Terracotta. Triggers an export flow (PDF storyboard, shot list CSV, etc.)

### Scene Filter Tabs
A horizontal row of filter tabs below the header.
- "All" tab + one tab per scene slug line ("City Street", "Dive Bar", "Gala", etc.)
- **Active tab**: Terracotta fill, white text (or terracotta underline depending on theme variant)
- **Inactive tab**: Neutral/frosted, muted text
- Clicking a tab filters the grid to show only that scene's frames

### Frame Grid

**Grid layout**: CSS grid with auto-fill columns (~195px min-width), 12px gap. Responsive — fits 4-5 columns on desktop.

**When editor is open**: Grid max-width reduces and card min-width shrinks to ~155px, making cards smaller to accommodate the panel.

**Each frame card** (frosted glass):

- **Image area** (top, ~100px height): A dark muted color fill representing the shot's mood/lighting. Different scenes have different color tones (night = dark blue, bar = amber, interrogation = green tint, dawn = warm brown). Contains:
  - Frame number centered at low opacity
  - Scene badge top-left: "SC1" in small text
  - Character dots bottom-right: small colored circles for each character in the shot
  - Duration badge bottom-right: "00:08" timestamp

- **Info area** (below image):
  - Shot title: "City Wide" — bold body text
  - Description: "Rain-slicked street, neon reflections" — muted text
  - Parameters: "24mm f/2.8 3200K EWS" — monospace, muted

- **Card states**:
  - **Default**: Normal border, normal shadow
  - **Hover**: Border tint shifts warmer, subtle shadow increase (no lift in minimal theme, slight lift in moleskin theme)
  - **Selected** (when editor is open for this frame): Terracotta border, stronger visual emphasis
  - **Regenerating**: "REGEN" badge overlaid on the image area, terracotta pill

- **"Add Frame" card**: Dashed border card at the end of the grid with "+" icon and "Add Frame" text.

### Frame Editor Panel (Slide-in Overlay)

Triggered by clicking any frame card. A panel slides in from the right edge, fixed position, full viewport height.

**Panel header**:
- Frame title (e.g., "Cole Streetlight")
- Scene/frame info: "SCENE 1 · FRAME 2"
- Status indicator if regenerating: "REGENERATING"
- Character pills with lock icons: "● Marcus 🔒"
- "✕" close button — closes the panel and returns to full grid view
- "⋮" three-dot menu for additional options

**Frame preview** (~170px):
- Shows the frame's dark color fill (same as grid card but larger)
- When regenerating: shows a terracotta spinner + "Regenerating..." + processing step text (e.g., "Applying atmospheric diffusion")
- Bottom edge: parameter readout in tiny monospace

#### Instant Adjustments Section
Non-destructive, post-processing controls that apply immediately without regeneration.

4 controls, each as a labeled row with an agent-colored dot indicating ownership:
1. **Color Temperature** — slider (2000K–8000K) — owned by Prod Designer (gold dot)
2. **Contrast** — slider (0–100%) — owned by Cinematographer (blue dot)
3. **Haze / Volumetrics** — slider (0–100%) — owned by Prod Designer (gold dot)
4. **LUT / Color Grade** — dropdown (Neutral, Cool Noir, Warm Amber, Bleach Bypass, Teal & Orange) — owned by Prod Designer (gold dot)

Changing any of these does NOT require regeneration. Changes are applied as overlays on the existing frame.

#### Deep Edit Section (Toggleable)
Structural parameters that require full AI regeneration when changed.

**Toggle button**: "DEEP EDIT" label + chevron. Clicking toggles the section open/closed. When changes are pending, shows a count: "3 pending changes" in terracotta.

**When expanded — Horizontal scroll strip of parameter chips**:
A single horizontal row that overflows and scrolls. Shows ~3.5-4 chips at a time, with a fade on the right edge indicating more.

**14 parameter chips in 4 groups** (scrolling left to right):

🎥 **CAMERA** (4 chips):
- Focal Length (slider 16–200mm) — owned by Cinematographer 🎞
- Camera Angle / Pitch (dropdown: Bird's Eye, High, Eye Level, Low, Worm's Eye) — owned by Director 🎬
- Dutch Angle / Roll (slider 0°–45°) — owned by Director 🎬
- Camera Height (dropdown: Ground, Low, Standard, High, Overhead) — owned by Director 🎬

📐 **FRAMING** (4 chips):
- Shot Size (dropdown: ECU, CU, MCU, MS, MWS, Wide, EWS) — owned by Director 🎬
- Compositional Grid (dropdown: Center, Rule of Thirds, Golden Ratio, Diagonal, Symmetry) — owned by Editor 🎛
- Eyeline Vector (dropdown: Direct to Camera, Off-frame Left, Off-frame Right, Down, Up) — owned by Director 🎬
- Headroom & Lead Room (dropdown: Extreme Tight, Tight, Standard, Loose) — owned by Director 🎬

💡 **LIGHTING** (2 chips):
- Key Light Direction (dropdown: Front, Side 45°, Side 90°, Back, Top, Under) — owned by Cinematographer 🎞
- Lighting Quality (dropdown: Soft, Medium-Soft, Medium-Hard, Hard) — owned by Cinematographer 🎞

🌍 **WORLD** (4 chips):
- Era / Period (dropdown: 1920s, 1940s Noir, 1960s, 1980s, Contemporary, Near Future) — owned by Prod Designer 🏗
- Set Condition (dropdown: Clean, Wet Streets, Dusty, Foggy, Snowy, Debris) — owned by Prod Designer 🏗
- Movement (dropdown: Static, Slow Push, Pull Back, Pan Left, Pan Right, Tracking, Crane Up, Crane Down) — owned by Editor 🎛
- Aspect Ratio (dropdown: 1.33:1, 1.85:1, 2.39:1, 16:9, 9:16) — owned by Prod Designer 🏗

**Chip states**:
- **Default**: Small frosted rectangle (~105px × 52px) showing colored agent dot + parameter name + current value
- **Hover**: Chip enlarges smoothly (scale ~1.05-1.08), shadow deepens, border tints to terracotta
- **Selected/Active**: Terracotta border. An inline control (dropdown or slider) expands BELOW the chip, anchored to it. Only one chip can have its inline control open at a time.
- **Changed**: A small terracotta dot badge appears in the chip's top-right corner. The value text updates.
- **Disabled**: Grayed out during regeneration

**Inline controls** (appear below selected chip):
- For dropdown params: A frosted glass card with a vertical list of options. Current value is highlighted in terracotta with a ✓ checkmark. Hovering an option shows a subtle terracotta tint. Clicking an option selects it, closes the dropdown, and marks the chip as changed.
- For slider params: A horizontal slider with a monospace value readout. Dragging updates the value and marks the chip as changed.
- Clicking outside or clicking another chip closes the current inline control.

**Regenerate button**: Appears below the chip strip when at least 1 parameter is changed. "↻ Regenerate (N changes)" — terracotta button, full-width. Clicking:
1. All changed chips reset to "unchanged" state
2. Frame preview shows regeneration spinner
3. After ~1.5-2 seconds, the frame is regenerated with new parameters
4. The chips show the new values as defaults

**Two-way sync with chat**: When a user changes a parameter via chat #hashtag, the corresponding chip auto-updates. When a user changes a chip visually, the chat can acknowledge it.

#### Studio Chat Section
The agent chat for the currently selected frame. Fills the remaining vertical space in the panel.

**Chat header**:
- "STUDIO CHAT" label
- Agent shortcut pills: "@dp", "@dir", "@ed", "@pd" — each in their color. Tapping one inserts the @mention into the input.
- Character presence pill(s): "● Marcus 🔒" — showing which characters are in this frame, with lock icons confirming identity consistency

**Message area** (scrollable):

**Empty state**: "Talk to your crew about this frame" — centered, muted

**User messages**: Right-aligned, dark frosted bubble. Text in light color. @mentions are highlighted in the mentioned agent's color and bold. #hashtags are highlighted in terracotta, bold, with a subtle tag styling.

**Agent response messages**: Left-aligned. Small colored dot + agent role label in their color. Message text below in body font. No bubble background — just text on the frosted surface (or a very subtle color-tinted card). Agents respond with professional cinematographic language.

**Typing indicator**: 3 dots pulsing in the responding agent's color.

**Chat input** (bottom of panel):
- Frosted input field with placeholder: "@dp warmer light..."
- Terracotta send button (circle with "↑" arrow icon) on the right
- **@mention autocomplete**: Typing "@" triggers a popup above the input showing the 4 agents. Each row: colored dot + "@shortcut" + role name + domain. Clicking inserts the mention. The popup filters as the user types (e.g., "@d" shows Director and DP).
- **#parameter autocomplete**: Typing "#" triggers a similar popup showing all 14 Deep Edit parameters grouped by category (🎥📐💡🌍). Each param shows: agent dot + #hashtag_name. Clicking inserts the hashtag. The popup filters as user types.

**Chat message examples**:
- User: "@dp can you make the light harder on the profile?"
- Cinematographer: "Adjusting — shifting to Side 90° hard light and bumping contrast to 70%."
- User: "@dir #camera_angle what about going lower — worm's eye for power?"
- Director: "Worm's eye is aggressive. I'd stay at Low — the city looms above him without alienating the audience."
- User: "@pd #set_condition heavier rain in the background"
- Prod Designer: (typing indicator...)

When an agent responds to a #hashtag parameter request, the corresponding Deep Edit chip auto-updates with the new value and shows the "changed" badge.

### Bottom Bar (full width, always visible)
- Left: "⏱ TOTAL DUR: 02:45" + "🎬 SCENES: 12" — metadata about the storyboard
- Center/right: Sync progress bar (terracotta fill) + "65% SYNCED"
- Far right: "Finish Review" terracotta button — finalizes the storyboard for export

### Collaborative Presence (bottom of editor panel)
- Overlapping user avatar circles (24px) + "+N" badge
- "N ACTIVE USERS" count
- Activity text: "DP blue is editing lighting parameters" — showing what collaborators are doing
- "● LIVE" green dot indicator

### Navigation within Page 5
- Clicking a frame card → opens the editor panel for that frame (or switches to a different frame if panel is already open)
- "✕" in the editor panel → closes the panel, returns to full grid
- Scene filter tabs → filters which frames are visible in the grid
- "Export" button → triggers export flow
- "Finish Review" → finalizes the storyboard
- Progress stepper allows back-navigation to any completed step

---

## CROSS-PAGE DATA FLOW

```
Page 1 (Story Input)
  │ User's story text
  ▼
Page 2 (Screenplay)
  │ 8 scenes (editable, reorderable, deletable)
  │ Each scene: heading, body text, characters, location, time
  ▼
Page 3 (Cast Sheet)
  │ 3+ characters (name, description, visual traits, reference image)
  │ All must be LOCKED before proceeding
  ▼
Page 4 (Shot Generation)
  │ Agents debate shots per scene using the approved script + locked characters
  │ Generates 25 frames across 8 scenes
  │ Each frame: title, description, characters, 18 parameters (4 instant + 14 deep)
  ▼
Page 5 (Storyboard Grid + Editor)
  │ Grid of 25 AI-rendered frames
  │ Frame editor with instant overlays + deep edit chips + agent chat
  │ #hashtag and @mention system for conversational parameter editing
  │ Export → PDF / CSV / share
```

---

## PARAMETER SYSTEM (18 total)

### Tier 1: Instant Overlay (4 params) — No regeneration needed
| Parameter | Control | Range | Owner |
|-----------|---------|-------|-------|
| Color Temperature | Slider | 2000K – 8000K | 🏗 PD |
| Contrast | Slider | 0% – 100% | 🎞 DP |
| Haze / Volumetrics | Slider | 0% – 100% | 🏗 PD |
| Color Grade / LUT | Dropdown | Neutral, Cool Noir, Warm Amber, Bleach Bypass, Teal & Orange | 🏗 PD |

### Tier 2: Deep Edit (14 params) — Requires regeneration
| # | Parameter | Hashtag | Control | Values | Owner |
|---|-----------|---------|---------|--------|-------|
| 1 | Focal Length | #focal_length | Slider | 16mm – 200mm | 🎞 DP |
| 2 | Camera Angle | #camera_angle | Dropdown | Bird's Eye, High, Eye Level, Low, Worm's Eye | 🎬 Dir |
| 3 | Dutch Angle | #dutch_angle | Slider | 0° – 45° | 🎬 Dir |
| 4 | Camera Height | #camera_height | Dropdown | Ground, Low, Standard, High, Overhead | 🎬 Dir |
| 5 | Shot Size | #shot_size | Dropdown | ECU, CU, MCU, MS, MWS, Wide, EWS | 🎬 Dir |
| 6 | Comp Grid | #comp_grid | Dropdown | Center, Rule of Thirds, Golden Ratio, Diagonal, Symmetry | 🎛 Ed |
| 7 | Eyeline Vector | #eyeline | Dropdown | Direct, Off-frame L, Off-frame R, Down, Up | 🎬 Dir |
| 8 | Headroom | #headroom | Dropdown | Extreme Tight, Tight, Standard, Loose | 🎬 Dir |
| 9 | Key Light Dir | #key_light | Dropdown | Front, Side 45°, Side 90°, Back, Top, Under | 🎞 DP |
| 10 | Light Quality | #light_quality | Dropdown | Soft, Medium-Soft, Medium-Hard, Hard | 🎞 DP |
| 11 | Era / Period | #era | Dropdown | 1920s, 1940s Noir, 1960s, 1980s, Contemporary, Near Future | 🏗 PD |
| 12 | Set Condition | #set_condition | Dropdown | Clean, Wet, Dusty, Foggy, Snowy, Debris | 🏗 PD |
| 13 | Movement | #movement | Dropdown | Static, Push, Pull, Pan L, Pan R, Track, Crane Up, Crane Down | 🎛 Ed |
| 14 | Aspect Ratio | #aspect_ratio | Dropdown | 1.33:1, 1.85:1, 2.39:1, 16:9, 9:16 | 🏗 PD |

---

## CHAT SYNTAX REFERENCE

### @mentions (agents)
- @dir → Director (terracotta highlight in chat)
- @dp → Cinematographer (dusty blue highlight)
- @ed → Editor (olive highlight)
- @pd → Production Designer (warm gold highlight)

### #hashtags (parameters)
- #focal_length, #camera_angle, #dutch_angle, #camera_height
- #shot_size, #comp_grid, #eyeline, #headroom
- #key_light, #light_quality
- #era, #set_condition, #movement, #aspect_ratio

### Combined usage examples
- "@dp #focal_length 85mm for more compression and intimacy"
- "@dir #camera_angle low angle to show the city's power over Cole"
- "@pd #set_condition heavier rain, more atmospheric"
- "@ed #movement slow push-in as tension builds"
- "#light_quality hard shadows for the interrogation scene"
- "@dp #key_light backlit for silhouette, #dutch_angle add 5 degrees of unease"

### Display rules
- @mentions: displayed in the agent's color, bold
- #hashtags: displayed in terracotta, bold, with subtle tag/badge inline styling
- Regular text: normal body text color
- Agent responses that reference parameters also highlight #hashtags in terracotta

---

## DESIGN THEME

The visual theme is "Warm Cinematic Moleskin" — a warm, ambient, analog-feeling interface.

### Background
Warm blurred gradient (amber/terracotta/cream) — identical on every page. Feels like golden hour light blurred beyond recognition. Cinematic and atmospheric.

### Surfaces
All UI elements use frosted glass — semi-transparent white with backdrop blur. The warm gradient always subtly bleeds through, creating that warm-tinted translucent feel.

### Typography
- Headings: Playfair Display (serif, italic for main titles)
- Body/UI: Inter
- Parameters/screenplay: JetBrains Mono

### Color system
- Primary accent: Terracotta (#C4724B) — CTAs, active states, the dominant brand color
- Agent colors only appear as small dots, text labels, and message borders — never as large fills
- Text is dark (#2C2C2C / #5A5248 / #8A7E72) for readability against the warm background

### Interaction principles
- Hover: subtle enlargement and shadow deepening (especially on chips and cards)
- Focus: terracotta border
- Transitions: 200-300ms ease-out for all state changes
- Loading states: terracotta spinners, text changes ("Generating...", "Regenerating...")
- Animations: slide-up + fade for new content appearing (messages, cards)
