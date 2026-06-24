// ui-renderer.js

const dom = {};

function cacheDom() {
    dom.points = document.getElementById('points');
    dom.rate = document.getElementById('point-rate');
    dom.pointsFormula = document.getElementById('points-formula');
    dom.navPointsBadge = document.getElementById('navPointsBadge');

    dom.multipleContainers = document.querySelectorAll('.multiplers-item');
    dom.multipleEls = [
        document.getElementById('m1'),
        document.getElementById('m2'),
        document.getElementById('m3'),
        document.getElementById('m4')
    ];

    dom.upgradeBoxes = [];
    for (let i = 0; i < COUNT; i++) {
        const box = document.querySelectorAll('.multipler-generator-box')[i];
        if (!box) continue;
        dom.upgradeBoxes[i] = {
            box,
            btn: box.querySelector('.multipler-generator-button'),
            quantitySpan: box.querySelector('.multipler-generator-quantity'),
            levelSpan: box.querySelector('.multipler-generator-level'),
            effectSpan: box.querySelector('.multipler-generator-effect'),
            labelSpan: box.querySelector('.multipler-generator-button-label'),
            costSpan: box.querySelector('.multipler-generator-cost')
        };
    }

    dom.achievementGrid = document.getElementById('achievement-grid');
    dom.achievementCounter = document.getElementById('achievement-counter');
    dom.statsFields = {};

    for (const field of STATS_CONFIG.fields) {
        const el = document.getElementById(`stat-${field.id}`);
        if (el) dom.statsFields[field.id] = el;
    }
}

function renderBatchPurchase() {
    const container = document.querySelector('.batch-purchase-container');
    if (!container) return;

    container.style.display = state.batchPurchaseUnlocked ? '' : 'none';

    document.querySelectorAll('.batch-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.amount === state.batchAmount);
    });
}

function renderMainUI() {
    dom.points.textContent = formatDecimal(state.points);
    dom.rate.textContent = formatDecimal(computeTotalRate());
    dom.navPointsBadge.textContent = `${UI_TEXTS.nav.pointsBadge}${formatDecimal(state.points)}`;

    let formulaText = 'Π(M)';
    if (state.achReward.ach7.eq(new Decimal(1)) && state.points.gt(new Decimal(2))) {
        formulaText += '×log₂(P)';
        if (state.achReward.ach12.neq(new Decimal(1))) {
            formulaText += `<sup> ${formatDecimal(state. achReward.ach12)}</sup>`;
        }
    }
    if (state.achReward.ach8.eq(new Decimal(1))) {
        formulaText = '(' + formulaText + ')' + `<sup>${formatDecimal(state.pointExp)}</sup>`;
    }
    dom.pointsFormula.innerHTML = formulaText;

    for (let i = 0; i < state.generatorUpgrades.length; i++) {
        const u = state.generatorUpgrades[i];
        const container = dom.multipleContainers[i];
        if (container) {
            container.style.display = u.unlocked ? '' : 'none';
        }
        const multipleEl = dom.multipleEls[i];
        if (multipleEl && u.unlocked) {
            multipleEl.textContent = formatDecimal(u.multiple);
        }
    }

    renderBatchPurchase();

    for (let i = 0; i < state.generatorUpgrades.length; i++) {
        const ref = dom.upgradeBoxes[i];
        if (!ref) continue;
        const u = state.generatorUpgrades[i];

        if (u.unlocked) {
            ref.box.style.display = '';
            const cost = u.getCost();
            const maxQuantity = u.getMaxQuantity();
            const isMaxed = u.quantity.gte(maxQuantity);
            const canAfford = state.points.gte(cost);

            ref.quantitySpan.textContent = `${UI_TEXTS.generatorUpgrades.quantity}${formatDecimal(u.quantity)}${UI_TEXTS.generatorUpgrades.maxQuantity}${formatDecimal(maxQuantity)}`;
            ref.levelSpan.textContent = `${UI_TEXTS.generatorUpgrades.level}${formatDecimal(u.level)}`;
            ref.effectSpan.textContent = `${UI_TEXTS.generatorUpgrades.effect}${i + 1}${UI_TEXTS.generatorUpgrades.effectSuffix}${formatDecimal(u.getRate())}`;

            if (isMaxed) {
                ref.btn.classList.add('upgrade-mode');
                ref.btn.classList.remove('locked');
                ref.labelSpan.textContent = UI_TEXTS.generatorUpgrades.upgradeLabel;
                ref.costSpan.textContent = UI_TEXTS.generatorUpgrades.upgradeCost;
            } else {
                ref.btn.classList.remove('upgrade-mode');
                ref.labelSpan.textContent = UI_TEXTS.generatorUpgrades.buyLabel;
                ref.costSpan.textContent = `${UI_TEXTS.generatorUpgrades.cost}${formatDecimal(cost)}`;
                ref.btn.classList.toggle('locked', !canAfford);
            }
        } else {
            ref.box.style.display = 'none';
        }
    }
}

