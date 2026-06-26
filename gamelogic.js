// game-logic.js

function computeTotalRate() {
    return GROWTH_CONFIG.computeTotalRate(state);
}

function applyGrowth(deltaSeconds) {
    GROWTH_CONFIG.applyGrowth(state, deltaSeconds);
}


function getGeneratorPurchasePreview(index) {
    const u = state.generatorUpgrades[index];
    const mode = state.batchPurchaseUnlocked ? state.batchAmount : '1';
    const maxQuantity = u.getMaxQuantity();

    // 已满数量，下一次操作是“升级”
    if (u.quantity.gte(maxQuantity)) {
        return {
            action: 'upgrade',
            displayCost: null,
            canAfford: true,
            buyCount: 0,
        };
    }

    // 单买
    if (mode === '1') {
        const cost = u.getCost();
        return {
            action: 'buy',
            displayCost: cost,
            canAfford: state.points.gte(cost),
            buyCount: state.points.gte(cost) ? 1 : 0,
        };
    }

    // 批量 5 / 10
    if (mode === '5' || mode === '10') {
        const targetAmount = Number(mode);
        let tempQuantity = new Decimal(u.quantity);
        let totalCost = new Decimal('0');
        let buyCount = 0;

        for (let i = 0; i < targetAmount; i++) {
            if (tempQuantity.gte(maxQuantity)) break;

            const cost = u.config.costFn(tempQuantity, u.level);

            totalCost = totalCost.add(cost);
            tempQuantity = tempQuantity.add(1);
            buyCount++;
        }

        return {
            action: 'buy',
            displayCost: totalCost,
            // 必须能支付“本次批量实际总价”才可用
            canAfford: buyCount > 0 && state.points.gte(totalCost),
            buyCount,
        };
    }

    // 最大购买
    if (mode === 'max') {
        let tempQuantity = new Decimal(u.quantity);
        let tempPoints = new Decimal(state.points);
        let totalCost = new Decimal('0');
        let buyCount = 0;

        while (true) {
            const currentMaxQuantity = u.config.maxQuantityFn(u.level);
            if (tempQuantity.gte(currentMaxQuantity)) break;

            const cost = u.config.costFn(tempQuantity, u.level);
            if (tempPoints.lt(cost)) break;

            tempPoints = tempPoints.sub(cost);
            totalCost = totalCost.add(cost);
            tempQuantity = tempQuantity.add(1);
            buyCount++;
        }

        return {
            action: 'buy',
            displayCost: totalCost,
            canAfford: buyCount > 0,
            buyCount,
        };
    }

    return {
        action: 'buy',
        displayCost: u.getCost(),
        canAfford: state.points.gte(u.getCost()),
        buyCount: 0,
    };
}
function performSingleGenerator(index) {
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();

    if (u.quantity.gte(maxQuantity)) {
        u.level = u.level.add(new Decimal('1'));
        u.quantity = new Decimal('0');
        u.multiple = new Decimal('1');
        return 'upgrade';
    } else {
        const cost = u.getCost();
        if (state.points.lt(cost)) return 'insufficient';
        state.points = state.points.sub(cost);
        u.quantity = u.quantity.add(1);
        state.totalQuantityCount = state.totalQuantityCount.add(new Decimal('1'));
        return 'buy';
    }
}
function performMultiGenerator(index, amount) {
    let bought = 0;
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();

    for (let i = 0; i < amount; i++) {
        if (u.quantity.gte(maxQuantity)) break;
        const result = performSingleGenerator(index);
        if (result === 'buy') {
            bought++;
        } else {
            break;
        }
    }

    return bought > 0 ? 'buy' : 'insufficient';
}
function performMaxGenerator(index) {
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();
    let bought = 0;

    if (u.quantity.gte(maxQuantity)) {
        u.level = u.level.add(new Decimal('1'));
        u.quantity = new Decimal('0');
        u.multiple = new Decimal('1');
        return 'upgrade';
    }

    while (true) {
        const currentMaxQuantity = u.getMaxQuantity();
        if (u.quantity.gte(currentMaxQuantity)) break;

        const cost = u.getCost();
        if (state.points.lt(cost)) break;

        state.points = state.points.sub(cost);
        u.quantity = u.quantity.add(1);
        state.totalQuantityCount = state.totalQuantityCount.add(1);
        bought++;
    }

    return bought > 0 ? 'buy' : 'insufficient';
}
function performGenerator(index) {
    const mode = state.batchPurchaseUnlocked ? state.batchAmount : '1';

    if (mode === '1') return performSingleGenerator(index);
    if (mode === '5') return performMultiGenerator(index, 5);
    if (mode === '10') return performMultiGenerator(index, 10);
    if (mode === 'max') return performMaxGenerator(index);

    return 'insufficient';
}

function canPrestige() {
    return state.prestigeUnlocked && state.peakPointsForPrestige.gte(state.prestigePointsLimit);
}
function getPrestigePreview() {
    const peak = state.peakPointsForPrestige;
    return {
        newMult: PRESTIGE_CONFIG.multGainFn(peak),
        newExp: PRESTIGE_CONFIG.expGainFn(peak),
    };
}
function resetForPrestige() {
    state.points = new Decimal(GAME_CONFIG.startingPoints);
    state.peakPointsForPrestige = new Decimal('0');

    state.generatorUpgrades = GENERATOR_CONFIGS.map((config, index) => {
        const g = createGeneratorUpgrade(config, index);
        return g;
    });

    checkGeneratorUnlock();
}
function performPrestige() {
    if (!canPrestige()) return false;

    const peak = new Decimal(state.peakPointsForPrestige);
    const preview = getPrestigePreview();

    // 先记录下一次门槛
    state.prestigePointsLimit = peak;

    // 再更新声望加成
    state.prestigeMult = preview.newMult;
    state.prestigeExp = preview.newExp;

    // 最后重置
    resetForPrestige();

    renderAll();
    return true;
}

function checkAchievements() {
    let anyUnlocked = false;

    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        const a = ACHIEVEMENTS[i];
        if (!state.achievements[i] && a.check()) {
            state.achievements[i] = true;
            anyUnlocked = true;
            console.log(`成就解锁: ${a.name}`);
            if (typeof a.reward === 'function') {
                a.reward(state, a);
            }
        }
    }

    if (anyUnlocked) {
        renderAll();
    }

    return anyUnlocked;
}

function getStats() {
    let totalLevel = new Decimal('0');
    for (const u of state.generatorUpgrades) totalLevel = totalLevel.add(u.level);

    return {
        playtime: (Date.now() - state.gameStartTime) / 1000,
        clicks: state.totalClicks,
        generatorTotalLevel: totalLevel,
        peakPoints: state.peakPoints,
        pointsTotalEarned: state.totalPointsEarned,
        generatorQuantityCount: state.totalQuantityCount,
    };
}
