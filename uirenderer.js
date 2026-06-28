// ui-renderer.js

const dom = {};

function cacheDom() {
    dom.points = document.getElementById('points');
    dom.infinityPoints = document.getElementById('infinity-points')
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

    dom.infinityAxioms = document.getElementById('infinity-axioms')

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

function renderPrestigeButton() {
    const wrapper = document.querySelector('.prestige-button-wrapper');
    if (!wrapper) return;
    wrapper.style.display = state.prestigeUnlocked ? 'flex' : 'none';

    const btn = wrapper.querySelector('.prestige-btn');
    if (!btn) return;

    const preview = getPrestigePreview();
    const can = canPrestige();

    btn.classList.toggle('locked', !can);

    btn.innerHTML = `
        <div>声望</div>
        <div style="font-size:0.45em; letter-spacing:0;">倍率: ×${formatDecimal(state.prestigeMult)} → ×${formatDecimal(preview.newMult)}</div>
        <div style="font-size:0.45em; letter-spacing:0;">指数: ×${formatDecimal(state.prestigeExp)} → ×${formatDecimal(preview.newExp)}</div>
    `;
}

function renderInfinityOverlay() {
    const overlay = document.getElementById('infinity-overlay');
    const quietWrapper = document.getElementById('quiet-infinity-wrapper');

    // ----- 大按钮（首次无限特效）-----
    if (state.isInfinityReached && state.currentInfinityIsFirst) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }

    // ----- 常驻三行按钮（首次归零后出现）-----
    if (state.rebootCount.gt(0)) {
        quietWrapper.style.display = 'flex';
        const btn = document.getElementById('quiet-infinity-button');
        if (btn) {
            const peak = state.peakPointsForReboot;
            const axiomsGain = INFINITY_CONFIG.axiomsGainFn(peak);
            btn.innerHTML = `
                <div class="qi-title">归零</div>
                <div class="qi-peak">P最高：<span class="qi-peak-value">${formatDecimal(peak)}</span></div>
                <div class="qi-gain">归零后获得<span class="qi-gain-value">${formatDecimal(axiomsGain)}</span>公理</div>
            `;
            // 根据是否达到无限切换锁定样式
            btn.classList.toggle('locked', !state.isInfinityReached);
        }
    } else {
        quietWrapper.style.display = 'none';
    }
}

function renderMainUI() {
    const pointText = state.isInfinityReached ? 'Infinity' : formatDecimal(state.points);
    const rateText = state.isInfinityReached ? '0' : formatDecimal(computeTotalRate());

    dom.points.textContent = pointText;
    dom.infinityPoints.textContent = pointText;
    dom.rate.textContent = rateText;
    dom.navPointsBadge.textContent = `${UI_TEXTS.nav.pointsBadge}${pointText}`;

    let formulaText = '(Π(M)×Pm)'+`<sup>Pe</sup>`;
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
            const maxQuantity = u.getMaxQuantity();
            const preview = getGeneratorPurchasePreview(i);
            const isMaxed = preview.action === 'upgrade';
            const canAfford = preview.canAfford;

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

                const displayCost = preview.displayCost ?? new Decimal('0');
                ref.costSpan.textContent = `${UI_TEXTS.generatorUpgrades.cost}${formatDecimal(displayCost)}`;

                ref.btn.classList.toggle('locked', !canAfford);
            }
        } else {
            ref.box.style.display = 'none';
        }
    }

    renderInfinityOverlay();
    
    const infinityAxioms = document.getElementById('infinity-axioms');
    if (infinityAxioms) {
        infinityAxioms.textContent = formatDecimal(state.axioms);
    }
}

function updateChallengeTabVisibility() {
    const challengeTab = document.querySelector('.game-tab[data-tab="challenges"]');
    const challengeContent = document.getElementById('tab-challenges');
    if (!challengeTab || !challengeContent) return;

    const visible = state.challengeUnlocked;

    if (visible) {
        challengeTab.style.display = '';
        challengeContent.style.display = '';
    } else {
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

function renderNotifications() {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const now = Date.now();
    const exitDuration = 300;

    for (const n of state.notificationQueue) {
        if (!n.isExiting && now >= n.expiresAt) {
            n.isExiting = true;
            n.removeAt = now + exitDuration;
        }
    }

    state.notificationQueue = state.notificationQueue.filter(n => {
        return !n.removeAt || now < n.removeAt;
    });

    const visible = state.notificationQueue.slice(0, notificationManager.maxVisible);

    const renderKey = JSON.stringify(
        visible.map(n => ({
            id: n.id,
            exiting: n.isExiting,
            title: n.title,
            message: n.message,
            type: n.type
        }))
    );

    if (renderKey === notificationManager.lastRenderKey) return;
    notificationManager.lastRenderKey = renderKey;

    container.innerHTML = visible.map(n => `
        <div class="notification-card notification-${n.type} ${n.isExiting ? 'notification-exit' : 'notification-enter'}" data-id="${n.id}">
            <div class="notification-title">${n.title}</div>
            <div class="notification-message">${n.message}</div>
        </div>
    `).join('');
}

function bindNotificationEvents() {
    const container = document.getElementById('notification-container');
    if (!container) return;

    container.addEventListener('click', function(e) {
        const card = e.target.closest('.notification-card');
        if (!card) return;

        const id = card.dataset.id;
        if (!id) return;

        notificationManager.removeNow(id);
        renderNotifications();
    });
}

function renderNav() {
    const desktopList = document.getElementById('desktopNavList');
    const sideList = document.getElementById('sideNavList');

    desktopList.innerHTML = '';
    sideList.innerHTML = '';

    NAV_PAGES.forEach(page => {
        if (page.id === 'infinity' && state.rebootCount.lte(0)) {
            return;
        }
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
    if (!stats) return;
    if (!dom.statsFields) return;

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
    renderPrestigeButton();
    renderInfinityOverlay();
}
