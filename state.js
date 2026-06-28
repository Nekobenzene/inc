const state = {
    speed: new Decimal('1'),
    developerSpeeduper: new Decimal('1'),
    points: new Decimal(GAME_CONFIG.startingPoints),
    totalPointsEarned: new Decimal(GAME_CONFIG.startingPoints),
    totalClicks: new Decimal('0'),
    peakPoints: new Decimal(GAME_CONFIG.startingPoints),
    totalQuantityCount: new Decimal('0'),
    gameStartTime: Date.now(),

    generatorUpgrades: [],
    generatorUnlocked: [],

    achievements: [],
    achReward: {
        ach3: new Decimal('1'),
        ach6: new Decimal('1'),
        ach7: new Decimal('0'),
        ach8: new Decimal('0'),
        ach12: new Decimal('1'),
    },

    pointExp: new Decimal('1'),
    pointMult: new Decimal('1'),

    challengeUnlocked: false,
    challengeReward: {
        cha1: new Decimal('1'),
        cha2: new Decimal('0'),
        cha3: new Decimal('1'),
        cha4: new Decimal('1'),
    },
    challengeSpendTime: [],
    isInChallenge: -1,
    challengeStartTime: 0,

    batchPurchaseUnlocked: false,
    batchAmount: '1',
    
    prestigeUnlocked: false,
    peakPointsForPrestige: new Decimal('0'),
    prestigePointsLimit: new Decimal('2').pow(new Decimal('512')),
    prestigeMult: new Decimal('1'),
    prestigeExp: new Decimal('1'),
    
    notificationHistory: {},
    notificationQueue: [],
    
    isFirstInfinity: true,
    currentInfinityIsFirst: false,
    isInfinityReached: false,
    isInfinityBroken: false,
    isInfinityResetting: false,
    rebootCount: new Decimal('0'),
    
    axioms: new Decimal('0')
};

function getAchievementCount(state) {
    return state.achievements.filter(v => v === true).length;
}

function getCompletedChallengeCount(state) {
    return state.challengeSpendTime.filter(t => t.gt(-1)).length;
}

function createGeneratorUpgrade(config, index) {
    return {
        id: index,
        quantity: new Decimal(config.initial.quantity),
        level: new Decimal(config.initial.level),
        multiple: new Decimal(config.initial.multiple),
        config: config,
        unlocked: false,
        unlockThreshold: config.costFn(new Decimal('0'), new Decimal('0')).div(new Decimal('10')),
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
    };
}

function checkGeneratorUnlock() {
    for (let i = 0; i < state.generatorUpgrades.length; i++) {
        const u = state.generatorUpgrades[i];

        if (!Array.isArray(state.generatorUnlocked)) {
            state.generatorUnlocked = GENERATOR_CONFIGS.map(() => false);
        }
        if (state.generatorUnlocked.length < GENERATOR_CONFIGS.length) {
            while (state.generatorUnlocked.length < GENERATOR_CONFIGS.length) {
                state.generatorUnlocked.push(false);
            }
        }

        if (state.points.gte(u.unlockThreshold)) {
            state.generatorUnlocked[i] = true;
        }

        // challenge_2 的索引是 1:后两个发电机临时锁定
        if (state.isInChallenge === 1 && i >= 2) {
            u.unlocked = false;
        } else {
            u.unlocked = !!state.generatorUnlocked[i];
        }
    }
}

