// Dev Tools - special features for Dev Edition
class DevTools {
    constructor(game) {
        this.game = game;
        this.wireframeMode = false;
        this.chunkBordersVisible = false;
        this.chunkBorderLines = [];
        this.init();
    }

    init() {
        // Dev panel toggle
        document.getElementById('btn-dev-tools').addEventListener('click', () => {
            const panel = document.getElementById('dev-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });

        // Dev tool buttons
        document.getElementById('dev-time-day').addEventListener('click', () => {
            this.game.world.dayTime = 0.25;
            this.game.hud.addChatMessage('Time set to day', 'system');
        });

        document.getElementById('dev-time-night').addEventListener('click', () => {
            this.game.world.dayTime = 0.75;
            this.game.hud.addChatMessage('Time set to night', 'system');
        });

        document.getElementById('dev-tp-spawn').addEventListener('click', () => {
            this.game.player.position.copy(this.game.player.spawnPoint);
            this.game.hud.addChatMessage('Teleported to spawn', 'system');
        });

        document.getElementById('dev-toggle-physics').addEventListener('click', () => {
            const nc = this.game.player.toggleNoClip();
            this.game.hud.addChatMessage(`NoClip: ${nc ? 'ON' : 'OFF'}`, 'system');
        });

        document.getElementById('dev-fill-inv').addEventListener('click', () => {
            this.game.inventory.fillAll();
            this.game.hud.addChatMessage('Inventory filled with all blocks', 'system');
        });

        document.getElementById('dev-clear-area').addEventListener('click', () => {
            const px = Math.floor(this.game.player.position.x);
            const py = Math.floor(this.game.player.position.y);
            const pz = Math.floor(this.game.player.position.z);
            this.game.world.clearArea(px, py, pz, 5);
            this.game.hud.addChatMessage('Cleared 5 block radius', 'system');
        });

        document.getElementById('dev-gen-structure').addEventListener('click', () => {
            const px = Math.floor(this.game.player.position.x);
            const py = Math.floor(this.game.player.position.y);
            const pz = Math.floor(this.game.player.position.z);
            this.game.world.generateStructure(px + 2, py, pz + 2);
            this.game.hud.addChatMessage('Structure generated nearby', 'system');
        });

        document.getElementById('dev-toggle-wireframe').addEventListener('click', () => {
            this.toggleWireframe();
        });

        document.getElementById('dev-chunk-borders').addEventListener('click', () => {
            this.toggleChunkBorders();
        });
    }

    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;

        this.game.world.chunks.forEach((chunk) => {
            if (chunk.mesh) {
                chunk.mesh.traverse(child => {
                    if (child.material) {
                        child.material.wireframe = this.wireframeMode;
                    }
                });
            }
        });

        this.game.hud.addChatMessage(`Wireframe: ${this.wireframeMode ? 'ON' : 'OFF'}`, 'system');
    }

    toggleChunkBorders() {
        this.chunkBordersVisible = !this.chunkBordersVisible;

        if (this.chunkBordersVisible) {
            this.showChunkBorders();
        } else {
            this.hideChunkBorders();
        }

        this.game.hud.addChatMessage(`Chunk borders: ${this.chunkBordersVisible ? 'ON' : 'OFF'}`, 'system');
    }

    showChunkBorders() {
        this.hideChunkBorders();

        const material = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 });

        this.game.world.chunks.forEach((chunk) => {
            const cx = chunk.cx * CHUNK_SIZE;
            const cz = chunk.cz * CHUNK_SIZE;

            const points = [
                new THREE.Vector3(cx, 0, cz),
                new THREE.Vector3(cx, CHUNK_HEIGHT, cz),
                new THREE.Vector3(cx + CHUNK_SIZE, CHUNK_HEIGHT, cz),
                new THREE.Vector3(cx + CHUNK_SIZE, 0, cz),
                new THREE.Vector3(cx, 0, cz),

                new THREE.Vector3(cx, 0, cz + CHUNK_SIZE),
                new THREE.Vector3(cx, CHUNK_HEIGHT, cz + CHUNK_SIZE),
                new THREE.Vector3(cx + CHUNK_SIZE, CHUNK_HEIGHT, cz + CHUNK_SIZE),
                new THREE.Vector3(cx + CHUNK_SIZE, 0, cz + CHUNK_SIZE),
                new THREE.Vector3(cx, 0, cz + CHUNK_SIZE),
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);
            this.game.world.scene.add(line);
            this.chunkBorderLines.push(line);

            // Top connectors
            const topPoints = [
                new THREE.Vector3(cx, CHUNK_HEIGHT, cz),
                new THREE.Vector3(cx, CHUNK_HEIGHT, cz + CHUNK_SIZE),
                new THREE.Vector3(cx + CHUNK_SIZE, CHUNK_HEIGHT, cz),
                new THREE.Vector3(cx + CHUNK_SIZE, CHUNK_HEIGHT, cz + CHUNK_SIZE),
            ];

            const topGeo = new THREE.BufferGeometry().setFromPoints(topPoints);
            const topLine = new THREE.LineSegments(topGeo, material);
            this.game.world.scene.add(topLine);
            this.chunkBorderLines.push(topLine);
        });
    }

    hideChunkBorders() {
        this.chunkBorderLines.forEach(line => {
            this.game.world.scene.remove(line);
            line.geometry.dispose();
        });
        this.chunkBorderLines = [];
    }

    update() {
        if (this.chunkBordersVisible) {
            // Update chunk borders when chunks change
        }
    }
}

window.DevTools = DevTools;
