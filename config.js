// config.js

const ACHIEVEMENTS = [
    {
        id: 'achievement_1',
        name: '第一步',
        description: '购入发电机1',
        check: () => state.generatorUpgrades[0].quantity.gte(new Decimal('1')),
    },
    {
        id: 'achievement_2',
        name: '二龙戏珠',
        description: '购入发电机2',
        check: () => state.generatorUpgrades[1].quantity.gte(new Decimal('1')),
    },
    {
        id: 'achievement_3',
        name: '我重生了?',
        description: '升级发电机1',
        check: () => state.generatorUpgrades[0].level.gte(new Decimal('1')),
        rewardDescription: '发电机1效率×2',
        reward: (state) => {
            state.achReward.ach3 = new Decimal('2');
        },
    },
    {
        id: 'achievement_4',
        name: '百万富翁',
        description: '累计获得 1,000,000 点 P',
        check: () => state.totalPointsEarned.gte(new Decimal('1e6')),
    },
    {
        id: 'achievement_5',
        name: '三阳开泰',
        description: '购入发电机3',
        check: () => state.generatorUpgrades[2].quantity.gte(new Decimal('1')),
    },
    {
        id: 'achievement_6',
        name: '没有更多了',
        description: '购入发电机4',
        rewardDescription: '发电机购入增长减缓(^0.9)',
        check: () => state.generatorUpgrades[3].quantity.gte(new Decimal('1')),
        reward: (state) => {
            state.achReward.ach6 = new Decimal('0.9');
        },
    },
    {
        id: 'achievement_7',
        name: '中式祝福',
        description: '达发电机共9级',
        check: () => {
            let s = new Decimal('0');
            for (const u of state.generatorUpgrades) s = s.add(u.level);
            return s.gte(new Decimal('9'));
        },
        rewardDescription: 'Pm乘以(log₂(P))(正加成生效)',
        reward: (state) => {
            state.achReward.ach7 = new Decimal('1');
        },
    },
    {
        id: 'achievement_8',
        name: '1/8双精度浮点数上限',
        description: '达到3.4e38 P',
        check: () => state.points.gte(new Decimal('2').pow(new Decimal('128'))),
        rewardDescription: 'Pe增加0.05',
        reward: (state) => {
            state.achReward.ach8 = new Decimal('0.05');
        },
    },
    {
        id: 'achievement_9',
        name: '1e45.14',
        description: '达到1.38e45 P',
        check: () => state.points.gte(new Decimal('10').pow(new Decimal('45.14'))),
        rewardDescription: '解锁挑战!',
        reward: (state) => {
            state.challengeUnlocked = true;
        },
    },
    {
        id: 'achievement_10',
        name: '有挑战性',
        description: '完成一个挑战',
        check: () => getCompletedChallengeCount(state) > 0,
        rewardDescription: '解锁批量购买',
        reward: (state) => {
            state.batchPurchaseUnlocked = true;
        },
    },
    {
        id: 'achievement_11',
        name: '现在是1/4',
        description: '达到1.2e77 P',
        check: () => state.points.gte(new Decimal('2').pow(new Decimal('256'))),
    },
    {
        id: 'achievement_12',
        name: '满分',
        description: '达到e100 P',
        check: () => state.points.gte(new Decimal('1e100')),
        rewardDescription: '成就8加成为^2.5更强',
        reward: (state)  => {
            state.achReward.ach12 = new Decimal('2.5')
        }
    },
    {
        id: 'achievement_13',
        name: '一半',
        description: '达到1.3e154 P',
        check: () => state.points.gte(new Decimal('2').pow(new Decimal('512'))),
        rewardDescription: '解锁声望!',
        reward: (state)  => {
            state.prestigeUnlocked = true;
        }
    },
    {
        id: 'achievement_14',
        name: '声望还是转生？',
        description: '执行一次声望',
        check: () => state.prestigePointsLimit.gt(new Decimal('2').pow(new Decimal('512'))),
    },
    {
        id: 'achievement_15',
        name: '无限',
        description: '执行一次归零',
        check: () => state.rebootCount.gte(new Decimal('1')),
    },
];

const GAME_CONFIG = {
    updateInterval: 0.1,
    maxDeltaTime: 0.1,
    startingPoints: 0,
    saveKey: 'incremental_save',
    autoSaveInterval: 30,
};

