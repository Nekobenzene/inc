// config.js – 所有可调参数

// 成就配置
const ACHIEVEMENTS = [
    {
        id: 'first_step',
        name: '第一步',
        description: '购入发电机1',
        check: () => state.upgrades[0].quantity.gte(1),
        unlocked: false
    },
    {
        id: 'second',
        name: '二龙戏珠',
        description: '购入发电机2',
        check: () => state.upgrades[1].quantity.gte(1),
        unlocked: false
    },
    {
        id: 'levelup',
        name: '我重生了？',
        description: '升级发电机1',
        check: () => state.upgrades[0].level.gte(1),
        rewardDescription: '发电机1效率×2',
        reward: (state) => {
            state.achReward.ach3 = new Decimal(2)
        },
        unlocked: false
    },
    {
        id: 'million',
        name: '百万富翁',
        description: '累计获得 1,000,000 点 P',
        check: () => state.totalPointsEarned.gte(1e6),
        unlocked: false
    },
    {
        id: 'third',
        name: '三阳开泰',
        description: '购入发电机3',
        check: () => state.upgrades[2].quantity.gte(1),
        unlocked: false
    },
    {
        id: 'full_multiple',
        name: '没有更多了',
        description: '购入发电机4',
        check: () => state.upgrades[3].quantity.gte(1),
        rewardDescription: '发电机购入增长减缓(^0.9)',
        reward: (state) => {
            state.achReward.ach6 = new Decimal(0.9)
        },
        unlocked: false
    },
    {
        id: 'luckforever',
        name: '中式祝福',
        description: '达发电机共9级',
        check: () => {
            let s = new Decimal(0);
            for (const u of state.upgrades) s = s.add(u.level);
            return s.gte(9)
        },
        rewardDescription: '分数微弱加成分数生产(ln(P))',
        reward: (state) => {
            state.achReward.ach7 = new Decimal(1)
        },
        unlocked: false
    },
    {
        id: '2^128',
        name: '1/8双精度浮点数上限',
        description: '达到3.4e38 P',
        check: () => state.points.gte(new Decimal(2).pow(new Decimal(128))),
        rewardDescription: '解锁指数(1.1)',
        reward: (state) => {state.achReward.ach8 = new Decimal(1)},
        unlocked: false
    },
];

// ---------- 游戏全局参数 ----------
const GAME_CONFIG = {
    updateInterval: 0.1,
    maxDeltaTime: 0.1,
    startingPoints: 0,
    saveKey: 'incremental_save',
    autoSaveInterval: 30,      // 秒，0=不自动保存
};

// ---------- 导航配置 ----------
const NAV_PAGES = [
    { id: 'game', label: '游戏' },
    { id: 'achievements', label: '成就' },
    { id: 'stats', label: '统计' },
    { id: 'settings', label: '设置' },
];

// ---------- 升级配置 ----------
const UPGRADE_CONFIGS = [
    {
        costFn: (quantity, level) => new Decimal(10).mul(new Decimal(2).pow(quantity.add(new Decimal(level).mul(4)).mul(state.achReward.ach6))),
        maxQuantityFn: (level) => new Decimal(level).add(1).mul(10),
        rateFn: (quantity, level) => new Decimal(quantity).mul(new Decimal(5).pow(level)).mul(state.achReward.ach3),
        initial: { quantity: 0, level: 0, multiple: 1 }
    },
    {
        costFn: (quantity, level) => new Decimal(1000).mul(new Decimal(4).pow(quantity.add(new Decimal(level).mul(4)).mul(state.achReward.ach6))),
        maxQuantityFn: (level) => new Decimal(level).add(1).mul(15),
        rateFn: (quantity, level) => new Decimal(quantity).mul(new Decimal(1.1).pow(quantity)).mul(new Decimal(8).pow(level)),
        initial: { quantity: 0, level: 0, multiple: 1 }
    },
    {
        costFn: (quantity, level) => new Decimal(10000000).mul(new Decimal(8).pow(quantity.add(new Decimal(level).mul(4)).mul(state.achReward.ach6))),
        maxQuantityFn: (level) => new Decimal(level).add(1).mul(20),
        rateFn: (quantity, level) => new Decimal(quantity).mul(new Decimal(1.2).pow(quantity)).mul(new Decimal(15).pow(level)),
        initial: { quantity: 0, level: 0, multiple: 1 }
    },
    {
        costFn: (quantity, level) => new Decimal(1e13).mul(new Decimal(15).pow(quantity.add(new Decimal(level).mul(4)).mul(state.achReward.ach6))),
        maxQuantityFn: (level) => new Decimal(level).add(1).mul(30),
        rateFn: (quantity, level) => new Decimal(quantity).mul(new Decimal(1.5).pow(quantity)).mul(new Decimal(32).pow(level)),
        initial: { quantity: 0, level: 0, multiple: 1 }
    }
];
const COUNT = UPGRADE_CONFIGS.length;