function initState() {
    state.speed = new Decimal('1');
    state.developerSpeeduper = new Decimal('1');
    state.points = new Decimal(GAME_CONFIG.startingPoints);
    state.totalPointsEarned = new Decimal(GAME_CONFIG.startingPoints);
    state.totalClicks = new Decimal('0');
    state.peakPoints = new Decimal(GAME_CONFIG.startingPoints);
    state.totalQuantityCount = new Decimal('0');
    state.gameStartTime = Date.now();

    state.generatorUpgrades = GENERATOR_CONFIGS.map((config, index) => createGeneratorUpgrade(config, index));
    state.generatorUnlocked = GENERATOR_CONFIGS.map(() => false);

    state.achievements = ACHIEVEMENTS.map(() => false);
    state.achReward = {
        ach3: new Decimal('1'),
        ach6: new Decimal('1'),
        ach7: new Decimal('0'),
        ach8: new Decimal('0'),
        ach12: new Decimal('1'),
    };

    state.pointExp = new Decimal('1');
    state.pointMult = new Decimal('1');

    state.challengeUnlocked = false;
    state.challengeReward = {
        cha1: new Decimal('1'),
        cha2: new Decimal('0'),
        cha3: new Decimal('1'),
        cha4: new Decimal('1'),
    };
    state.challengeSpendTime = CHALLENGES.map(() => new Decimal('-1'));
    state.isInChallenge = -1;
    state.challengeStartTime = 0;

    state.batchPurchaseUnlocked = false;
    state.batchAmount = '1';
    
    state.prestigeUnlocked = false;
    state.peakPointsForPrestige = new Decimal('0');
    state.prestigePointsLimit = new Decimal('2').pow(new Decimal('512'));
    state.prestigeMult = new Decimal('1');
    state.prestigeExp = new Decimal('1');

    state.notificationHistory = {};
    state.notificationQueue = [];

    state.isFirstInfinity = true;
    state.currentInfinityIsFirst = false;
    state.isInfinityReached = false;
    state.isInfinityBroken = false;
    state.isInfinityResetting = false;
    state.rebootCount = new Decimal('0');

    state.axioms = new Decimal('0')

    checkGeneratorUnlock();
}

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
        speed: state.speed,
        developerSpeeduper: state.developerSpeeduper,
        points: state.points,
        totalPointsEarned: state.totalPointsEarned,
        totalClicks: state.totalClicks,
        peakPoints: state.peakPoints,
        totalQuantityCount: state.totalQuantityCount,
        gameStartTime: state.gameStartTime,

        generatorUnlocked: state.generatorUnlocked,
        generatorUpgrades: state.generatorUpgrades.map(u => ({
            quantity: u.quantity,
            level: u.level,
            multiple: u.multiple,
            unlocked: u.unlocked
        })),

        achievements: state.achievements,
        achReward: state.achReward,
        
        pointExp: state.pointExp,
        pointMult: state.pointMult,

        challengeUnlocked: state.challengeUnlocked,
        challengeReward: state.challengeReward,
        challengeSpendTime: state.challengeSpendTime,
        isInChallenge: state.isInChallenge,
        challengeStartTime: state.challengeStartTime,

        batchPurchaseUnlocked: state.batchPurchaseUnlocked,
        batchAmount: state.batchAmount,
        
        prestigeUnlocked: state.prestigeUnlocked,
        peakPointsForPrestige: state.peakPointsForPrestige,
        prestigePointsLimit: state.prestigePointsLimit,
        prestigeMult: state.prestigeMult,
        prestigeExp: state.prestigeExp,
        
        notificationHistory: state.notificationHistory,
        
        isFirstInfinity: state.isFirstInfinity,
        currentInfinityIsFirst: state.currentInfinityIsFirst,
        isInfinityReached: state.isInfinityReached,
        isInfinityBroken: state.isInfinityBroken,
        isInfinityResetting: state.isInfinityResetting,
        rebootCount: state.rebootCount,
        
        axioms: state.axioms
    };

    return serializeValue(stateToSerialize);
}

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

    function toDecimal(value, fallback = 0) {
        if (value instanceof Decimal) return value;
        if (value === undefined || value === null || value === '') return new Decimal(fallback);
        try {
            return new Decimal(value);
        } catch {
            return new Decimal(fallback);
        }
    }

    const deserialized = deserializeValue(data);

    state.generatorUpgrades = GENERATOR_CONFIGS.map((config, index) => createGeneratorUpgrade(config, index));

    state.speed = toDecimal(deserialized.speed, 1);
    state.developerSpeeduper = toDecimal(deserialized.developerSpeeduper, 1);
    state.points = toDecimal(deserialized.points, 0);
    state.totalPointsEarned = toDecimal(deserialized.totalPointsEarned, 0);
    state.totalClicks = toDecimal(deserialized.totalClicks, 0);
    state.peakPoints = toDecimal(deserialized.peakPoints, 0);
    state.totalQuantityCount = toDecimal(deserialized.totalQuantityCount, 0);
    state.gameStartTime = deserialized.gameStartTime || Date.now();
    state.pointExp = toDecimal(deserialized.pointExp, 1);
    state.pointMult = toDecimal(deserialized.pointMult, 1);

    if (Array.isArray(deserialized.generatorUnlocked)) {
        state.generatorUnlocked = deserialized.generatorUnlocked.map(v => !!v);
        while (state.generatorUnlocked.length < GENERATOR_CONFIGS.length) {
            state.generatorUnlocked.push(false);
        }
        state.generatorUnlocked = state.generatorUnlocked.slice(0, GENERATOR_CONFIGS.length);
    } else {
        state.generatorUnlocked = GENERATOR_CONFIGS.map(() => false);
    }

    if (Array.isArray(deserialized.generatorUpgrades)) {
        for (let i = 0; i < state.generatorUpgrades.length && i < deserialized.generatorUpgrades.length; i++) {
            const u = deserialized.generatorUpgrades[i] || {};
            state.generatorUpgrades[i].quantity = toDecimal(u.quantity, 0);
            state.generatorUpgrades[i].level = toDecimal(u.level, 0);
            state.generatorUpgrades[i].multiple = toDecimal(u.multiple, 1);
            state.generatorUpgrades[i].unlocked = !!u.unlocked;

            if (state.generatorUpgrades[i].unlocked) {
                state.generatorUnlocked[i] = true;
            }
        }
    }

    if (Array.isArray(deserialized.achievements)) {
        const loaded = deserialized.achievements.map(v => !!v);
        while (loaded.length < ACHIEVEMENTS.length) loaded.push(false);
        state.achievements = loaded.slice(0, ACHIEVEMENTS.length);
    } else {
        state.achievements = ACHIEVEMENTS.map(() => false);
    }

    if (deserialized.achReward && typeof deserialized.achReward === 'object') {
        state.achReward = {
            ach3: toDecimal(deserialized.achReward.ach3, 1),
            ach6: toDecimal(deserialized.achReward.ach6, 1),
            ach7: toDecimal(deserialized.achReward.ach7, 0),
            ach8: toDecimal(deserialized.achReward.ach8, 0),
            ach12: toDecimal(deserialized.achReward.ach12, 1),
        };
    } else {
        state.achReward = {
            ach3: new Decimal(1),
            ach6: new Decimal(1),
            ach7: new Decimal(0),
            ach8: new Decimal(0),
            ach12: new Decimal(1),
        };
    }

    if (deserialized.challengeReward && typeof deserialized.challengeReward === 'object') {
        state.challengeReward = {
            cha1: toDecimal(deserialized.challengeReward.cha1, 1),
            cha2: toDecimal(deserialized.challengeReward.cha2, 0),
            cha3: toDecimal(deserialized.challengeReward.cha3, 1),
            cha4: toDecimal(deserialized.challengeReward.cha4, 1),
        };
    } else {
        state.challengeReward = {
            cha1: new Decimal(1),
            cha2: new Decimal(0),
            cha3: new Decimal(1),
            cha4: new Decimal(1),
        };
    }

    if (typeof deserialized.challengeUnlocked === 'boolean') {
        state.challengeUnlocked = deserialized.challengeUnlocked;
    } else {
        const achIndex = ACHIEVEMENTS.findIndex(a => a.id === 'achievement_9');
        state.challengeUnlocked = achIndex !== -1 && !!state.achievements[achIndex];
    }

    state.challengeSpendTime = (deserialized.challengeSpendTime || []).map(v => {
        if (v instanceof Decimal) return v;
        if (v === -1 || v === '-1') return new Decimal(-1);
        return toDecimal(v, -1);
    });
    while (state.challengeSpendTime.length < CHALLENGES.length) {
        state.challengeSpendTime.push(new Decimal(-1));
    }
    state.challengeSpendTime = state.challengeSpendTime.slice(0, CHALLENGES.length);

    state.isInChallenge = deserialized.isInChallenge ?? -1;
    state.challengeStartTime = deserialized.challengeStartTime || 0;

    state.batchPurchaseUnlocked = !!deserialized.batchPurchaseUnlocked;
    state.batchAmount = ['1', '5', '10', 'max'].includes(deserialized.batchAmount)
        ? deserialized.batchAmount
        : '1';

    state.prestigeUnlocked = !!deserialized.prestigeUnlocked;
    state.peakPointsForPrestige = toDecimal(deserialized.peakPointsForPrestige, 0);
    state.prestigePointsLimit = deserialized.prestigePointsLimit
        ? toDecimal(deserialized.prestigePointsLimit)
        : new Decimal(2).pow(512);
    state.prestigeMult = toDecimal(deserialized.prestigeMult, 1);
    state.prestigeExp = toDecimal(deserialized.prestigeExp, 1);

    state.notificationHistory = deserialized.notificationHistory || {};
    state.notificationQueue = [];

    state.isFirstInfinity = deserialized.isFirstInfinity !== undefined ? !!deserialized.isFirstInfinity : true;
    state.currentInfinityIsFirst = !!deserialized.currentInfinityIsFirst;
    state.isInfinityReached = !!deserialized.isInfinityReached;
    state.isInfinityBroken = !!deserialized.isInfinityBroken;
    state.isInfinityResetting = !!deserialized.isInfinityResetting;
    state.rebootCount = toDecimal(deserialized.rebootCount, 0);

    if (state.isInfinityReached) {
        state.points = new Decimal(Decimal.dInf);
    }

    state.axioms = toDecimal(deserialized.axioms, 0);

    checkGeneratorUnlock();
}

function saveGame() {
    const data = serializeState();
    localStorage.setItem(GAME_CONFIG.saveKey, JSON.stringify(data));
}

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

function resetGame() {
    localStorage.removeItem(GAME_CONFIG.saveKey);
    initState();
}

function resetForChallenge() {
    state.points = new Decimal(GAME_CONFIG.startingPoints);
    state.totalQuantityCount = new Decimal('0');

    state.generatorUpgrades = GENERATOR_CONFIGS.map((config, index) => createGeneratorUpgrade(config, index));

    checkGeneratorUnlock();
}