const NAV_PAGES = [
    { id: 'game', label: '生产' },
    { id: 'achievements', label: '成就' },
    { id: 'stats', label: '统计' },
    { id: 'settings', label: '设置' },
];

const GENERATOR_CONFIGS = [
    {
        costFn: (quantity, level) => {
            let costInc = new Decimal('2')
            if (state.isInChallenge === 2) {
                costInc = costInc.pow(new Decimal('1.5'))
            } else {
                costInc = costInc.pow(state.achReward.ach6);
            };
            const cost = new Decimal('10').mul(new Decimal(costInc).pow(quantity.add(new Decimal(level).mul(new Decimal('4'))))).pow(state.challengeReward.cha3)
            return cost
        },
        maxQuantityFn: (level) => new Decimal(level).add(new Decimal('1')).mul(new Decimal('10')),
        rateFn: (quantity, level) => {
            const base = new Decimal(quantity).mul(new Decimal('1.01').pow(quantity)).mul(new Decimal('5').pow(level)).mul(state.achReward.ach3);
            if (state.isInChallenge === 3) {
                return base.pow(new Decimal('0.3'));
            } else {
                return base.pow(state.challengeReward.cha4);
            }
        },
        initial: { quantity: new Decimal('0'), level: new Decimal('0'), multiple: new Decimal('1') }
    },
    {
        costFn: (quantity, level) => {
            let costInc = new Decimal('4')
            if (state.isInChallenge === 2) {
                costInc = costInc.pow(new Decimal('1.5'))
            } else {
                costInc = costInc.pow(state.achReward.ach6);
            };
            const cost = new Decimal('1000').mul(new Decimal(costInc).pow(quantity.add(new Decimal(level).mul(new Decimal('4'))))).pow(state.challengeReward.cha3)
            return cost
        },
        maxQuantityFn: (level) => new Decimal(level).add(new Decimal('1')).mul(new Decimal('15')),
        rateFn: (quantity, level) => {
            const base = new Decimal(quantity).mul(new Decimal('1.15').pow(quantity)).mul(new Decimal('8').pow(level)).mul(state.achReward.ach3);
            if (state.isInChallenge === 3) {
                return base.pow(new Decimal('0.3'));
            } else {
                return base.pow(state.challengeReward.cha4);
            }
        },
        initial: { quantity: new Decimal('0'), level: new Decimal('0'), multiple: new Decimal('1')}
    },
    {
        costFn: (quantity, level) => {
            let costInc = new Decimal('8')
            if (state.isInChallenge === 2) {
                costInc = costInc.pow(new Decimal('1.5'))
            } else {
                costInc = costInc.pow(state.achReward.ach6);
            };
            const cost = new Decimal('1e7').mul(new Decimal(costInc).pow(quantity.add(new Decimal(level).mul(new Decimal('4'))))).pow(state.challengeReward.cha3)
            return cost
        },
        maxQuantityFn: (level) => new Decimal(level).add(new Decimal('1')).mul(new Decimal('20')),
        rateFn: (quantity, level) => {
            const base = new Decimal(quantity).mul(new Decimal('1.28').pow(quantity)).mul(new Decimal('15').pow(level)).mul(state.achReward.ach3);
            if (state.isInChallenge === 3) {
                return base.pow(new Decimal('0.3'));
            } else {
                return base.pow(state.challengeReward.cha4);
            }
        },
        initial: { quantity: new Decimal('0'), level: new Decimal('0'), multiple: new Decimal('1')}
    },
    {
        costFn: (quantity, level) => {
            let costInc = new Decimal('15')
            if (state.isInChallenge === 2) {
                costInc = costInc.pow(new Decimal('1.5'))
            } else {
                costInc = costInc.pow(state.achReward.ach6);
            };
            const cost = new Decimal('1e13').mul(new Decimal(costInc).pow(quantity.add(new Decimal(level).mul(new Decimal('4'))))).pow(state.challengeReward.cha3)
            return cost
        },
        maxQuantityFn: (level) => new Decimal(level).add(new Decimal('1')).mul(new Decimal('30')),
        rateFn: (quantity, level) => {
            const base = new Decimal(quantity).mul(new Decimal('1.35').pow(quantity)).mul(new Decimal('25').pow(level)).mul(state.achReward.ach3);
            if (state.isInChallenge === 3) {
                return base.pow(new Decimal('0.3'));
            } else {
                return base.pow(state.challengeReward.cha4);
            }
        },
        initial: { quantity: new Decimal('0'), level: new Decimal('0'), multiple: new Decimal('1')}
    }
];