// ---------- 增长计算配置 ----------
const GROWTH_CONFIG = {
    /**
     * 计算当前总速率（每秒点数增量）
     * @param {Object} state - 全局状态对象
     * @returns {Decimal} 总速率
     */
    computeTotalRate: (state) => {
        let r = new Decimal(1);
        for (const u of state.upgrades) {
            r = r.mul(u.multiple);
        }
        // 成就奖励 7：ln(P) 因子
        if (state.achReward.ach7.gt(0)) {
            r = r.mul(state.points.ln().pow(state.achReward.ach7));
        }
        // 指数
        r = r.pow(state.pointExp.pow(state.achReward.ach8))
        return r;
    },

    /**
     * 应用时间增量，更新点数和所有升级的 multiple
     * @param {Object} state - 全局状态对象
     * @param {number} deltaSeconds - 经过的秒数（浮点数）
     */
    applyGrowth: (state, deltaSeconds) => {
        if (deltaSeconds <= 0) return;

        // 1. 更新每个升级的 multiple
        for (const u of state.upgrades) {
            const increment = u.getRate().mul(deltaSeconds);
            u.multiple = u.multiple.add(increment);
            if (u.multiple.lt(0)) u.multiple = new Decimal(0);
        }

        // 2. 计算总速率并增加点数
        const rate = GROWTH_CONFIG.computeTotalRate(state);
        const gained = rate.mul(deltaSeconds);
        state.points = state.points.add(gained);
        state.totalPointsEarned = state.totalPointsEarned.add(gained);
        if (state.points.gt(state.peakPoints)) {
            state.peakPoints = new Decimal(state.points);
        }

        // 3. 检查升级解锁（根据点数阈值）
        checkUnlockAll();
    }
};

// ---------- 统计配置 ----------
const STATS_CONFIG = {
    fields: [
        { id: 'playtime', label: '游戏时间',  format: (value) => {
            const mins = Math.floor(value / 60);
            const secs = Math.floor(value % 60);
            return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        }},
        { id: 'clicks', label: '总点击数', format: (value) => formatDecimal(value) },
        { id: 'level', label: '总等级', format: (value) => formatDecimal(value) },
        { id: 'peak', label: '最高 P', format: (value) => formatDecimal(value) },
        { id: 'totalEarned', label: '累计获得 P', format: (value) => formatDecimal(value) },
        { id: 'quantityCount', label: '升级总次数', format: (value) => formatDecimal(value) },
    ]
};

// ---------- UI 文本配置 ----------
const UI_TEXTS = {
    game: {
        points: 'P = ',
        rate: 'dP/dt = ',
        formula: '公式：',
        formulaValue: 'Π(M)',
    },
    upgrades: {
        quantity: '数量：',
        maxQuantity: ' / ',
        level: '等级: ',
        effect: 'dM',
        effectSuffix: '/dt = ',
        buyLabel: '购入',
        upgradeLabel: '升级',
        cost: '花费: ',
        upgradeCost: '→ 等级 +1',
        namePrefix: '乘数',
        nameSuffix: '升级',
    },
    achievements: {
        title: '成就',
        unlocked: '已解锁',
        locked: '未解锁',
        counterFormat: '{unlocked} / {total}',
    },
    stats: {
        title: '统计',
    },
    settings: {
        title: '重置',
        save: '保存游戏',
        load: '读取存档',
        reset: '重置游戏',
        saveSuccess: '游戏已保存！',
        noSave: '没有找到存档',
        loadSuccess: '存档读取成功！',
        loadError: '存档损坏，无法读取',
        resetConfirm: '确定要重置所有进度吗？此操作不可撤销！',
    },
    nav: {
        version: 'v0.3.0',
        pointsBadge: 'P: ',
    }
};

// ---------- 性能配置 ----------
const PERFORMANCE_CONFIG = {
    enableCache: true,
    maxCacheSize: 1023,
    maxFPS: 60,
    targetFrameTime: 1000 / 60,
    batchUpdates: true,
    maxUpdatesPerFrame: 10,
    debounceUI: true,
    uiUpdateInterval: 0.05,
};

// ---------- 开发者模式配置 ----------
const DEVELOPER_PASSWORD = '';  // 修改为你想要的密码