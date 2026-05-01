// World / Chunk management
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64;
const SEA_LEVEL = 20;

class Chunk {
    constructor(cx, cz) {
        this.cx = cx;
        this.cz = cz;
        this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
        this.mesh = null;
        this.dirty = true;
    }

    getIndex(x, y, z) {
        return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
        this.blocks[this.getIndex(x, y, z)] = type;
        this.dirty = true;
    }
}

class World {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 1000000);
        this.noise = new SimplexNoise(this.seed);
        this.chunks = new Map();
        this.renderDistance = 4;
        this.scene = null;
        this.dayTime = 0.25; // 0-1, 0.25 = noon
        this.timeSpeed = 0.001;
        this.ambientLight = null;
        this.directionalLight = null;
        this.sunLight = null;
    }

    chunkKey(cx, cz) {
        return `${cx},${cz}`;
    }

    getChunk(cx, cz) {
        return this.chunks.get(this.chunkKey(cx, cz));
    }

    getBlock(wx, wy, wz) {
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        const chunk = this.getChunk(cx, cz);
        if (!chunk) return BlockType.AIR;

        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return chunk.getBlock(lx, wy, lz);
    }

    setBlock(wx, wy, wz, type) {
        const cx = Math.floor(wx / CHUNK_SIZE);
        const cz = Math.floor(wz / CHUNK_SIZE);
        let chunk = this.getChunk(cx, cz);
        if (!chunk) return;

        const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        chunk.setBlock(lx, wy, lz, type);

        // Mark neighboring chunks dirty if on edge
        if (lx === 0) { const nc = this.getChunk(cx - 1, cz); if (nc) nc.dirty = true; }
        if (lx === CHUNK_SIZE - 1) { const nc = this.getChunk(cx + 1, cz); if (nc) nc.dirty = true; }
        if (lz === 0) { const nc = this.getChunk(cx, cz - 1); if (nc) nc.dirty = true; }
        if (lz === CHUNK_SIZE - 1) { const nc = this.getChunk(cx, cz + 1); if (nc) nc.dirty = true; }
    }

    generateChunk(cx, cz) {
        const chunk = new Chunk(cx, cz);

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const wx = cx * CHUNK_SIZE + x;
                const wz = cz * CHUNK_SIZE + z;

                // Multi-octave terrain height
                const baseHeight = this.noise.octave2D(wx * 0.005, wz * 0.005, 6, 0.5);
                const detail = this.noise.octave2D(wx * 0.02, wz * 0.02, 4, 0.5) * 0.3;
                const mountains = Math.max(0, this.noise.octave2D(wx * 0.003, wz * 0.003, 4, 0.45)) * 20;

                const height = Math.floor(SEA_LEVEL + baseHeight * 12 + detail * 5 + mountains);
                const clampedHeight = Math.min(height, CHUNK_HEIGHT - 1);

                // Biome determination
                const temp = this.noise.octave2D(wx * 0.002 + 500, wz * 0.002 + 500, 3, 0.5);
                const moisture = this.noise.octave2D(wx * 0.002 + 1000, wz * 0.002 + 1000, 3, 0.5);

                const isDesert = temp > 0.3 && moisture < -0.1;
                const isSnowy = temp < -0.35;
                const isBeach = clampedHeight <= SEA_LEVEL + 1 && clampedHeight >= SEA_LEVEL - 1;

                for (let y = 0; y < CHUNK_HEIGHT; y++) {
                    let blockType = BlockType.AIR;

                    if (y === 0) {
                        blockType = BlockType.BEDROCK;
                    } else if (y < clampedHeight - 4) {
                        blockType = BlockType.STONE;

                        // Ore generation
                        const oreNoise = this.noise.noise3D(wx * 0.1, y * 0.1, wz * 0.1);
                        if (y < 12 && oreNoise > 0.7) blockType = BlockType.DIAMOND_ORE;
                        else if (y < 20 && oreNoise > 0.65) blockType = BlockType.GOLD_ORE;
                        else if (y < 32 && oreNoise > 0.6) blockType = BlockType.REDSTONE_ORE;
                        else if (y < 40 && oreNoise > 0.55) blockType = BlockType.IRON_ORE;
                        else if (y < 50 && oreNoise > 0.5) blockType = BlockType.COAL_ORE;
                        else if (y < 25 && oreNoise > 0.68) blockType = BlockType.EMERALD_ORE;
                    } else if (y < clampedHeight) {
                        if (isDesert) blockType = BlockType.SANDSTONE;
                        else blockType = BlockType.DIRT;
                    } else if (y === clampedHeight) {
                        if (isBeach || isDesert) blockType = BlockType.SAND;
                        else if (isSnowy) blockType = BlockType.SNOW;
                        else blockType = BlockType.GRASS;
                    } else if (y <= SEA_LEVEL && y > clampedHeight) {
                        blockType = BlockType.WATER;
                    }

                    chunk.setBlock(x, y, z, blockType);
                }

                // Tree generation
                if (!isDesert && !isBeach && clampedHeight > SEA_LEVEL + 1 && clampedHeight < CHUNK_HEIGHT - 8) {
                    const treeNoise = this.noise.noise2D(wx * 0.5, wz * 0.5);
                    if (treeNoise > 0.6 && x > 2 && x < CHUNK_SIZE - 3 && z > 2 && z < CHUNK_SIZE - 3) {
                        this.generateTree(chunk, x, clampedHeight + 1, z, isSnowy);
                    }
                }
            }
        }

        this.chunks.set(this.chunkKey(cx, cz), chunk);
        return chunk;
    }

    generateTree(chunk, x, y, z, snowy) {
        const trunkHeight = 4 + Math.floor(Math.random() * 3);

        // Trunk
        for (let ty = 0; ty < trunkHeight; ty++) {
            if (y + ty < CHUNK_HEIGHT) {
                chunk.setBlock(x, y + ty, z, BlockType.WOOD_LOG);
            }
        }

        // Leaves
        const leafStart = y + trunkHeight - 2;
        for (let ly = leafStart; ly <= y + trunkHeight + 1; ly++) {
            const radius = ly === y + trunkHeight + 1 ? 1 : 2;
            for (let lx = -radius; lx <= radius; lx++) {
                for (let lz = -radius; lz <= radius; lz++) {
                    if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.5) continue;
                    const bx = x + lx;
                    const bz = z + lz;
                    if (bx >= 0 && bx < CHUNK_SIZE && bz >= 0 && bz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
                        if (chunk.getBlock(bx, ly, bz) === BlockType.AIR) {
                            chunk.setBlock(bx, ly, bz, snowy ? BlockType.SNOW : BlockType.LEAVES);
                        }
                    }
                }
            }
        }
    }

    buildChunkMesh(chunk) {
        if (chunk.mesh) {
            this.scene.remove(chunk.mesh);
            chunk.mesh.geometry.dispose();
            if (Array.isArray(chunk.mesh.material)) {
                chunk.mesh.material.forEach(m => m.dispose());
            } else {
                chunk.mesh.material.dispose();
            }
        }

        const positions = [];
        const colors = [];
        const indices = [];
        let vertexCount = 0;

        const waterPositions = [];
        const waterColors = [];
        const waterIndices = [];
        let waterVertexCount = 0;

        const faces = [
            { dir: [0, 1, 0], name: 'top', corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
            { dir: [0, -1, 0], name: 'bottom', corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
            { dir: [0, 0, 1], name: 'front', corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
            { dir: [0, 0, -1], name: 'back', corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
            { dir: [1, 0, 0], name: 'right', corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },
            { dir: [-1, 0, 0], name: 'left', corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] }
        ];

        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const block = chunk.getBlock(x, y, z);
                    if (block === BlockType.AIR) continue;

                    const isWater = block === BlockType.WATER;

                    for (const face of faces) {
                        const nx = x + face.dir[0];
                        const ny = y + face.dir[1];
                        const nz = z + face.dir[2];

                        let neighbor;
                        if (nx < 0 || nx >= CHUNK_SIZE || nz < 0 || nz >= CHUNK_SIZE) {
                            const wx = chunk.cx * CHUNK_SIZE + nx;
                            const wz = chunk.cz * CHUNK_SIZE + nz;
                            neighbor = this.getBlock(wx, ny, wz);
                        } else {
                            neighbor = chunk.getBlock(nx, ny, nz);
                        }

                        const neighborData = BlockData[neighbor];
                        const shouldRender = neighbor === BlockType.AIR ||
                            (neighborData && neighborData.transparent && neighbor !== block);

                        if (!shouldRender) continue;

                        const color = getBlockColor(block, face.name);
                        const worldX = chunk.cx * CHUNK_SIZE;
                        const worldZ = chunk.cz * CHUNK_SIZE;

                        if (isWater) {
                            for (const corner of face.corners) {
                                waterPositions.push(
                                    worldX + x + corner[0],
                                    y + corner[1] * (face.name === 'top' ? 0.9 : 1),
                                    worldZ + z + corner[2]
                                );
                                waterColors.push(color.r, color.g, color.b);
                            }
                            waterIndices.push(
                                waterVertexCount, waterVertexCount + 1, waterVertexCount + 2,
                                waterVertexCount, waterVertexCount + 2, waterVertexCount + 3
                            );
                            waterVertexCount += 4;
                        } else {
                            for (const corner of face.corners) {
                                positions.push(
                                    worldX + x + corner[0],
                                    y + corner[1],
                                    worldZ + z + corner[2]
                                );
                                colors.push(color.r, color.g, color.b);
                            }
                            indices.push(
                                vertexCount, vertexCount + 1, vertexCount + 2,
                                vertexCount, vertexCount + 2, vertexCount + 3
                            );
                            vertexCount += 4;
                        }
                    }
                }
            }
        }

        const group = new THREE.Group();

        if (positions.length > 0) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geo.setIndex(indices);
            geo.computeVertexNormals();

            const mat = new THREE.MeshLambertMaterial({
                vertexColors: true,
                side: THREE.FrontSide
            });

            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);
        }

        if (waterPositions.length > 0) {
            const waterGeo = new THREE.BufferGeometry();
            waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
            waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(waterColors, 3));
            waterGeo.setIndex(waterIndices);
            waterGeo.computeVertexNormals();

            const waterMat = new THREE.MeshLambertMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            });

            const waterMesh = new THREE.Mesh(waterGeo, waterMat);
            group.add(waterMesh);
        }

        chunk.mesh = group;
        chunk.dirty = false;
        this.scene.add(group);
    }

    updateChunks(playerX, playerZ) {
        const pcx = Math.floor(playerX / CHUNK_SIZE);
        const pcz = Math.floor(playerZ / CHUNK_SIZE);

        const neededChunks = new Set();

        for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
            for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
                if (dx * dx + dz * dz > this.renderDistance * this.renderDistance + 1) continue;
                const cx = pcx + dx;
                const cz = pcz + dz;
                const key = this.chunkKey(cx, cz);
                neededChunks.add(key);

                if (!this.chunks.has(key)) {
                    this.generateChunk(cx, cz);
                }
            }
        }

        // Unload far chunks
        for (const [key, chunk] of this.chunks) {
            if (!neededChunks.has(key)) {
                if (chunk.mesh) {
                    this.scene.remove(chunk.mesh);
                    chunk.mesh.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    });
                }
                this.chunks.delete(key);
            }
        }

        // Rebuild dirty chunks
        for (const [key, chunk] of this.chunks) {
            if (chunk.dirty) {
                this.buildChunkMesh(chunk);
            }
        }
    }

    clearArea(cx, cy, cz, radius) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            for (let y = cy - radius; y <= cy + radius; y++) {
                for (let z = cz - radius; z <= cz + radius; z++) {
                    if (y > 0 && y < CHUNK_HEIGHT) {
                        this.setBlock(x, y, z, BlockType.AIR);
                    }
                }
            }
        }
    }

    generateStructure(wx, wy, wz) {
        // Generate a simple house
        const w = 7, h = 5, d = 7;

        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                for (let z = 0; z < d; z++) {
                    let block = BlockType.AIR;

                    if (y === 0) {
                        block = BlockType.WOOD_PLANKS;
                    } else if (y === h - 1) {
                        block = BlockType.WOOD_PLANKS;
                    } else if (x === 0 || x === w - 1 || z === 0 || z === d - 1) {
                        if (y === 2 && (x === 0 || x === w - 1) && z > 1 && z < d - 2) {
                            block = BlockType.GLASS;
                        } else if (y === 2 && (z === 0 || z === d - 1) && x > 1 && x < w - 2) {
                            block = BlockType.GLASS;
                        } else if (z === d - 1 && x === Math.floor(w / 2) && y <= 2) {
                            block = BlockType.AIR; // Door
                        } else {
                            block = BlockType.WOOD_PLANKS;
                        }
                    }

                    if (block !== BlockType.AIR) {
                        this.setBlock(wx + x, wy + y, wz + z, block);
                    }
                }
            }
        }

        // Torch (glowstone as replacement)
        this.setBlock(wx + 3, wy + 3, wz + 1, BlockType.GLOWSTONE);
        this.setBlock(wx + 3, wy + 1, wz + 3, BlockType.CRAFTING_TABLE);
    }

    getSpawnHeight(wx, wz) {
        for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
            const block = this.getBlock(wx, y, wz);
            if (block !== BlockType.AIR && block !== BlockType.WATER) {
                return y + 1;
            }
        }
        return SEA_LEVEL + 5;
    }

    updateDayNight(delta) {
        this.dayTime = (this.dayTime + this.timeSpeed * delta) % 1;

        const sunAngle = this.dayTime * Math.PI * 2;
        const sunHeight = Math.sin(sunAngle);
        const brightness = Math.max(0.15, Math.min(1, sunHeight + 0.3));

        if (this.ambientLight) {
            this.ambientLight.intensity = 0.2 + brightness * 0.4;
        }

        if (this.directionalLight) {
            this.directionalLight.position.set(
                Math.cos(sunAngle) * 100,
                Math.sin(sunAngle) * 100,
                50
            );
            this.directionalLight.intensity = Math.max(0, brightness * 0.8);

            const sunColor = new THREE.Color();
            if (sunHeight > 0.1) {
                sunColor.setHSL(0.1, 0.2, 0.8 + sunHeight * 0.2);
            } else if (sunHeight > -0.1) {
                sunColor.setHSL(0.05, 0.8, 0.5);
            } else {
                sunColor.setHSL(0.65, 0.3, 0.15);
            }
            this.directionalLight.color = sunColor;
        }

        // Sky color
        if (this.scene && this.scene.background) {
            const skyColor = new THREE.Color();
            if (sunHeight > 0.1) {
                skyColor.setHSL(0.58, 0.6, 0.5 + sunHeight * 0.3);
            } else if (sunHeight > -0.1) {
                skyColor.setHSL(0.05, 0.6, 0.3);
            } else {
                skyColor.setHSL(0.65, 0.5, 0.05);
            }
            this.scene.background = skyColor;
        }

        if (this.scene && this.scene.fog) {
            this.scene.fog.color.copy(this.scene.background);
        }
    }

    raycast(origin, direction, maxDist) {
        const step = 0.05;
        const pos = origin.clone();
        const dir = direction.clone().normalize().multiplyScalar(step);
        let prevBlock = { x: 0, y: 0, z: 0 };

        for (let d = 0; d < maxDist; d += step) {
            const bx = Math.floor(pos.x);
            const by = Math.floor(pos.y);
            const bz = Math.floor(pos.z);

            const block = this.getBlock(bx, by, bz);
            if (block !== BlockType.AIR && block !== BlockType.WATER) {
                return {
                    hit: true,
                    block: block,
                    position: { x: bx, y: by, z: bz },
                    normal: {
                        x: prevBlock.x - bx,
                        y: prevBlock.y - by,
                        z: prevBlock.z - bz
                    },
                    placePosition: prevBlock,
                    distance: d
                };
            }

            prevBlock = { x: bx, y: by, z: bz };
            pos.add(dir);
        }

        return { hit: false };
    }
}

window.CHUNK_SIZE = CHUNK_SIZE;
window.CHUNK_HEIGHT = CHUNK_HEIGHT;
window.SEA_LEVEL = SEA_LEVEL;
window.World = World;
