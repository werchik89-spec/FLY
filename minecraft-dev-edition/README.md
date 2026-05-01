# Minecraft Dev Edition

A voxel sandbox game inspired by Minecraft Bedrock Edition, built as a **Dev Edition** with special developer tools and features.

## Features

### Core Gameplay
- **Procedural World Generation** — Infinite terrain with biomes (plains, desert, snow), mountains, caves, trees, and ores
- **Block System** — 30+ block types (grass, stone, wood, ores, glass, bricks, etc.)
- **Block Interaction** — Break and place blocks
- **Inventory** — 36-slot inventory with hotbar
- **Survival Mode** — Health and hunger system
- **Creative Mode** — Unlimited blocks, fly mode
- **Day/Night Cycle** — Dynamic lighting and sky colors

### Dev Edition Exclusive Features
- **Fly Mode** — Press F or use the Fly button to toggle flight
- **NoClip** — Phase through blocks
- **Dev Tools Panel** — Quick access to:
  - Set time (day/night)
  - Teleport to spawn
  - Toggle physics
  - Fill inventory with all blocks
  - Clear area
  - Generate structures (houses)
  - Wireframe mode
  - Chunk border visualization
- **Debug Overlay** — FPS, coordinates, chunk info, block targeting
- **Command System** — Chat commands:
  - `/tp <x> <y> <z>` — Teleport
  - `/gamemode <survival|creative>` — Switch game mode
  - `/fly` — Toggle flight
  - `/noclip` — Toggle no-clip
  - `/give <block> [count]` — Give blocks
  - `/time <day|night|value>` — Set time
  - `/speed <value>` — Set movement speed
  - `/heal` — Full health and hunger
  - `/seed` — Show world seed
  - `/clear [radius]` — Clear blocks around you
  - `/help` — List all commands

### Mobile Support
- **Touch Controls** — Virtual joystick for movement, touch camera control
- **Action Buttons** — Jump, Fly, Break, Place
- **Responsive UI** — Adapts to different screen sizes

## Controls

### Desktop
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move |
| Mouse | Look around |
| Left Click | Break block |
| Right Click | Place block |
| Space | Jump (in fly mode: ascend) |
| Shift | Sprint (in fly mode: descend) |
| F | Toggle fly mode |
| E | Open inventory |
| T or / | Open chat/commands |
| F3 | Toggle debug info |
| Escape | Pause menu |
| 1-9 | Select hotbar slot |
| Scroll | Switch hotbar slot |

### Mobile
- Left joystick: Movement
- Touch right side of screen: Camera
- Buttons: Jump, Fly, Break, Place
- Tap hotbar slots to select blocks

## Building the APK

### Prerequisites
- Node.js 18+
- Java 21 (JDK)
- Android SDK (API 34)

### Steps
```bash
cd minecraft-dev-edition
npm install
npx cap sync android
cd android
export JAVA_HOME=/path/to/java-21
export ANDROID_HOME=/path/to/android-sdk
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Tech Stack
- **Three.js** — 3D rendering
- **Simplex Noise** — Procedural terrain generation
- **Capacitor** — Native Android wrapper
- **HTML5/CSS3/JavaScript** — Game logic and UI

## Version
v0.1.0-dev
