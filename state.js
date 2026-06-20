// state.js – 管理所有可变状态，并提供序列化/反序列化

// 状态对象（全局）
const state = {
    points: new Decimal(GAME_CONFIG.startingPoints),
    totalPointsEarned: new Decimal(GAME_CONFIG.startingPoints),
    totalClicks: new Decimal(0),
    peakPoints: new Decimal(GAME_CONFIG.startingPoints),
    totalQuantityCount: new Decimal(0),
    gameStartTime: Date.now(),
    upgrades: [],
    achievements: [], // 每个成就的解锁状态（布尔值）
    achReward: {
        ach3: new Decimal(1),
        ach6: new Decimal(1),
        ach7: new Decimal(0),
        ach8: new Decimal(0),
    },
    pointExp: new Decimal(1.1),
};

// 检查所有发电机数量是否达到解锁阈值
function checkUnlockAll() {
    for (const u of state.upgrades) {
        if (!u.unlocked && state.points.gte(u.unlockThreshold)) {
            u.unlocked = true;
        }
    }
}

// 初始化升级（根据 GENERATOR_CONFIGS）和成就状态
function initState() {
    // 初始化升级
    state.upgrades = GENERATOR_CONFIGS.map((config, index) => ({
        id: index,
        quantity: new Decimal(config.initial.quantity),
        level: new Decimal(config.initial.level),
        multiple: new Decimal(config.initial.multiple),
        config: config,
        unlocked: false,
        unlockThreshold: config.costFn(new Decimal(0), new Decimal(0)).div(10),
        getCost() {
            return this.config.costFn(this.quantity, this.level);
        },
        getMaxQuantity() {
            return this.config.maxQuantityFn(this.level);
        },
        getRate() {
            return this.config.rateFn(this.quantity, this.level);
        },
        isMaxed() {
            return this.quantity.gte(this.getMaxQuantity());
        }
    }));
    checkUnlockAll();
    
    // 初始化成就状态（全部未解锁）
    state.achievements = ACHIEVEMENTS.map(() => false);
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        ACHIEVEMENTS[i].unlocked = state.achievements[i];
    }
    
    // 重置成就奖励为默认值
    state.achReward = {
        ach3: new Decimal(1),
        ach6: new Decimal(1),
        ach7: new Decimal(0),
        ach8: new Decimal(0),
    };
}

// 序列化
function serializeState() {
    function serializeValue(value) {
        if (value instanceof Decimal) {
            return value.toString();
        }
        if (Array.isArray(value)) {
            return value.map(item => serializeValue(item));
        }
        if (value && typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = serializeValue(val);
            }
            return result;
        }
        return value;
    }
    
    const stateToSerialize = {
        points: state.points,
        totalPointsEarned: state.totalPointsEarned,
        totalClicks: state.totalClicks,
        peakPoints: state.peakPoints,
        totalQuantityCount: state.totalQuantityCount,
        gameStartTime: state.gameStartTime,
        upgrades: state.upgrades.map(u => ({
            quantity: u.quantity,
            level: u.level,
            multiple: u.multiple,
            unlocked: u.unlocked
        })),
        achievements: state.achievements,
        achReward: state.achReward,
        pointExp: state.pointExp,
    };
    
    return serializeValue(stateToSerialize);
}

