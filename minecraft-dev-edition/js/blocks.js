// Block definitions for Minecraft Dev Edition
const BlockType = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    COBBLESTONE: 4,
    WOOD_LOG: 5,
    WOOD_PLANKS: 6,
    LEAVES: 7,
    SAND: 8,
    WATER: 9,
    GLASS: 10,
    BRICK: 11,
    COAL_ORE: 12,
    IRON_ORE: 13,
    GOLD_ORE: 14,
    DIAMOND_ORE: 15,
    BEDROCK: 16,
    GRAVEL: 17,
    SNOW: 18,
    ICE: 19,
    OBSIDIAN: 20,
    GLOWSTONE: 21,
    TNT: 22,
    CRAFTING_TABLE: 23,
    FURNACE: 24,
    DEV_BLOCK: 25,
    COMMAND_BLOCK: 26,
    BARRIER: 27,
    STRUCTURE_BLOCK: 28,
    REDSTONE_ORE: 29,
    EMERALD_ORE: 30,
    CLAY: 31,
    SANDSTONE: 32
};

const BlockData = {};

function defineBlock(id, name, color, options = {}) {
    BlockData[id] = {
        id,
        name,
        color: new THREE.Color(color),
        transparent: options.transparent || false,
        solid: options.solid !== undefined ? options.solid : true,
        breakTime: options.breakTime || 1.0,
        luminance: options.luminance || 0,
        hardness: options.hardness || 1,
        tool: options.tool || 'hand',
        drops: options.drops !== undefined ? options.drops : id,
        stackSize: options.stackSize || 64
    };
}

defineBlock(BlockType.AIR, 'Air', 0x000000, { transparent: true, solid: false, hardness: 0 });
defineBlock(BlockType.GRASS, 'Grass Block', 0x5d8c3e, { breakTime: 0.6, tool: 'shovel' });
defineBlock(BlockType.DIRT, 'Dirt', 0x8b6b4a, { breakTime: 0.5, tool: 'shovel' });
defineBlock(BlockType.STONE, 'Stone', 0x888888, { breakTime: 1.5, tool: 'pickaxe', drops: BlockType.COBBLESTONE });
defineBlock(BlockType.COBBLESTONE, 'Cobblestone', 0x777777, { breakTime: 2.0, tool: 'pickaxe' });
defineBlock(BlockType.WOOD_LOG, 'Oak Log', 0x6b4423, { breakTime: 2.0, tool: 'axe' });
defineBlock(BlockType.WOOD_PLANKS, 'Oak Planks', 0xbc9862, { breakTime: 2.0, tool: 'axe' });
defineBlock(BlockType.LEAVES, 'Oak Leaves', 0x3a7d22, { transparent: true, breakTime: 0.2 });
defineBlock(BlockType.SAND, 'Sand', 0xdbd3a0, { breakTime: 0.5, tool: 'shovel' });
defineBlock(BlockType.WATER, 'Water', 0x3366cc, { transparent: true, solid: false, hardness: -1 });
defineBlock(BlockType.GLASS, 'Glass', 0xc8e8f0, { transparent: true, breakTime: 0.3, drops: BlockType.AIR });
defineBlock(BlockType.BRICK, 'Bricks', 0xb55a3a, { breakTime: 2.0, tool: 'pickaxe' });
defineBlock(BlockType.COAL_ORE, 'Coal Ore', 0x444444, { breakTime: 3.0, tool: 'pickaxe' });
defineBlock(BlockType.IRON_ORE, 'Iron Ore', 0xd4a574, { breakTime: 3.0, tool: 'pickaxe' });
defineBlock(BlockType.GOLD_ORE, 'Gold Ore', 0xfcee4b, { breakTime: 3.0, tool: 'pickaxe' });
defineBlock(BlockType.DIAMOND_ORE, 'Diamond Ore', 0x4aedd9, { breakTime: 5.0, tool: 'pickaxe' });
defineBlock(BlockType.BEDROCK, 'Bedrock', 0x333333, { hardness: -1 });
defineBlock(BlockType.GRAVEL, 'Gravel', 0x8a8078, { breakTime: 0.6, tool: 'shovel' });
defineBlock(BlockType.SNOW, 'Snow', 0xf0f0f0, { breakTime: 0.2, tool: 'shovel' });
defineBlock(BlockType.ICE, 'Ice', 0xa5d6f7, { transparent: true, breakTime: 0.5 });
defineBlock(BlockType.OBSIDIAN, 'Obsidian', 0x1a0a2e, { breakTime: 50.0, tool: 'pickaxe', hardness: 50 });
defineBlock(BlockType.GLOWSTONE, 'Glowstone', 0xfff4a3, { breakTime: 0.3, luminance: 15 });
defineBlock(BlockType.TNT, 'TNT', 0xff3333, { breakTime: 0.0 });
defineBlock(BlockType.CRAFTING_TABLE, 'Crafting Table', 0x9c6b3a, { breakTime: 2.5, tool: 'axe' });
defineBlock(BlockType.FURNACE, 'Furnace', 0x888888, { breakTime: 3.5, tool: 'pickaxe' });
defineBlock(BlockType.DEV_BLOCK, 'Dev Block', 0xff00ff, { breakTime: 0.0, luminance: 15 });
defineBlock(BlockType.COMMAND_BLOCK, 'Command Block', 0xe08850, { breakTime: 0.0, luminance: 5 });
defineBlock(BlockType.BARRIER, 'Barrier', 0xff0000, { transparent: true, hardness: -1 });
defineBlock(BlockType.STRUCTURE_BLOCK, 'Structure Block', 0x9966cc, { breakTime: 0.0 });
defineBlock(BlockType.REDSTONE_ORE, 'Redstone Ore', 0xcc3333, { breakTime: 3.0, tool: 'pickaxe' });
defineBlock(BlockType.EMERALD_ORE, 'Emerald Ore', 0x17dd62, { breakTime: 3.0, tool: 'pickaxe' });
defineBlock(BlockType.CLAY, 'Clay', 0xa4a8b8, { breakTime: 0.6, tool: 'shovel' });
defineBlock(BlockType.SANDSTONE, 'Sandstone', 0xd4c37d, { breakTime: 2.0, tool: 'pickaxe' });

function getBlockColor(blockType, face) {
    const data = BlockData[blockType];
    if (!data) return new THREE.Color(0xff00ff);

    const baseColor = data.color.clone();

    if (blockType === BlockType.GRASS) {
        if (face === 'top') return new THREE.Color(0x4caf50);
        if (face === 'bottom') return new THREE.Color(0x8b6b4a);
        return baseColor;
    }

    if (blockType === BlockType.WOOD_LOG) {
        if (face === 'top' || face === 'bottom') return new THREE.Color(0xbc9862);
        return baseColor;
    }

    // Slightly vary colors per face for depth
    switch (face) {
        case 'top': return baseColor.clone().multiplyScalar(1.1);
        case 'bottom': return baseColor.clone().multiplyScalar(0.7);
        case 'front':
        case 'back': return baseColor.clone().multiplyScalar(0.9);
        case 'left':
        case 'right': return baseColor.clone().multiplyScalar(0.8);
        default: return baseColor;
    }
}

window.BlockType = BlockType;
window.BlockData = BlockData;
window.getBlockColor = getBlockColor;
