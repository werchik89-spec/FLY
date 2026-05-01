// Touch and mouse controls
class Controls {
    constructor(player, canvas) {
        this.player = player;
        this.canvas = canvas;
        this.sensitivity = 0.003;
        this.mobileSensitivity = 0.005;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || ('ontouchstart' in window);
        this.isPointerLocked = false;

        // Joystick state
        this.joystickActive = false;
        this.joystickStartX = 0;
        this.joystickStartY = 0;
        this.joystickX = 0;
        this.joystickY = 0;

        // Camera touch state
        this.cameraTouchId = null;
        this.lastCameraX = 0;
        this.lastCameraY = 0;

        // Keyboard state
        this.keys = {};

        this.init();
    }

    init() {
        if (this.isMobile) {
            this.initTouchControls();
        } else {
            this.initDesktopControls();
        }
    }

    initDesktopControls() {
        // Pointer lock
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && window.gameState === 'playing') {
                this.canvas.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });

        // Mouse movement
        document.addEventListener('mousemove', (e) => {
            if (!this.isPointerLocked) return;

            this.player.rotation.yaw -= e.movementX * this.sensitivity;
            this.player.rotation.pitch += e.movementY * this.sensitivity;
            this.player.rotation.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.rotation.pitch));
        });

        // Mouse buttons
        document.addEventListener('mousedown', (e) => {
            if (!this.isPointerLocked) return;
            if (e.button === 0) this.player.isBreaking = true;
            if (e.button === 2) this.player.isPlacing = true;
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.player.isBreaking = false;
            if (e.button === 2) this.player.isPlacing = false;
        });

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Scroll for hotbar
        document.addEventListener('wheel', (e) => {
            if (!this.isPointerLocked) return;
            if (window.gameInventory) {
                if (e.deltaY > 0) window.gameInventory.nextSlot();
                else window.gameInventory.prevSlot();
            }
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.handleKeyUp(e);
        });
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'Escape':
                if (window.gameState === 'playing') {
                    window.togglePause();
                }
                break;
            case 'KeyE':
                if (window.gameState === 'playing') {
                    window.toggleInventory();
                }
                break;
            case 'KeyT':
            case 'Slash':
                if (window.gameState === 'playing') {
                    window.toggleChat();
                }
                break;
            case 'KeyF':
                this.player.toggleFly();
                if (window.gameHud) window.gameHud.addChatMessage(`Fly mode: ${this.player.isFlying ? 'ON' : 'OFF'}`, 'system');
                break;
            case 'F3':
                e.preventDefault();
                if (window.gameHud) window.gameHud.toggleDebug();
                break;
            case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
            case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
                if (window.gameInventory) {
                    window.gameInventory.selectSlot(parseInt(e.code.replace('Digit', '')) - 1);
                }
                break;
        }
    }

    handleKeyUp(e) {
        // Nothing specific needed
    }

    initTouchControls() {
        const joystickArea = document.getElementById('joystick-area');
        const joystickStick = document.getElementById('joystick-stick');
        const joystickBase = document.getElementById('joystick-base');

        // Joystick
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.joystickActive = true;
            const rect = joystickBase.getBoundingClientRect();
            this.joystickStartX = rect.left + rect.width / 2;
            this.joystickStartY = rect.top + rect.height / 2;
        }, { passive: false });

        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.joystickStartX;
            const dy = touch.clientY - this.joystickStartY;
            const maxDist = 40;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDist);
            const angle = Math.atan2(dy, dx);

            this.joystickX = (dist / maxDist) * Math.cos(angle);
            this.joystickY = (dist / maxDist) * Math.sin(angle);

            joystickStick.style.transform = `translate(${-50 + (this.joystickX * 40)}%, ${-50 + (this.joystickY * 40)}%)`;
        }, { passive: false });

        const endJoystick = () => {
            this.joystickActive = false;
            this.joystickX = 0;
            this.joystickY = 0;
            joystickStick.style.transform = 'translate(-50%, -50%)';
        };

        joystickArea.addEventListener('touchend', endJoystick);
        joystickArea.addEventListener('touchcancel', endJoystick);

        // Camera control (touch on canvas - right side)
        this.canvas.addEventListener('touchstart', (e) => {
            if (window.gameState !== 'playing') return;
            for (const touch of e.changedTouches) {
                if (touch.clientX > window.innerWidth * 0.3 && this.cameraTouchId === null) {
                    this.cameraTouchId = touch.identifier;
                    this.lastCameraX = touch.clientX;
                    this.lastCameraY = touch.clientY;
                }
            }
        }, { passive: true });

        this.canvas.addEventListener('touchmove', (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.cameraTouchId) {
                    const dx = touch.clientX - this.lastCameraX;
                    const dy = touch.clientY - this.lastCameraY;

                    this.player.rotation.yaw -= dx * this.mobileSensitivity;
                    this.player.rotation.pitch += dy * this.mobileSensitivity;
                    this.player.rotation.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.player.rotation.pitch));

                    this.lastCameraX = touch.clientX;
                    this.lastCameraY = touch.clientY;
                }
            }
        }, { passive: true });

        const endCamera = (e) => {
            for (const touch of e.changedTouches) {
                if (touch.identifier === this.cameraTouchId) {
                    this.cameraTouchId = null;
                }
            }
        };

        this.canvas.addEventListener('touchend', endCamera);
        this.canvas.addEventListener('touchcancel', endCamera);

        // Action buttons
        document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.input.jump = true;
        });
        document.getElementById('btn-jump').addEventListener('touchend', (e) => {
            this.player.input.jump = false;
        });

        document.getElementById('btn-fly').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.toggleFly();
            const btn = document.getElementById('btn-fly');
            btn.classList.toggle('active', this.player.isFlying);
            if (window.gameHud) window.gameHud.addChatMessage(`Fly mode: ${this.player.isFlying ? 'ON' : 'OFF'}`, 'system');
        });

        document.getElementById('btn-break').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.isBreaking = true;
        });
        document.getElementById('btn-break').addEventListener('touchend', () => {
            this.player.isBreaking = false;
        });

        document.getElementById('btn-place').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.player.isPlacing = true;
        });
        document.getElementById('btn-place').addEventListener('touchend', () => {
            this.player.isPlacing = false;
        });

        // Hotbar touch selection
        document.querySelectorAll('.hotbar-slot').forEach(slot => {
            slot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const index = parseInt(slot.dataset.slot);
                if (window.gameInventory) window.gameInventory.selectSlot(index);
            });
        });
    }

    update() {
        if (this.isMobile) {
            // Joystick input
            this.player.input.forward = -this.joystickY;
            this.player.input.right = this.joystickX;
        } else {
            // Keyboard input
            this.player.input.forward = 0;
            this.player.input.right = 0;

            if (this.keys['KeyW'] || this.keys['ArrowUp']) this.player.input.forward += 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) this.player.input.forward -= 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.player.input.right -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) this.player.input.right += 1;

            this.player.input.jump = this.keys['Space'] || false;
            this.player.isSprinting = this.keys['ShiftLeft'] || false;

            if (this.player.isFlying) {
                this.player.input.up = 0;
                if (this.keys['Space']) this.player.input.up += 1;
                if (this.keys['ShiftLeft']) this.player.input.up -= 1;
            }
        }
    }

    setSensitivity(val) {
        this.sensitivity = val * 0.001;
        this.mobileSensitivity = val * 0.001 * 1.5;
    }
}

window.Controls = Controls;