// 反序列化
function deserializeState(data) {
    function deserializeValue(value) {
        if (Array.isArray(value)) {
            return value.map(item => deserializeValue(item));
        }
        if (value && typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = deserializeValue(val);
            }
            return result;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (/^-?\d*\.?\d+(e[+-]?\d+)?$/i.test(trimmed)) {
                try {
                    return new Decimal(trimmed);
                } catch {
                    return value;
                }
            }
            return value;
        }
        return value;
    }
    
    const deserialized = deserializeValue(data);
    
    // 基本数值字段
    state.points = deserialized.points instanceof Decimal ? deserialized.points : new Decimal(deserialized.points || 0);
    state.totalPointsEarned = deserialized.totalPointsEarned instanceof Decimal ? deserialized.totalPointsEarned : new Decimal(deserialized.totalPointsEarned || 0);
    state.totalClicks = deserialized.totalClicks instanceof Decimal ? deserialized.totalClicks : new Decimal(deserialized.totalClicks || 0);
    state.peakPoints = deserialized.peakPoints instanceof Decimal ? deserialized.peakPoints : new Decimal(deserialized.peakPoints || 0);
    state.totalQuantityCount = deserialized.totalQuantityCount instanceof Decimal ? deserialized.totalQuantityCount : new Decimal(deserialized.totalQuantityCount || 0);
    state.gameStartTime = deserialized.gameStartTime || Date.now();
    state.pointExp = deserialized.pointExp instanceof Decimal ? deserialized.pointExp : new Decimal(deserialized.pointExp || 1.1);

    
    // 还原升级
    if (deserialized.upgrades && Array.isArray(deserialized.upgrades)) {
        for (let i = 0; i < state.upgrades.length && i < deserialized.upgrades.length; i++) {
            const u = deserialized.upgrades[i];
            state.upgrades[i].quantity = u.quantity instanceof Decimal ? u.quantity : new Decimal(u.quantity || 0);
            state.upgrades[i].level = u.level instanceof Decimal ? u.level : new Decimal(u.level || 0);
            state.upgrades[i].multiple = u.multiple instanceof Decimal ? u.multiple : new Decimal(u.multiple || 1);
            state.upgrades[i].unlocked = !!u.unlocked;
        }
    }
    
    // 还原成就状态
    if (deserialized.achievements && Array.isArray(deserialized.achievements)) {
        const loaded = deserialized.achievements.map(v => !!v);
        while (loaded.length < ACHIEVEMENTS.length) loaded.push(false);
        state.achievements = loaded.slice(0, ACHIEVEMENTS.length);
    } else {
        state.achievements = ACHIEVEMENTS.map(() => false);
    }
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        ACHIEVEMENTS[i].unlocked = state.achievements[i];
    }
    
    // 还原成就奖励
    if (deserialized.achReward && typeof deserialized.achReward === 'object') {
        // 强制转换为 Decimal，防止数字类型
        const rawAch3 = deserialized.achReward.ach3;
        const rawAch6 = deserialized.achReward.ach6;
        const rawAch7 = deserialized.achReward.ach7;
        const rawAch8 = deserialized.achReward.ach8;
        state.achReward = {
            ach3: rawAch3 instanceof Decimal ? rawAch3 : new Decimal(rawAch3 || 1),
            ach6: rawAch6 instanceof Decimal ? rawAch6 : new Decimal(rawAch6 || 1),
            ach7: rawAch7 instanceof Decimal ? rawAch7 : new Decimal(rawAch7 || 0),
            ach8: rawAch8 instanceof Decimal ? rawAch8 : new Decimal(rawAch8 || 0),
        };
    } else {
        state.achReward = {
            ach3: new Decimal(1),
            ach6: new Decimal(1),
            ach7: new Decimal(0),
            ach8: new Decimal(0),
        };
    }
// 重新检查解锁阈值（可能因为升级数量变化）
    checkUnlockAll();
}

// 保存到 localStorage
function saveGame() {
    const data = serializeState();
    localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(data));
}

// 从 localStorage 加载
function loadGame() {
    const raw = localStorage.getItem(GAME_CONFIG.saveKey);
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        deserializeState(data);
        return true;
    } catch (e) {
        console.error('Load error:', e);
        return false;
    }
}

// 重置游戏
function resetGame() {
    localStorage.removeItem(GAME_CONFIG.saveKey);
    // 重置所有状态
    state.points = new Decimal(GAME_CONFIG.startingPoints);
    state.totalPointsEarned = new Decimal(GAME_CONFIG.startingPoints);
    state.totalClicks = new Decimal(0);
    state.peakPoints = new Decimal(GAME_CONFIG.startingPoints);
    state.totalQuantityCount = new Decimal(0);
    state.gameStartTime = Date.now();
    // 重新初始化升级和成就
    initState();
    // 确保成就全未解锁
    for (const a of ACHIEVEMENTS) a.unlocked = false;
    for (let i = 0; i < state.achievements.length; i++) state.achievements[i] = false;
    state.achReward = {
        ach3: new Decimal(1),
        ach6: new Decimal(1),
        ach7: new Decimal(0),
        ach8: new Decimal(0),
    };
}

// 初始化 state（在加载存档前调用，或在重置后调用）
initState();