const COUNT = GENERATOR_CONFIGS.length;

const GROWTH_CONFIG = {
    computeTotalRate: (state) => {
        // 发电机
        let r = new Decimal('1');
        for (const u of state.generatorUpgrades) {
            r = r.mul(u.multiple);
        }
        // Pm
        if (state.points.gt(new Decimal('2'))) {
            state.pointMult = (state.points.log(new Decimal('2')).pow(state.achReward.ach12)).pow(state.achReward.ach7);
        } else {state.pointMult = new Decimal('1')}
        state.pointMult = state.pointMult.mul(state.prestigeMult)
        // Pe
        state.pointExp = state.achReward.ach8.add(state.challengeReward.cha2).add(new Decimal('1')).mul(state.prestigeExp)
        // 输出
        r = r.mul(state.pointMult);
        r = r.pow(state.pointExp);
        return r;
    },

    applyGrowth: (state, deltaSeconds) => {
        state.speed = state.challengeReward.cha1;
        let speed = state.speed;

        if (state.isInChallenge === 0) {
            speed = state.speed.mul(
                new Decimal('0.97').pow(
                    new Decimal(Date.now())
                        .sub(new Decimal(state.challengeStartTime))
                        .mul(new Decimal('0.001'))
                        .mul(state.developerSpeeduper)
                )
            );
        }

        if (deltaSeconds <= 0) return;

        for (const u of state.generatorUpgrades) {
            const increment = u.getRate().mul(deltaSeconds).mul(speed).mul(state.developerSpeeduper);
            u.multiple = u.multiple.add(increment);
            if (u.multiple.lt(new Decimal('0'))) u.multiple = new Decimal('0');
        }

        const rate = GROWTH_CONFIG.computeTotalRate(state);
        const gained = rate.mul(deltaSeconds).mul(speed).mul(state.developerSpeeduper);
        state.points = state.points.add(gained);
        state.totalPointsEarned = state.totalPointsEarned.add(gained);

        if (state.points.gt(state.peakPoints)) {
            state.peakPoints = new Decimal(state.points);
        }
        if (state.points.gt(state.peakPointsForPrestige)) {
            state.peakPointsForPrestige = new Decimal(state.points);
        }
        
        renderPrestigeButton();
        checkGeneratorUnlock();
    }
};

const CHALLENGES = [
    {
        id: 'challenge_1',
        name: '时间就是金钱',
        limitationDescription: '游戏速度每秒降低3%',
        target: '达到 1e8 P',
        reward: (state) => {
            state.challengeReward.cha1 = new Decimal('5');
        },
        rewardDescription: '游戏加速 ×5',
        check: (state) => state.points.gte(new Decimal('1e8'))
    },
    {
        id: 'challenge_2',
        name: '双人成行',
        limitationDescription: '后两个发电机被锁定',
        target: '达到2级发电机2',
        reward: (state) => {
            state.challengeReward.cha2 = state.challengeReward.cha2.add(new Decimal('0.05'));
            checkGeneratorUnlock();
        },
        rewardDescription: '指数提升0.05',
        check: (state) => state.generatorUpgrades[1].level.gte(new Decimal('2'))
    },
    {
        id: 'challenge_3',
        name: '通货膨胀',
        limitationDescription: '价格增长^1.5，成就6效果禁用',
        target: '拥有10级发电机1',
        reward: (state) => {
            state.challengeReward.cha3 = new Decimal('0.95');
        },
        rewardDescription: '所有发电机价格^0.95',
        check: (state) => state.generatorUpgrades[0].level.gte(new Decimal('10'))
    },
    {
        id: 'challenge_4',
        name: '极致压缩',
        limitationDescription: '发电机效率变为^0.3',
        target: '拥有2级发电机2',
        reward: (state) => {
            state.challengeReward.cha4 = new Decimal('1.1');
        },
        rewardDescription: '所有发电机效率^1.1',
        check: (state) => state.generatorUpgrades[1].level.gte(new Decimal('2'))
    },
];

