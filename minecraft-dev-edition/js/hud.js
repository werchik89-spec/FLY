// HUD management
class HUD {
    constructor(player) {
        this.player = player;
        this.showDebug = true;
        this.fpsFrames = 0;
        this.fpsTime = 0;
        this.currentFps = 0;
        this.chatMessages = [];
        this.maxChatMessages = 50;
    }

    update(delta, world, lookResult) {
        // FPS counter
        this.fpsFrames++;
        this.fpsTime += delta;
        if (this.fpsTime >= 1) {
            this.currentFps = this.fpsFrames;
            this.fpsFrames = 0;
            this.fpsTime = 0;
        }

        // Update debug info
        if (this.showDebug) {
            document.getElementById('fps-counter').textContent = `FPS: ${this.currentFps}`;
            document.getElementById('position-info').textContent =
                `X: ${this.player.position.x.toFixed(1)} Y: ${this.player.position.y.toFixed(1)} Z: ${this.player.position.z.toFixed(1)}`;

            const cx = Math.floor(this.player.position.x / CHUNK_SIZE);
            const cz = Math.floor(this.player.position.z / CHUNK_SIZE);
            document.getElementById('chunk-info').textContent = `Chunk: ${cx}, ${cz}`;

            if (lookResult && lookResult.hit) {
                const bd = BlockData[lookResult.block];
                document.getElementById('block-info').textContent =
                    `Looking at: ${bd ? bd.name : 'Unknown'} (${lookResult.position.x}, ${lookResult.position.y}, ${lookResult.position.z})`;
            } else {
                document.getElementById('block-info').textContent = 'Looking at: none';
            }

            document.getElementById('mode-info').textContent =
                `Mode: ${this.player.gameMode} ${this.player.isFlying ? '[FLY]' : ''} ${this.player.noClip ? '[NOCLIP]' : ''}`;
        }

        // Update health and hunger bars
        const healthPct = (this.player.health / this.player.maxHealth) * 100;
        const hungerPct = (this.player.hunger / this.player.maxHunger) * 100;

        document.getElementById('health-fill').style.width = healthPct + '%';
        document.getElementById('health-label').textContent =
            `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        document.getElementById('hunger-fill').style.width = hungerPct + '%';
        document.getElementById('hunger-label').textContent =
            `${Math.ceil(this.player.hunger)}/${this.player.maxHunger}`;
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
        document.getElementById('debug-info').style.display = this.showDebug ? 'block' : 'none';
    }

    addChatMessage(text, type) {
        type = type || 'normal';
        this.chatMessages.push({ text, type, time: Date.now() });
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages.shift();
        }
        this.renderChat();
    }

    renderChat() {
        const chatEl = document.getElementById('chat-messages');
        if (!chatEl) return;

        chatEl.innerHTML = '';
        const recent = this.chatMessages.slice(-10);
        recent.forEach(msg => {
            const el = document.createElement('div');
            el.className = `chat-msg ${msg.type}`;
            el.textContent = msg.text;
            chatEl.appendChild(el);
        });
        chatEl.scrollTop = chatEl.scrollHeight;
    }

    processCommand(input) {
        const parts = input.trim().split(' ');
        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case '/tp':
            case '/teleport': {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                    this.player.position.set(x, y, z);
                    this.addChatMessage(`Teleported to ${x}, ${y}, ${z}`, 'system');
                } else {
                    this.addChatMessage('Usage: /tp <x> <y> <z>', 'error');
                }
                break;
            }

            case '/gamemode':
            case '/gm': {
                const mode = parts[1];
                if (mode === 'creative' || mode === 'c' || mode === '1') {
                    this.player.setGameMode('creative');
                    this.addChatMessage('Game mode set to Creative', 'system');
                } else if (mode === 'survival' || mode === 's' || mode === '0') {
                    this.player.setGameMode('survival');
                    this.addChatMessage('Game mode set to Survival', 'system');
                } else {
                    this.addChatMessage('Usage: /gamemode <survival|creative>', 'error');
                }
                break;
            }

            case '/fly': {
                const flying = this.player.toggleFly();
                this.addChatMessage(`Fly mode: ${flying ? 'ON' : 'OFF'}`, 'system');
                break;
            }

            case '/noclip': {
                const nc = this.player.toggleNoClip();
                this.addChatMessage(`NoClip: ${nc ? 'ON' : 'OFF'}`, 'system');
                break;
            }

            case '/give': {
                const blockName = parts[1];
                const count = parseInt(parts[2]) || 64;
                const blockId = Object.entries(BlockType).find(([k]) => k.toLowerCase() === blockName?.toLowerCase());
                if (blockId) {
                    window.gameInventory.addItem(blockId[1], count);
                    this.addChatMessage(`Given ${count}x ${blockName}`, 'system');
                } else {
                    this.addChatMessage('Usage: /give <block_name> [count]', 'error');
                    this.addChatMessage('Blocks: ' + Object.keys(BlockType).join(', '), 'system');
                }
                break;
            }

            case '/time': {
                const val = parts[1];
                if (val === 'day') {
                    window.gameWorld.dayTime = 0.25;
                    this.addChatMessage('Time set to day', 'system');
                } else if (val === 'night') {
                    window.gameWorld.dayTime = 0.75;
                    this.addChatMessage('Time set to night', 'system');
                } else if (val === 'noon') {
                    window.gameWorld.dayTime = 0.25;
                    this.addChatMessage('Time set to noon', 'system');
                } else {
                    const t = parseFloat(val);
                    if (!isNaN(t)) {
                        window.gameWorld.dayTime = t;
                        this.addChatMessage(`Time set to ${t}`, 'system');
                    } else {
                        this.addChatMessage('Usage: /time <day|night|noon|0-1>', 'error');
                    }
                }
                break;
            }

            case '/speed': {
                const spd = parseFloat(parts[1]);
                if (!isNaN(spd)) {
                    this.player.speed = spd;
                    this.player.flySpeed = spd * 2;
                    this.addChatMessage(`Speed set to ${spd}`, 'system');
                } else {
                    this.addChatMessage('Usage: /speed <value>', 'error');
                }
                break;
            }

            case '/heal': {
                this.player.health = this.player.maxHealth;
                this.player.hunger = this.player.maxHunger;
                this.addChatMessage('Healed!', 'system');
                break;
            }

            case '/seed': {
                this.addChatMessage(`World seed: ${window.gameWorld.seed}`, 'system');
                break;
            }

            case '/clear': {
                const r = parseInt(parts[1]) || 5;
                const px = Math.floor(this.player.position.x);
                const py = Math.floor(this.player.position.y);
                const pz = Math.floor(this.player.position.z);
                window.gameWorld.clearArea(px, py, pz, r);
                this.addChatMessage(`Cleared ${r} block radius`, 'system');
                break;
            }

            case '/help': {
                this.addChatMessage('--- Dev Edition Commands ---', 'system');
                this.addChatMessage('/tp <x> <y> <z> - Teleport', 'system');
                this.addChatMessage('/gamemode <survival|creative> - Game mode', 'system');
                this.addChatMessage('/fly - Toggle fly', 'system');
                this.addChatMessage('/noclip - Toggle noclip', 'system');
                this.addChatMessage('/give <block> [count] - Give blocks', 'system');
                this.addChatMessage('/time <day|night|value> - Set time', 'system');
                this.addChatMessage('/speed <value> - Set speed', 'system');
                this.addChatMessage('/heal - Full heal', 'system');
                this.addChatMessage('/seed - Show seed', 'system');
                this.addChatMessage('/clear [radius] - Clear area', 'system');
                break;
            }

            default:
                this.addChatMessage(`Unknown command: ${cmd}. Type /help for commands.`, 'error');
        }
    }
}

window.HUD = HUD;
