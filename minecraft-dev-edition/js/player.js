// Player class
class Player {
    constructor() {
        this.position = new THREE.Vector3(8, 30, 8);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = { yaw: 0, pitch: 0 };

        this.camera = null;
        this.height = 1.7;
        this.width = 0.3;
        this.eyeHeight = 1.6;

        // Movement
        this.speed = 4.3;
        this.sprintSpeed = 5.6;
        this.flySpeed = 10;
        this.jumpForce = 8;
        this.gravity = -20;
        this.isSprinting = false;
        this.isOnGround = false;

        // States
        this.isFlying = false;
        this.noClip = false;
        this.gameMode = 'survival'; // survival, creative

        // Stats
        this.health = 20;
        this.maxHealth = 20;
        this.hunger = 20;
        this.maxHunger = 20;

        // Look direction
        this.forward = new THREE.Vector3();
        this.right = new THREE.Vector3();

        // Input state
        this.input = {
            forward: 0,
            right: 0,
            up: 0,
            jump: false,
            sprint: false
        };

        // Block interaction
        this.breakProgress = 0;
        this.breakTarget = null;
        this.isBreaking = false;
        this.isPlacing = false;

        this.spawnPoint = new THREE.Vector3(8, 30, 8);
    }

    init(camera) {
        this.camera = camera;
    }

    setGameMode(mode) {
        this.gameMode = mode;
        if (mode === 'creative') {
            this.isFlying = true;
            this.health = 20;
            this.hunger = 20;
        }
    }

    toggleFly() {
        this.isFlying = !this.isFlying;
        if (this.isFlying) {
            this.velocity.y = 0;
        }
        return this.isFlying;
    }

    toggleNoClip() {
        this.noClip = !this.noClip;
        return this.noClip;
    }

    update(delta, world) {
        // Calculate movement directions
        this.forward.set(
            -Math.sin(this.rotation.yaw),
            0,
            -Math.cos(this.rotation.yaw)
        ).normalize();

        this.right.set(
            Math.cos(this.rotation.yaw),
            0,
            -Math.sin(this.rotation.yaw)
        ).normalize();

        const currentSpeed = this.isFlying ? this.flySpeed :
            (this.isSprinting ? this.sprintSpeed : this.speed);

        // Calculate desired velocity
        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(this.forward, this.input.forward);
        moveDir.addScaledVector(this.right, this.input.right);

        if (moveDir.length() > 0) {
            moveDir.normalize();
        }

        if (this.isFlying) {
            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;
            this.velocity.y = this.input.up * currentSpeed;

            if (this.input.jump) {
                this.velocity.y = currentSpeed;
            }
        } else {
            this.velocity.x = moveDir.x * currentSpeed;
            this.velocity.z = moveDir.z * currentSpeed;

            // Gravity
            this.velocity.y += this.gravity * delta;

            // Jump
            if (this.input.jump && this.isOnGround) {
                this.velocity.y = this.jumpForce;
                this.isOnGround = false;
            }
        }

        // Apply velocity with collision
        if (this.noClip) {
            this.position.x += this.velocity.x * delta;
            this.position.y += this.velocity.y * delta;
            this.position.z += this.velocity.z * delta;
        } else {
            this.moveWithCollision(delta, world);
        }

        // Clamp to world bounds
        if (this.position.y < -10) {
            this.respawn();
        }

        // Update camera
        if (this.camera) {
            this.camera.position.set(
                this.position.x,
                this.position.y + this.eyeHeight,
                this.position.z
            );

            const lookDir = new THREE.Vector3(
                -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
                Math.sin(this.rotation.pitch),
                -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
            );

            this.camera.lookAt(
                this.camera.position.x + lookDir.x,
                this.camera.position.y + lookDir.y,
                this.camera.position.z + lookDir.z
            );
        }

        // Hunger drain (survival mode)
        if (this.gameMode === 'survival') {
            if (moveDir.length() > 0) {
                this.hunger = Math.max(0, this.hunger - delta * 0.02);
            }
            if (this.hunger <= 0) {
                this.health = Math.max(0, this.health - delta * 0.5);
            } else if (this.hunger > 18 && this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + delta * 0.5);
            }
        }
    }

    moveWithCollision(delta, world) {
        const hw = this.width;
        const feetY = this.position.y;
        const headY = this.position.y + this.height;

        // Move X
        const newX = this.position.x + this.velocity.x * delta;
        if (!this.checkCollision(newX, this.position.y, this.position.z, world)) {
            this.position.x = newX;
        } else {
            this.velocity.x = 0;
        }

        // Move Z
        const newZ = this.position.z + this.velocity.z * delta;
        if (!this.checkCollision(this.position.x, this.position.y, newZ, world)) {
            this.position.z = newZ;
        } else {
            this.velocity.z = 0;
        }

        // Move Y
        const newY = this.position.y + this.velocity.y * delta;
        if (!this.checkCollision(this.position.x, newY, this.position.z, world)) {
            this.position.y = newY;
            this.isOnGround = false;
        } else {
            if (this.velocity.y < 0) {
                this.isOnGround = true;
                // Snap to ground
                this.position.y = Math.floor(this.position.y) + 0.001;
            }
            this.velocity.y = 0;
        }
    }

    checkCollision(x, y, z, world) {
        const hw = this.width;
        const corners = [
            [x - hw, z - hw],
            [x + hw, z - hw],
            [x - hw, z + hw],
            [x + hw, z + hw]
        ];

        for (let dy = 0; dy <= this.height; dy += 0.5) {
            const checkY = Math.floor(y + dy);
            if (checkY < 0 || checkY >= CHUNK_HEIGHT) continue;

            for (const [cx, cz] of corners) {
                const bx = Math.floor(cx);
                const bz = Math.floor(cz);
                const block = world.getBlock(bx, checkY, bz);

                if (block !== BlockType.AIR && BlockData[block] && BlockData[block].solid) {
                    return true;
                }
            }
        }

        return false;
    }

    getLookDirection() {
        return new THREE.Vector3(
            -Math.sin(this.rotation.yaw) * Math.cos(this.rotation.pitch),
            Math.sin(this.rotation.pitch),
            -Math.cos(this.rotation.yaw) * Math.cos(this.rotation.pitch)
        ).normalize();
    }

    respawn() {
        this.position.copy(this.spawnPoint);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
    }

    takeDamage(amount) {
        if (this.gameMode === 'creative') return;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.respawn();
        }
    }
}

window.Player = Player;
