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
function performGenerator(index) {
    const u = state.generatorUpgrades[index];
    const maxQuantity = u.getMaxQuantity();
    if (u.quantity.gte(maxQuantity)) {
        // 升级
        u.level = u.level.add(1);
        u.quantity = new Decimal(0);
        u.multiple = new Decimal(1);
        state.totalClicks = state.totalClicks.add(1);
        return 'upgrade';
    } else {
        const cost = u.getCost();
        if (state.points.lt(cost)) return 'insufficient';
        state.points = state.points.sub(cost);
        u.quantity = u.quantity.add(1);
        state.totalQuantityCount = state.totalQuantityCount.add(1);
        state.totalClicks = state.totalClicks.add(1);
        return 'buy';
    }
}

// 检查成就（更新 unlocked 状态）
function checkAchievements() {
    let anyUnlocked = false;
    for (const a of ACHIEVEMENTS) {
        if (!a.unlocked && a.check()) {
            a.unlocked = true;
            anyUnlocked = true;
            console.log(`成就解锁: ${a.icon} ${a.name}`);
            if (typeof a.reward === 'function') {
                a.reward(state, a);
            }
        }
    }
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