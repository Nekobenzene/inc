// ui-controller.js

function bindNavEvents() {
    document.querySelectorAll('.desktop-nav-item, .side-nav-item').forEach(item => {
        item.removeEventListener('click', navClickHandler);
        item.addEventListener('click', navClickHandler);
    });
}

function navClickHandler(e) {
    const page = this.dataset.page;
    navigateTo(page);
    if (this.closest('.side-nav')) {
        toggleMenu(false);
    }
}

function navigateTo(pageId) {
    document.querySelectorAll('.desktop-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });
    document.querySelectorAll('.side-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });

    document.querySelectorAll('.page-view').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });

    if (pageId === 'achievements') {
        renderAchievements();
    }
    if (pageId === 'stats') {
        renderStats();
    }
}

function toggleMenu(open) {
    const sideNav = document.getElementById('sideNav');
    const overlay = document.getElementById('menuOverlay');
    const toggle = document.getElementById('menuToggle');
    const isOpen = open !== undefined ? open : !sideNav.classList.contains('open');
    sideNav.classList.toggle('open', isOpen);
    overlay.classList.toggle('open', isOpen);
    toggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function exitChallenge(index) {
    const challenge = CHALLENGES[index];
    if (!challenge) return;
    if (state.isInChallenge !== index) return;

    const elapsed = (Date.now() - state.challengeStartTime) / 1000;
    const isCompleted = challenge.check(state);

    if (isCompleted) {
        const best = state.challengeSpendTime[index];
        if (best.eq(-1) || elapsed < best.toNumber()) {
            state.challengeSpendTime[index] = new Decimal(elapsed);
            if (best.eq(-1) && typeof challenge.reward === 'function') {
                challenge.reward(state);
            }
        }

        notificationManager.push({
            id: `challenge_complete_${index}_${Date.now()}`,
            title: '挑战完成',
            message: `你完成了挑战:${challenge.name}`,
            type: 'milestone',
            duration: 2,
        });
    }

    state.isInChallenge = -1;
    state.challengeStartTime = 0;
    checkGeneratorUnlock();

    renderChallenges();
    renderMainUI();
}

function toggleChallenge(index) {
    const challenge = CHALLENGES[index];
    if (!challenge) return;

    if (state.isInfinityReached) return;

    if (state.isInChallenge === index) {
        exitChallenge(index);
        return;
    } else if (state.isInChallenge !== -1) {
        state.isInChallenge = -1;
        state.challengeStartTime = 0;
    }

    resetForChallenge();
    state.isInChallenge = index;
    state.challengeStartTime = Date.now();
    checkGeneratorUnlock();

    renderChallenges();
    renderMainUI();
}

function checkChallenge() {
    if (state.isInChallenge === -1) return false;
    const index = state.isInChallenge;
    const challenge = CHALLENGES[index];
    if (!challenge) return false;

    if (challenge.check(state)) {
        exitChallenge(index);
        return true;
    }
    return false;
}

function bindEvents() {
    for (let i = 0; i < COUNT; i++) {
        const ref = dom.upgradeBoxes[i];
        if (!ref) continue;
        ref.btn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (state.isInfinityReached) return;

            state.totalClicks = state.totalClicks.add(1);

            const result = performGenerator(i);
            if (result === 'upgrade' || result === 'buy') {
                renderAll();
            }
        });
    }

    document.getElementById('menuToggle').addEventListener('click', () => toggleMenu());
    document.getElementById('menuOverlay').addEventListener('click', () => toggleMenu(false));

    document.getElementById('btnRefresh')?.addEventListener('click', () => {
        renderAll();
        const statsView = document.querySelector('.page-view[data-page="stats"]');
        if (statsView && statsView.classList.contains('active')) {
            renderStats();
        }
    });

    document.getElementById('btnSave')?.addEventListener('click', () => {
        saveGame();
        alert(UI_TEXTS.settings.saveSuccess);
    });

    document.getElementById('btnLoad')?.addEventListener('click', () => {
        if (loadGame()) {
            renderAll();
            alert(UI_TEXTS.settings.loadSuccess);
        } else {
            alert(UI_TEXTS.settings.noSave);
        }
    });

    document.getElementById('btnReset')?.addEventListener('click', () => {
        if (confirm(UI_TEXTS.settings.resetConfirm)) {
            resetGame();
            renderAll();
            alert('已重置');
        }
    });

    const prestigeBtn = document.querySelector('.prestige-btn');
    prestigeBtn?.addEventListener('click', () => {
        if (state.isInfinityReached) return;
        if (!canPrestige()) return;
        performPrestige();
    });

    const infinityBtn = document.getElementById('infinity-button');
    infinityBtn?.addEventListener('click', () => {
        if (!state.isInfinityReached) return;
        playInfinityResetSequence();
    });

    const quietInfinityBtn = document.getElementById('quiet-infinity-button');
    quietInfinityBtn?.addEventListener('click', () => {
        if (!state.isInfinityReached) return;
        performInfinityReset();
    });

    navigateTo('game');

    const devUnlockBtn = document.getElementById('devUnlockBtn');
    const devEditor = document.getElementById('devEditor');
    const devJsonEditor = document.getElementById('devJsonEditor');
    const devApplyBtn = document.getElementById('devApplyBtn');
    const devRefreshBtn = document.getElementById('devRefreshBtn');
    const devStatus = document.getElementById('devStatus');

    let devUnlocked = false;

    devUnlockBtn.addEventListener('click', () => {
        const password = document.getElementById('devPassword').value;
        if (password === DEVELOPER_PASSWORD) {
            devUnlocked = true;
            devEditor.style.display = 'block';
            devStatus.textContent = '✅ 已解锁';
            devStatus.style.color = '#4CAF50';
            refreshDevEditor();
        } else {
            devStatus.textContent = '❌ 密码错误';
            devStatus.style.color = '#ff6b6b';
            setTimeout(() => { devStatus.textContent = ''; }, 2000);
        }
    });

    function refreshDevEditor() {
        const data = serializeState();
        devJsonEditor.value = JSON.stringify(data, null, 2);
    }

    devRefreshBtn.addEventListener('click', refreshDevEditor);

    devApplyBtn.addEventListener('click', () => {
        if (!devUnlocked) {
            devStatus.textContent = '⚠️ 请先解锁';
            devStatus.style.color = '#ff6b6b';
            setTimeout(() => { devStatus.textContent = ''; }, 2000);
            return;
        }

        try {
            const raw = devJsonEditor.value;
            const data = JSON.parse(raw);

            if (data.points === undefined || !Array.isArray(data.generatorUpgrades)) {
                throw new Error('无效的状态结构');
            }

            deserializeState(data);
            checkGeneratorUnlock();
            renderAll();

            const statsView = document.querySelector('.page-view[data-page="stats"]');
            if (statsView && statsView.classList.contains('active')) {
                renderStats();
            }

            devStatus.textContent = '✅ 修改已应用';
            devStatus.style.color = '#4CAF50';
            setTimeout(() => { devStatus.textContent = ''; }, 2000);
        } catch (e) {
            devStatus.textContent = '❌ 解析失败: ' + e.message;
            devStatus.style.color = '#ff6b6b';
            setTimeout(() => { devStatus.textContent = ''; }, 3000);
        }
    });

    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            if (tabName === 'challenges' && !state.challengeUnlocked) {
                return;
            }

            document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.game-tab-content').forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById('tab-' + tabName);
            if (targetContent) targetContent.classList.add('active');

            if (tabName === 'challenges') {
                renderChallenges();
            }
        });
    });

    document.getElementById('challenges-grid').addEventListener('click', function(e) {
        const card = e.target.closest('.challenge-card');
        if (!card) return;
        const index = parseInt(card.dataset.index);
        if (isNaN(index)) return;
        toggleChallenge(index);
    });

    document.querySelectorAll('.batch-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (state.isInfinityReached) return;

            const parent = this.closest('.batch-options');
            parent.querySelectorAll('.batch-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.batchAmount = this.dataset.amount;
            console.log('批量购买模式切换为:', this.dataset.amount);
        });
    });
    
    const infinityQuietBtn = document.getElementById('infinity-quiet-infinity-button');
    if (infinityQuietBtn) {
        infinityQuietBtn.addEventListener('click', () => {
            if (!state.isInfinityReached) return;
            performInfinityReset();
            // 重置后刷新UI
            renderAll();
        });
    }
    
    bindNotificationEvents();
}
