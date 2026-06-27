// game-logic.js

let infinityTextTimer = null;
let infinityFlashTimer = null;
let infinityGarbleState = false;

let infinityUpdateTimer = null;   // 用于 10ms 更新乱码
let infinitySwitchTimer = null;   // 用于切换模式(归零/乱码)
let isGarbleMode = false;         // 当前是否处于乱码显示状态
let currentGarbleLength = 2;      // 当前乱码长度

function computeTotalRate() {
    return GROWTH_CONFIG.computeTotalRate(state);
}

function applyGrowth(deltaSeconds) {
    GROWTH_CONFIG.applyGrowth(state, deltaSeconds);
}

function canTriggerInfinity() {
    return !state.isInfinityReached && state.points.gte(INFINITY_CONFIG.requirement);
}

function startInfinityFlash() {
    document.body.classList.add('infinity-flash');

    if (infinityFlashTimer) {
        clearTimeout(infinityFlashTimer);
    }

    infinityFlashTimer = setTimeout(() => {
        document.body.classList.remove('infinity-flash');
        infinityFlashTimer = null;
    }, INFINITY_CONFIG.flashDuration);
}

function randomInfinityGarbleText(length = 2) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.?!:;…~_-/@*+()<>{}[]=%&$|\\♀♂#¥£¢€^∞∑∈≡⊥∏↔:=¬⊕¢Ψf∥≮≯∝∠∽≌∵∴∫∬∭∯∰∮∶∷∟∧∨∩∪⌒⊿△Δ½⅓¼⅛¾⅜℅≒⊂⊃⊆⊇∃∃!∅⊙∉⇒⇔∂∀※╳卐卍♩♪♫♬¶‖♯♭◈◎™©®⊙⊕Ψ㊣Θ¤¥¥$$££€₩†‡§〓﹂﹄︺︻︼☉〒〝〞〡〢〣〤〥〦゜﹋﹐︰¬¦‐〇﹫ˉ¨—⁺¹²³⁻⁴⁵⁶⁽ ⁾⁷⁸⁹ⁿˣ⁰ʸ₊₁₂₃₋₄₅₆₍ ₎₇₈₉ₙₓ₀ᵧαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩабвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += chars[Math.floor(Math.random() * chars.length)];
    }
    return text;
}

function startInfinityTextEffect() {
    stopInfinityTextEffect();

    const btn = document.getElementById('infinity-button');
    if (!btn) return;

    btn.textContent = '归零';
    isGarbleMode = false;

    function updateGarble() {
        if (!state.isInfinityReached || !btn) return;
        if (isGarbleMode) {
            const len = Math.floor(Math.random() * 10) + 1;
            btn.textContent = randomInfinityGarbleText(len);
        }
    }

    function switchMode() {
        if (!state.isInfinityReached) {
            stopInfinityTextEffect();
            return;
        }

        isGarbleMode = !isGarbleMode;

        if (isGarbleMode) {
            const len = Math.floor(Math.random() * 10) + 1;
            btn.textContent = randomInfinityGarbleText(len);
            if (infinityUpdateTimer) clearInterval(infinityUpdateTimer);
            infinityUpdateTimer = setInterval(updateGarble, 10);
        } else {
            btn.textContent = '归零';
            if (infinityUpdateTimer) {
                clearInterval(infinityUpdateTimer);
                infinityUpdateTimer = null;
            }
        }

        const nextDelay = Math.floor(Math.random() * 250) + 50;
        infinitySwitchTimer = setTimeout(switchMode, nextDelay);
    }

    const initialDelay = Math.floor(Math.random() * 600) + 100;
    infinitySwitchTimer = setTimeout(switchMode, initialDelay);
}

function stopInfinityTextEffect() {
    if (infinitySwitchTimer) {
        clearTimeout(infinitySwitchTimer);
        infinitySwitchTimer = null;
    }
    if (infinityUpdateTimer) {
        clearInterval(infinityUpdateTimer);
        infinityUpdateTimer = null;
    }
    isGarbleMode = false;
    const btn = document.getElementById('infinity-button');
    if (btn) btn.textContent = '归零';
}