const PRESTIGE_CONFIG = {
    baseRequirement: new Decimal('2').pow(new Decimal('512')),

    multGainFn: (peakPointsForPrestige) => {
        if (peakPointsForPrestige.lte(PRESTIGE_CONFIG.baseRequirement)) {
            return new Decimal('1');
        }

        const x = peakPointsForPrestige.log(new Decimal('2'));
        const y = x.div(new Decimal('256')).max(new Decimal('1'));

        return y.add(new Decimal('1')).pow(new Decimal('5'));
    },

    expGainFn: (peakPointsForPrestige) => {
        if (peakPointsForPrestige.lte(PRESTIGE_CONFIG.baseRequirement)) {
            return new Decimal('1');
        }

        const x = peakPointsForPrestige.log(new Decimal('10'));
        const y = x.div(new Decimal('100')).max(new Decimal('1'));

        return y.log(new Decimal('1000')).add(new Decimal('1')).log(new Decimal('1000')).add(new Decimal('1')).pow(new Decimal('3'));
    }
};

const NOTIFICATIONS = [
    // 成就完成
    {
        id: 'notify_achievement1',
        title: '里程碑达成',
        message: '购入第一个发电机',
        type: 'milestone',
        duration: 1.5,
        once: true,
        condition: (state) => state.achievements[0],
    },
    {
        id: 'notify_achievement2',
        title: '里程碑达成',
        message: '购入发电机2',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[1],
    },
    {
        id: 'notify_achievement3',
        title: '里程碑达成',
        message: '升级第一个发电机',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[2],
    },
    {
        id: 'notify_achievement4',
        title: '里程碑达成',
        message: '拥有1e6 P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[3],
    },
    {
        id: 'notify_achievement5',
        title: '里程碑达成',
        message: '购入发电机3',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[4],
    },
    {
        id: 'notify_achievement6',
        title: '里程碑达成',
        message: '购入发电机4',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[5],
    },
    {
        id: 'notify_achievement7',
        title: '里程碑达成',
        message: '所有发电机等级之和达到9',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[6],
    },
    {
        id: 'notify_achievement8',
        title: '里程碑达成',
        message: '拥有2^128(3.4e38) P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[7],
    },
    {
        id: 'notify_achievement9',
        title: '里程碑达成',
        message: '拥有1e45.14(1.38e45) P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[8],
    },
    {
        id: 'notify_achievement10',
        title: '里程碑达成',
        message: '完成一个挑战',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[9],
    },
    {
        id: 'notify_achievement11',
        title: '里程碑达成',
        message: '拥有2^256(1.2e77) P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[10],
    },
    {
        id: 'notify_achievement12',
        title: '里程碑达成',
        message: '拥有1e100 P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[11],
    },
    {
        id: 'notify_achievement13',
        title: '里程碑达成',
        message: '拥有2^512(1.3e154) P',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[12],
    },
    {
        id: 'notify_achievement14',
        title: '里程碑达成',
        message: '执行了一次声望',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[13],
    },
    {
        id: 'notify_achievement15',
        title: '里程碑达成',
        message: '拥有2^1024(1.79e308 P)并执行一次归零',
        type: 'milestone',
        duration: 2,
        once: true,
        condition: (state) => state.achievements[14],
    },
    // 挑战奖励
    {
        id: 'notify_challenge1',
        title: '挑战成功',
        message: '游戏速度×5',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.challengeReward.cha1.eq(new Decimal('5')),
    },
    {
        id: 'notify_challenge2',
        title: '挑战成功',
        message: 'Pe提升0.05',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.challengeReward.cha2.eq(new Decimal('0.05')),
    },
    {
        id: 'notify_challenge3',
        title: '挑战成功',
        message: '发电机价格增速＾0.95',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.challengeReward.cha3.eq(new Decimal('0.95')),
    },
    {
        id: 'notify_challenge4',
        title: '挑战成功',
        message: '发电机效率＾1.1',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.challengeReward.cha4.eq(new Decimal('1.1')),
    },
    // 成就奖励
    {
        id: 'notify_achreward3',
        title: '获得奖励',
        message: '发电机1效率翻倍',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.achReward.ach3.eq(new Decimal('2')),
    },
    {
        id: 'notify_achreward6',
        title: '获得奖励',
        message: '所有发电机价格增长^0.9',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.achReward.ach6.eq(new Decimal('0.9')),
    },
    {
        id: 'notify_achreward7',
        title: '获得奖励',
        message: '以log₂P加成Pm（仅正加成时生效）',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.achReward.ach7.eq(new Decimal('1')),
    },
    {
        id: 'notify_achreward8',
        title: '获得奖励',
        message: '指数增加0.05',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.achReward.ach8.eq(new Decimal('1')),
    },
    {
        id: 'notify_achreward12',
        title: '获得奖励',
        message: '成就7的加成^2.5更强',
        type: 'reward',
        duration: 2,
        once: true,
        condition: (state) => state.achReward.ach12.eq(new Decimal('2.5')),
    },
    // 内容解锁
    {
        id: 'notify_first_generator_unlock',
        title: '新内容解锁',
        message: '你可以购买乘数发电机1了',
        type: 'unlock',
        duration: 1.5,
        once: true,
        condition: (state) => state.generatorUpgrades[0].unlocked,
    },
    {
        id: 'notify_generator2_unlock',
        title: '新内容解锁',
        message: '你可以购买乘数发电机2了',
        type: 'unlock',
        duration: 1.5,
        once: true,
        condition: (state) => state.generatorUpgrades[1].unlocked,
    },
    {
        id: 'notify_generator3_unlock',
        title: '新内容解锁',
        message: '你可以购买乘数发电机3了',
        type: 'unlock',
        duration: 1.5,
        once: true,
        condition: (state) => state.generatorUpgrades[2].unlocked,
    },
    {
        id: 'notify_generator4_unlock',
        title: '新内容解锁',
        message: '你可以购买乘数发电机4了',
        type: 'unlock',
        duration: 1.5,
        once: true,
        condition: (state) => state.generatorUpgrades[3].unlocked,
    },
    {
        id: 'notify_challenge_unlock',
        title: '解锁功能',
        message: '解锁挑战！',
        type: 'unlock',
        duration: 2,
        once: true,
        condition: (state) => state.challengeUnlocked,
    },
    {
        id: 'notify_batchPurchase_unlock',
        title: '解锁功能',
        message: '解锁批量购买！',
        type: 'unlock',
        duration: 2,
        once: true,
        condition: (state) => state.batchPurchaseUnlocked,
    },
    {
        id: 'notify_prestige_unlock',
        title: '解锁功能',
        message: '解锁声望功能！',
        type: 'unlock',
        duration: 2,
        once: true,
        condition: (state) => state.prestigeUnlocked,
    },

    ];

