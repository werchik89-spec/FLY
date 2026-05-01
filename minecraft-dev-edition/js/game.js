// Main Game Controller
class Game {
    constructor() {
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.player = null;
        this.world = null;
        this.controls = null;
        this.inventory = null;
        this.hud = null;
        this.devTools = null;
        this.clock = new THREE.Clock();
        this.lastLookResult = null;
        this.placeDebounce = 0;
        this.breakDebounce = 0;

        this.selectionBox = null;

        // Block highlight (wireframe cube showing targeted block)
        this.blockHighlight = null;
    }

    async init(mode) {
        const canvas = document.getElementById('game-canvas');

        // Show loading
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('load-status').textContent = 'Initializing renderer...';
        document.getElementById('load-progress').style.width = '10%';

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x87ceeb);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 120);

        // Camera
        const fov = parseInt(document.getElementById('fov-setting').value) || 75;
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 200);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        this.scene.add(dirLight);

        // Store lights for day/night
        this.world = new World();
        this.world.scene = this.scene;
        this.world.ambientLight = ambientLight;
        this.world.directionalLight = dirLight;

        // Set render distance
        const renderDist = parseInt(document.getElementById('render-distance').value) || 4;
        this.world.renderDistance = renderDist;

        // Player
        this.player = new Player();
        this.player.init(this.camera);

        if (mode === 'creative') {
            this.player.setGameMode('creative');
        }

        // Inventory
        this.inventory = new Inventory();

        // Controls
        this.controls = new Controls(this.player, canvas);
        const sens = parseInt(document.getElementById('sensitivity').value) || 5;
        this.controls.setSensitivity(sens);

        // HUD
        this.hud = new HUD(this.player);

        // Block highlight
        const hlGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
        const hlMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.blockHighlight = new THREE.Mesh(hlGeo, hlMat);
        this.blockHighlight.visible = false;
        this.scene.add(this.blockHighlight);

        // Export globals
        window.gameWorld = this.world;
        window.gamePlayer = this.player;
        window.gameInventory = this.inventory;
        window.gameHud = this.hud;

        // Generate initial chunks
        await this.generateInitialWorld();

        // Dev Tools
        this.devTools = new DevTools(this);

        // Find spawn point
        const spawnHeight = this.world.getSpawnHeight(8, 8);
        this.player.position.set(8, spawnHeight + 1, 8);
        this.player.spawnPoint.set(8, spawnHeight + 1, 8);

        // Update inventory UI
        this.inventory.updateHotbarUI();

        // Hide loading, show HUD
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('hud').style.display = 'block';

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Setup global state functions
        this.setupGlobalHandlers();

        // Start game loop
        window.gameState = 'playing';
        this.clock.start();
        this.gameLoop();

        this.hud.addChatMessage('Welcome to Minecraft Dev Edition!', 'system');
        this.hud.addChatMessage('Type /help for dev commands', 'system');
        this.hud.addChatMessage('Press F to toggle fly mode', 'system');
    }

    async generateInitialWorld() {
        const totalChunks = (this.world.renderDistance * 2 + 1) ** 2;
        let generated = 0;

        document.getElementById('load-status').textContent = 'Generating terrain...';

        for (let dx = -this.world.renderDistance; dx <= this.world.renderDistance; dx++) {
            for (let dz = -this.world.renderDistance; dz <= this.world.renderDistance; dz++) {
                this.world.generateChunk(dx, dz);
                generated++;
                const pct = Math.floor((generated / totalChunks) * 70) + 20;
                document.getElementById('load-progress').style.width = pct + '%';

                // Yield to prevent freezing
                if (generated % 5 === 0) {
                    await new Promise(r => setTimeout(r, 1));
                }
            }
        }

        document.getElementById('load-status').textContent = 'Building meshes...';
        document.getElementById('load-progress').style.width = '90%';

        let built = 0;
        for (const [key, chunk] of this.world.chunks) {
            this.world.buildChunkMesh(chunk);
            built++;
            if (built % 3 === 0) {
                await new Promise(r => setTimeout(r, 1));
            }
        }

        document.getElementById('load-progress').style.width = '100%';
        document.getElementById('load-status').textContent = 'Done!';
    }

    setupGlobalHandlers() {
        // Pause
        window.togglePause = () => {
            if (window.gameState === 'playing') {
                window.gameState = 'paused';
                document.getElementById('pause-menu').style.display = 'flex';
            } else if (window.gameState === 'paused') {
                window.gameState = 'playing';
                document.getElementById('pause-menu').style.display = 'none';
            }
        };

        document.getElementById('btn-resume').addEventListener('click', () => {
            window.gameState = 'playing';
            document.getElementById('pause-menu').style.display = 'none';
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            window.gameState = 'menu';
            document.getElementById('hud').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
            if (document.pointerLockElement) document.exitPointerLock();
        });

        // Inventory
        window.toggleInventory = () => {
            const screen = document.getElementById('inventory-screen');
            if (screen.style.display === 'none') {
                screen.style.display = 'flex';
                this.inventory.renderInventoryScreen();
                window.gameState = 'inventory';
                if (document.pointerLockElement) document.exitPointerLock();
            } else {
                screen.style.display = 'none';
                window.gameState = 'playing';
            }
        };

        document.getElementById('btn-inventory').addEventListener('click', () => {
            document.getElementById('pause-menu').style.display = 'none';
            window.toggleInventory();
        });

        document.getElementById('btn-close-inv').addEventListener('click', () => {
            document.getElementById('inventory-screen').style.display = 'none';
            window.gameState = 'playing';
        });

        // Chat
        window.toggleChat = () => {
            const chat = document.getElementById('chat-area');
            if (chat.style.display === 'none') {
                chat.style.display = 'block';
                document.getElementById('chat-input').focus();
                if (document.pointerLockElement) document.exitPointerLock();
            } else {
                chat.style.display = 'none';
            }
        };

        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = e.target.value.trim();
                if (input) {
                    if (input.startsWith('/')) {
                        this.hud.processCommand(input);
                    } else {
                        this.hud.addChatMessage(`[You] ${input}`);
                    }
                }
                e.target.value = '';
                document.getElementById('chat-area').style.display = 'none';
            }
            if (e.key === 'Escape') {
                document.getElementById('chat-area').style.display = 'none';
            }
            e.stopPropagation();
        });
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());

        if (window.gameState !== 'playing') return;

        const delta = Math.min(this.clock.getDelta(), 0.1);

        // Update controls
        this.controls.update();

        // Update player
        this.player.update(delta, this.world);

        // Update chunks
        this.world.updateChunks(this.player.position.x, this.player.position.z);

        // Day/night cycle
        this.world.updateDayNight(delta);

        // Raycast for block targeting
        const lookDir = this.player.getLookDirection();
        const eyePos = new THREE.Vector3(
            this.player.position.x,
            this.player.position.y + this.player.eyeHeight,
            this.player.position.z
        );

        this.lastLookResult = this.world.raycast(eyePos, lookDir, 7);

        // Block highlight
        if (this.lastLookResult.hit) {
            this.blockHighlight.visible = true;
            this.blockHighlight.position.set(
                this.lastLookResult.position.x + 0.5,
                this.lastLookResult.position.y + 0.5,
                this.lastLookResult.position.z + 0.5
            );
        } else {
            this.blockHighlight.visible = false;
        }

        // Block interaction
        this.handleBlockInteraction(delta);

        // Update fog based on render distance
        if (this.scene.fog) {
            const fogDist = this.world.renderDistance * CHUNK_SIZE;
            this.scene.fog.near = fogDist * 0.6;
            this.scene.fog.far = fogDist * 1.1;
        }

        // Dev tools update
        if (this.devTools) this.devTools.update();

        // HUD update
        this.hud.update(delta, this.world, this.lastLookResult);

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    handleBlockInteraction(delta) {
        this.placeDebounce = Math.max(0, this.placeDebounce - delta);
        this.breakDebounce = Math.max(0, this.breakDebounce - delta);

        // Break block
        if (this.player.isBreaking && this.lastLookResult.hit && this.breakDebounce <= 0) {
            const pos = this.lastLookResult.position;
            const block = this.world.getBlock(pos.x, pos.y, pos.z);
            const blockData = BlockData[block];

            if (blockData && blockData.hardness >= 0) {
                if (this.player.gameMode === 'creative') {
                    this.world.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);
                    this.breakDebounce = 0.15;
                } else {
                    // In survival, pick up the block
                    const drop = blockData.drops;
                    if (drop !== BlockType.AIR) {
                        this.inventory.addItem(drop, 1);
                    }
                    this.world.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);
                    this.breakDebounce = blockData.breakTime * 0.3;
                }
            }
        }

        // Place block
        if (this.player.isPlacing && this.lastLookResult.hit && this.placeDebounce <= 0) {
            const selectedBlock = this.inventory.getSelectedBlock();
            if (selectedBlock !== BlockType.AIR) {
                const pp = this.lastLookResult.placePosition;
                if (pp) {
                    // Don't place inside player
                    const px = Math.floor(this.player.position.x);
                    const py = Math.floor(this.player.position.y);
                    const pz = Math.floor(this.player.position.z);

                    if (!(pp.x === px && pp.z === pz && (pp.y === py || pp.y === py + 1))) {
                        const blockToPlace = this.inventory.useSelectedItem();
                        if (blockToPlace !== BlockType.AIR) {
                            this.world.setBlock(pp.x, pp.y, pp.z, blockToPlace);
                            this.placeDebounce = 0.2;
                        }
                    }
                }
            }
        }
    }
}

// Initialize menu
document.addEventListener('DOMContentLoaded', () => {
    window.gameState = 'menu';
    const game = new Game();

    // Settings controls
    const renderDist = document.getElementById('render-distance');
    renderDist.addEventListener('input', () => {
        document.getElementById('render-distance-val').textContent = renderDist.value;
    });

    const sensitivity = document.getElementById('sensitivity');
    sensitivity.addEventListener('input', () => {
        document.getElementById('sensitivity-val').textContent = sensitivity.value;
    });

    const fovSetting = document.getElementById('fov-setting');
    fovSetting.addEventListener('input', () => {
        document.getElementById('fov-val').textContent = fovSetting.value;
    });

    // Menu buttons
    document.getElementById('btn-play').addEventListener('click', () => {
        document.getElementById('main-menu').style.display = 'none';
        game.init('survival');
    });

    document.getElementById('btn-creative').addEventListener('click', () => {
        document.getElementById('main-menu').style.display = 'none';
        game.init('creative');
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
        document.getElementById('settings-panel').style.display = 'flex';
    });

    document.getElementById('btn-settings-back').addEventListener('click', () => {
        document.getElementById('settings-panel').style.display = 'none';
    });
});
