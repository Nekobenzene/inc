// game-logic.js – 所有游戏规则和计算

// 计算总速率（所有乘数相乘）
function computeTotalRate() {
    return GROWTH_CONFIG.computeTotalRate(state);
}

// 计算增长
function applyGrowth(deltaSeconds) {
    GROWTH_CONFIG.applyGrowth(state, deltaSeconds);
}

// 执行购入（或升级）
// 1
function performSingleGenerator(index) {
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();

    if (u.quantity.gte(maxQuantity)) {
        u.level = u.level.add(1);
        u.quantity = new Decimal(0);
        u.multiple = new Decimal(1);
        return 'upgrade';
    } else {
        const cost = u.getCost();
        if (state.points.lt(cost)) return 'insufficient';
        state.points = state.points.sub(cost);
        u.quantity = u.quantity.add(1);
        state.totalQuantityCount = state.totalQuantityCount.add(1);
        return 'buy';
    }
}
// 5/10
function performMultiGenerator(index, amount) {
    let bought = 0;
    let upgraded = 0;
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();

    for (let i = 0; i < amount; i++) {
        if (u.quantity.gte(maxQuantity)) {break}
        const result = performSingleGenerator(index);
        if (result === 'buy') bought++;
        else break;
    }

    if (bought > 0 || upgraded > 0) {
        return upgraded > 0 ? 'upgrade' : 'buy';
    }
    return 'insufficient';
}
// max
function performMaxGenerator(index) {
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();
    let bought = 0;

    if (u.quantity.gte(maxQuantity)) {
        u.level = u.level.add(1);
        u.quantity = new Decimal(0);
        u.multiple = new Decimal(1);
        return 'upgrade';
    }

    while (true) {
        const maxQuantity = u.getMaxQuantity();
        if (u.quantity.gte(maxQuantity)) break;

        const cost = u.getCost();
        if (state.points.lt(cost)) break;

        state.points = state.points.sub(cost);
        u.quantity = u.quantity.add(1);
        state.totalQuantityCount = state.totalQuantityCount.add(1);
        bought++;
    }

    return bought > 0 ? 'buy' : 'insufficient';
}
// 执行
function performGenerator(index) {
    const u = state.generatorUpgrades[index];
    const mode = state.batchPurchaseUnlocked ? state.batchAmount : '1';

    if (mode === '1') {
        return performSingleGenerator(index);
    }
    if (mode === '5') {
        return performMultiGenerator(index, 5);
    }
    if (mode === '10') {
        return performMultiGenerator(index, 10);
    }
    if (mode === 'max') {
        return performMaxGenerator(index);
    }

    return 'insufficient';
}



// 检查成就
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
    renderAll();
    return anyUnlocked;
}

// 获取统计信息（供 UI 使用）
function getStats() {
    let totalLevel = new Decimal(0);
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