const STATS_CONFIG = {
    fields: [
        {
            id: 'playtime',
            label: '游戏时间',
            format: (value) => {
                const mins = Math.floor(value / 60);
                const secs = Math.floor(value % 60);
                return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            }
        },
        { id: 'clicks', label: '总点击数', format: (value) => formatDecimal(value) },
        { id: 'generatorTotalLevel', label: '总等级', format: (value) => formatDecimal(value) },
        { id: 'peakPoints', label: '最高 P', format: (value) => formatDecimal(value) },
        { id: 'pointsTotalEarned', label: '累计获得 P', format: (value) => formatDecimal(value) },
        { id: 'generatorQuantityCount', label: '升级总次数', format: (value) => formatDecimal(value) },
    ]
};

const UI_TEXTS = {
    game: {
        points: 'P = ',
        rate: 'dP/dt = ',
        formula: '公式:',
        formulaValue: 'Π(M)',
    },
    generatorUpgrades: {
        quantity: '数量:',
        maxQuantity: ' / ',
        level: '等级: ',
        effect: 'dM',
        effectSuffix: '/dt = ',
        buyLabel: '购入',
        upgradeLabel: '升级',
        cost: '花费: ',
        upgradeCost: '重置M和发电机数量',
        namePrefix: '乘数发电机',
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
        refresh: '刷新界面',
        title: '重置',
        save: '保存游戏',
        load: '读取存档',
        reset: '重置游戏',
        saveSuccess: '游戏已保存!',
        noSave: '没有找到存档',
        loadSuccess: '存档读取成功!',
        loadError: '存档损坏,无法读取',
        resetConfirm: '确定要重置所有进度吗?此操作不可撤销!',
    },
    nav: {
        version: 'v0.3.0',
        pointsBadge: 'P: ',
    }
};

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

const INFINITY_CONFIG = {
    requirement: new Decimal('2').pow(new Decimal('1024')),
    themeColor: '#00FFFF',
    flashDuration: 1000,
    garbleInterval: 120,
};

const DEVELOPER_PASSWORD = '';