function triggerInfinity() {
    if (!canTriggerInfinity()) return false;

    const isFirstTime = state.isFirstInfinity;

    state.isInfinityReached = true;
    state.currentInfinityIsFirst = isFirstTime;
    state.points = new Decimal(Decimal.dInf);

    if (isFirstTime) {
        startInfinityFlash();
        startInfinityTextEffect();
        state.isFirstInfinity = false;
    } else {
        stopInfinityTextEffect();
    }

    renderAll();
    return true;
}

function performInfinityReset() {
    state.speed = new Decimal('1');
    state.points = new Decimal(GAME_CONFIG.startingPoints);
    state.totalPointsEarned = new Decimal(GAME_CONFIG.startingPoints);
    state.totalClicks = new Decimal('0');
    state.peakPoints = new Decimal(GAME_CONFIG.startingPoints);
    state.totalQuantityCount = new Decimal('0');
    state.gameStartTime = Date.now();
    state.generatorUpgrades = GENERATOR_CONFIGS.map((config, index) => createGeneratorUpgrade(config, index));
    state.generatorUnlocked = GENERATOR_CONFIGS.map(() => false);
    const oldAchievements = state.achievements.slice();
    state.achievements = ACHIEVEMENTS.map((a, index) => {
        if (a.stage === 2 && oldAchievements[index] === true) {
            return true;
        }
        return false;
    });
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

    const oldNotificationHistory = { ...state.notificationHistory };
    state.notificationHistory = {};
    for (const [key, value] of Object.entries(oldNotificationHistory)) {
        const notifConfig = NOTIFICATIONS.find(n => n.id === key);
        if (notifConfig && notifConfig.stage === 2) {
            state.notificationHistory[key] = value;
        }
    }
    state.notificationQueue = [];

    state.rebootCount = new Decimal(state.rebootCount).add(new Decimal('1'));
    state.isInfinityReached = false;
    state.isInfinityBroken = false;
    state.isInfinityResetting = false;
    state.isFirstInfinity = false;
    state.currentInfinityIsFirst = false;

    stopInfinityTextEffect();
    checkGeneratorUnlock();
    renderAll();
}

function playInfinityResetSequence() {
    if (!state.isInfinityReached) return;
    if (state.isInfinityResetting) return;

    state.isInfinityResetting = true;

    const btn = document.getElementById('infinity-button');
    const overlay = document.getElementById('infinity-overlay');

    if (!btn || !overlay) {
        state.isInfinityResetting = false;
        return;
    }

    stopInfinityTextEffect();

    btn.classList.add('shrinking');
    btn.disabled = true;

    setTimeout(() => {
        startInfinityFlash();

        setTimeout(() => {
            overlay.style.display = 'none';
            btn.classList.remove('shrinking');
            btn.disabled = false;

            performInfinityReset();
        }, 300);
    }, 800);
}

function getGeneratorPurchasePreview(index) {
    const u = state.generatorUpgrades[index];
    const mode = state.batchPurchaseUnlocked ? state.batchAmount : '1';
    const maxQuantity = u.getMaxQuantity();

    if (u.quantity.gte(maxQuantity)) {
        return {
            action: 'upgrade',
            displayCost: null,
            canAfford: true,
            buyCount: 0,
        };
    }

    if (mode === '1') {
        const cost = u.getCost();
        return {
            action: 'buy',
            displayCost: cost,
            canAfford: state.points.gte(cost),
            buyCount: state.points.gte(cost) ? 1 : 0,
        };
    }

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
            canAfford: buyCount > 0 && state.points.gte(totalCost),
            buyCount,
        };
    }

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

    state.prestigePointsLimit = peak;
    state.prestigeMult = preview.newMult;
    state.prestigeExp = preview.newExp;

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
