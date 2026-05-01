// Inventory system
class Inventory {
    constructor() {
        this.slots = new Array(36).fill(null); // 36 slots (4 rows of 9)
        this.selectedSlot = 0;

        // Initialize default hotbar items
        this.slots[0] = { type: BlockType.GRASS, count: 64 };
        this.slots[1] = { type: BlockType.DIRT, count: 64 };
        this.slots[2] = { type: BlockType.STONE, count: 64 };
        this.slots[3] = { type: BlockType.WOOD_LOG, count: 64 };
        this.slots[4] = { type: BlockType.WOOD_PLANKS, count: 64 };
        this.slots[5] = { type: BlockType.GLASS, count: 64 };
        this.slots[6] = { type: BlockType.BRICK, count: 64 };
        this.slots[7] = { type: BlockType.SAND, count: 64 };
        this.slots[8] = { type: BlockType.COBBLESTONE, count: 64 };
    }

    getSelectedBlock() {
        const item = this.slots[this.selectedSlot];
        return item ? item.type : BlockType.AIR;
    }

    getSelectedItem() {
        return this.slots[this.selectedSlot];
    }

    selectSlot(index) {
        if (index < 0 || index > 8) return;
        this.selectedSlot = index;
        this.updateHotbarUI();
    }

    nextSlot() {
        this.selectedSlot = (this.selectedSlot + 1) % 9;
        this.updateHotbarUI();
    }

    prevSlot() {
        this.selectedSlot = (this.selectedSlot - 1 + 9) % 9;
        this.updateHotbarUI();
    }

    addItem(blockType, count) {
        count = count || 1;
        const maxStack = BlockData[blockType] ? BlockData[blockType].stackSize : 64;

        // Try to stack with existing
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] && this.slots[i].type === blockType && this.slots[i].count < maxStack) {
                const canAdd = Math.min(count, maxStack - this.slots[i].count);
                this.slots[i].count += canAdd;
                count -= canAdd;
                if (count <= 0) {
                    this.updateHotbarUI();
                    return true;
                }
            }
        }

        // Find empty slot
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                const canAdd = Math.min(count, maxStack);
                this.slots[i] = { type: blockType, count: canAdd };
                count -= canAdd;
                if (count <= 0) {
                    this.updateHotbarUI();
                    return true;
                }
            }
        }

        this.updateHotbarUI();
        return count <= 0;
    }

    removeItem(slotIndex, count) {
        count = count || 1;
        if (!this.slots[slotIndex]) return false;

        this.slots[slotIndex].count -= count;
        if (this.slots[slotIndex].count <= 0) {
            this.slots[slotIndex] = null;
        }

        this.updateHotbarUI();
        return true;
    }

    useSelectedItem() {
        const item = this.slots[this.selectedSlot];
        if (!item) return BlockType.AIR;

        const type = item.type;

        // In creative mode, don't consume items
        if (window.gamePlayer && window.gamePlayer.gameMode === 'creative') {
            return type;
        }

        this.removeItem(this.selectedSlot, 1);
        return type;
    }

    fillAll() {
        const allBlocks = Object.values(BlockType).filter(id =>
            id !== BlockType.AIR && id !== BlockType.WATER && id !== BlockType.BEDROCK
        );

        for (let i = 0; i < Math.min(this.slots.length, allBlocks.length); i++) {
            this.slots[i] = { type: allBlocks[i], count: 64 };
        }

        this.updateHotbarUI();
    }

    updateHotbarUI() {
        const hotbarSlots = document.querySelectorAll('.hotbar-slot');
        hotbarSlots.forEach((slot, i) => {
            slot.classList.toggle('selected', i === this.selectedSlot);

            // Clear slot content
            slot.innerHTML = '';

            const item = this.slots[i];
            if (item && BlockData[item.type]) {
                const blockData = BlockData[item.type];
                const icon = document.createElement('div');
                icon.className = 'block-icon';
                icon.style.backgroundColor = '#' + blockData.color.getHexString();
                slot.appendChild(icon);

                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'slot-count';
                    countEl.textContent = item.count;
                    slot.appendChild(countEl);
                }
            }
        });
    }

    renderInventoryScreen() {
        const grid = document.getElementById('inventory-grid');
        grid.innerHTML = '';

        for (let i = 0; i < this.slots.length; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = 'inv-slot';

            const item = this.slots[i];
            if (item && BlockData[item.type]) {
                const blockData = BlockData[item.type];
                const icon = document.createElement('div');
                icon.className = 'block-icon';
                icon.style.backgroundColor = '#' + blockData.color.getHexString();
                icon.title = blockData.name;
                slotEl.appendChild(icon);

                if (item.count > 1) {
                    const countEl = document.createElement('span');
                    countEl.className = 'slot-count';
                    countEl.textContent = item.count;
                    slotEl.appendChild(countEl);
                }
            }

            slotEl.addEventListener('click', () => {
                if (i < 9) {
                    this.selectSlot(i);
                } else if (item) {
                    // Move to hotbar
                    const emptyHotbar = this.slots.findIndex((s, idx) => idx < 9 && !s);
                    if (emptyHotbar >= 0) {
                        this.slots[emptyHotbar] = this.slots[i];
                        this.slots[i] = null;
                    } else {
                        // Swap with selected
                        const temp = this.slots[this.selectedSlot];
                        this.slots[this.selectedSlot] = this.slots[i];
                        this.slots[i] = temp;
                    }
                    this.renderInventoryScreen();
                    this.updateHotbarUI();
                }
            });

            grid.appendChild(slotEl);
        }
    }
}

window.Inventory = Inventory;