function updateChallengeTabVisibility() {
    const challengeTab = document.querySelector('.game-tab[data-tab="challenges"]');
    const challengeContent = document.getElementById('tab-challenges');
    if (!challengeTab || !challengeContent) return;

    const visible = state.challengeUnlocked;
    challengeTab.style.display = visible ? '' : '';
    challengeContent.style.display = visible ? '' : '';

    if (!visible) {
        challengeTab.style.display = 'none';
        challengeContent.style.display = 'none';

        const activeContent = document.querySelector('.game-tab-content.active');
        if (activeContent && activeContent.id === 'tab-challenges') {
            document.querySelector('.game-tab[data-tab="generators"]')?.click();
        }
    }
}

function renderChallenges() {
    const grid = document.getElementById('challenges-grid');
    if (!grid) return;
    const counter = document.getElementById('challenges-counter');
    if (!counter) return;

    const total = CHALLENGES.length;
    let completedCount = 0;

    while (grid.children.length < total) {
        const card = document.createElement('button');
        card.className = 'challenge-card pending';
        card.dataset.index = grid.children.length;
        card.innerHTML = `
            <div class="challenge-name"></div>
            <div class="challenge-limitation"></div>
            <div class="challenge-target"></div>
            <div class="challenge-reward"></div>
            <div class="challenge-best"></div>
        `;
        grid.appendChild(card);
    }

    while (grid.children.length > total) {
        grid.removeChild(grid.lastChild);
    }

    for (let i = 0; i < total; i++) {
        const card = grid.children[i];
        const ch = CHALLENGES[i];
        const isComplete = state.challengeSpendTime[i] && state.challengeSpendTime[i].gt(-1);
        if (isComplete) completedCount++;

        let statusClass;
        let bestTime;

        if (state.isInChallenge === i) {
            statusClass = 'in-progress';
            bestTime = '进行中...';
        } else if (isComplete) {
            statusClass = 'completed';
            bestTime = formatDecimal(state.challengeSpendTime[i]) + 's';
        } else {
            statusClass = 'pending';
            bestTime = '未完成';
        }

        card.className = `challenge-card ${statusClass}`;
        card.dataset.index = i;
        card.querySelector('.challenge-name').textContent = ch.name;
        card.querySelector('.challenge-limitation').textContent = `限制:${ch.limitationDescription}`;
        card.querySelector('.challenge-target').textContent = `目标:${ch.target}`;
        card.querySelector('.challenge-reward').textContent = `奖励:${ch.rewardDescription}`;
        card.querySelector('.challenge-best').textContent = `最快完成:${bestTime}`;
    }

    counter.textContent = `${completedCount} / ${total}`;
}

function renderNav() {
    const desktopList = document.getElementById('desktopNavList');
    const sideList = document.getElementById('sideNavList');

    desktopList.innerHTML = '';
    sideList.innerHTML = '';

    NAV_PAGES.forEach(page => {
        const desktopItem = document.createElement('li');
        desktopItem.className = 'desktop-nav-item';
        desktopItem.dataset.page = page.id;
        desktopItem.innerHTML = `
            <span>${page.label}</span>
            ${page.badge ? `<span class="nav-badge">${page.badge}</span>` : ''}
        `;
        desktopList.appendChild(desktopItem);

        const sideItem = document.createElement('li');
        sideItem.className = 'side-nav-item';
        sideItem.dataset.page = page.id;
        sideItem.innerHTML = `
            <span class="nav-label">${page.label}</span>
            ${page.badge ? `<span class="nav-badge">${page.badge}</span>` : ''}
        `;
        sideList.appendChild(sideItem);
    });

    bindNavEvents();
}

function renderAchievements() {
    if (!dom.achievementGrid) return;

    let html = '';
    let unlockedCount = 0;

    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        const a = ACHIEVEMENTS[i];
        const unlocked = state.achievements[i];

        if (unlocked) unlockedCount++;

        const statusText = unlocked ? UI_TEXTS.achievements.unlocked : UI_TEXTS.achievements.locked;
        const cls = unlocked ? 'achievement-card unlocked' : 'achievement-card locked';

        html += `
            <div class="${cls}">
                <div class="achievement-info">
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.description}</div>
                    ${a.rewardDescription ? `<div class="achievement-reward">${a.rewardDescription}</div>` : ''}
                </div>
                <div class="achievement-status">${statusText}</div>
            </div>
        `;
    }

    dom.achievementGrid.innerHTML = html;

    if (dom.achievementCounter) {
        dom.achievementCounter.textContent = UI_TEXTS.achievements.counterFormat
            .replace('{unlocked}', unlockedCount)
            .replace('{total}', ACHIEVEMENTS.length);
    }
}

function renderStats() {
    const stats = getStats();
    for (const field of STATS_CONFIG.fields) {
        const el = dom.statsFields[field.id];
        if (el) {
            el.textContent = field.format(stats[field.id]);
        }
    }
}

function renderAll() {
    renderNav();
    renderMainUI();
    renderAchievements();
    updateChallengeTabVisibility();
    renderStats();
    renderChallenges();
}
