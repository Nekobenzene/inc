// game-logic.js

let infinityTextTimer = null;
let infinityFlashTimer = null;
let infinityGarbleState = false;

let infinityUpdateTimer = null;   // 用于 10ms 更新乱码
let infinitySwitchTimer = null;   // 用于切换模式（归零/乱码）
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,.?!:;…~_-/@*+()<>{}[]=%&$|\♀♂#¥£¢€^∞∑∈≡⊥∏↔:=¬⊕￠Ψf∥≮≯∝∠∽≌∵∴∫∬∭∯∰∮∶∷∟∧∨∩∪⌒⊿△Δ½⅓¼⅛¾⅜℅≒⊂⊃⊆⊇∃∃!∅⊙∉⇒⇔∂∀※╳卐卍♩♪♫♬¶‖♯♭◈◎™©®⊙⊕Ψ㊣Θ¤￥¥＄$￡£€₩†‡§〓﹂﹄︺︻︼☉〒〝〞〡〢〣〤〥〦゜﹋﹐︰￢￤‐〇﹫ˉ¨—⁺¹²³⁻⁴⁵⁶⁽ ⁾⁷⁸⁹ⁿˣ⁰ʸ₊₁₂₃₋₄₅₆₍ ₎₇₈₉ₙₓ₀ᵧαβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩабвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
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

    // 乱码更新函数：每 10ms 刷新，随机长度 + 随机字符
    function updateGarble() {
        if (!state.isInfinityReached || !btn) return;
        if (isGarbleMode) {
            const len = Math.floor(Math.random() * 10) + 1;   // 1~10 随机
            btn.textContent = randomInfinityGarbleText(len);
        }
    }

    // 切换“归零” ↔ “乱码”
    function switchMode() {
        if (!state.isInfinityReached) {
            stopInfinityTextEffect();
            return;
        }

        isGarbleMode = !isGarbleMode;

        if (isGarbleMode) {
            // 进入乱码模式：立即生成一次乱码，启动 10ms 更新
            const len = Math.floor(Math.random() * 10) + 1;
            btn.textContent = randomInfinityGarbleText(len);
            if (infinityUpdateTimer) clearInterval(infinityUpdateTimer);
            infinityUpdateTimer = setInterval(updateGarble, 10);
        } else {
            // 退出乱码：显示“归零”，停止 10ms 更新
            btn.textContent = '归零';
            if (infinityUpdateTimer) {
                clearInterval(infinityUpdateTimer);
                infinityUpdateTimer = null;
            }
        }

        // 随机下一次切换间隔（50~300ms）
        const nextDelay = Math.floor(Math.random() * 250) + 50;
        infinitySwitchTimer = setTimeout(switchMode, nextDelay);
    }

    // 第一次切换（初始为“归零”，所以第一次进入乱码）
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
    state.points = new Decimal(Decimal.dInf);

    if (isFirstTime) {
        startInfinityFlash();
        startInfinityTextEffect();
        state.isFirstInfinity = false;
    } else {
        stopInfinityTextEffect();
        const btn = document.getElementById('infinity-button');
        if (btn) btn.textContent = '归零';
    }

    renderAll();
    return true;
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
