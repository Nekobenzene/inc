// ui-controller.js – 绑定用户交互事件

// 单独绑定导航事件（可复用）
function bindNavEvents() {
    document.querySelectorAll('.desktop-nav-item, .side-nav-item').forEach(item => {
        item.removeEventListener('click', navClickHandler);
        item.addEventListener('click', navClickHandler);
    });
}

function navClickHandler(e) {
    const page = this.dataset.page;
    navigateTo(page);
    // 如果是侧边栏，关闭菜单
    if (this.closest('.side-nav')) {
        toggleMenu(false);
    }
}

// 导航切换
function navigateTo(pageId) {
    // 更新导航高亮
    document.querySelectorAll('.desktop-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });
    document.querySelectorAll('.side-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });
    
    // 切换页面显示
    document.querySelectorAll('.page-view').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });
    
    // 刷新特定页面内容
    if (pageId === 'achievements') {
        renderAchievements();
    }
    if (pageId === 'stats') {
        renderStats();
    }
}

// 侧边栏控制
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

// ========== 挑战全局函数 ==========

/**
 * 退出挑战，计算耗时，判断是否完成并记录
 */
function exitChallenge(index) {
    const challenge = CHALLENGES[index];
    if (!challenge) return;

    // 如果当前没有进行任何挑战，或者进行的不是该索引，则直接返回
    if (state.isInChallenge !== index) return;

    // 计算经过时间（秒）
    const elapsed = (Date.now() - state.challengeStartTime) / 1000;
    const isCompleted = challenge.check(state);

    // 如果完成，更新记录（仅当比已有记录更快或首次完成）
    if (isCompleted) {
        const best = state.challengeSpendTime[index];
        // 若未记录过（-1）或本次更快，则更新
        if (best.eq(-1) || elapsed < best.toNumber()) {
            state.challengeSpendTime[index] = new Decimal(elapsed);
            // 首次完成时发放奖励
            if (best.eq(-1) && typeof challenge.reward === 'function') {
                challenge.reward(state);
            }
        }
    }

    // 退出挑战（清除状态）
    state.isInChallenge = -1;
    state.challengeStartTime = 0;
    // 刷新 UI
    renderChallenges();
    renderMainUI();
}

/**
 * 检查当前进行中的挑战是否已完成（由主循环调用）
 * 若完成则自动调用 exitChallenge
 * @returns {boolean} 是否触发了完成退出
 */


/**
 * 切换挑战状态：如果未进入则进入，如果已进入则退出（并检查完成）
 */
function toggleChallenge(index) {
    const challenge = CHALLENGES[index];
    if (!challenge) return;

    // 如果已经在进行当前挑战 → 退出
    if (state.isInChallenge === index) {
        exitChallenge(index);
        return;
    }

    // 如果正在进行其他挑战 → 强制退出（不检查完成，直接丢弃）
    else if (state.isInChallenge !== -1) {
        // 简单清除，不记录时间（相当于放弃）
        state.isInChallenge = -1;
        state.challengeStartTime = 0;
        // 注意：这里没有调用 exitChallenge，所以不会记录任何完成状态
        // 之后会进入新的挑战
    }
    
    // 重置游戏
    resetForChallenge()

    // 进入挑战
    state.isInChallenge = index;
    state.challengeStartTime = Date.now();
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





// 绑定所有事件
function bindEvents() {
    // 购买按钮点击
    for (let i = 0; i < COUNT; i++) {
        const ref = dom.upgradeBoxes[i];
        if (!ref) continue;
        ref.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.totalClicks = state.totalClicks.add(1);

            const result = performGenerator(i);
            if (result === 'upgrade' || result === 'buy') {
                renderAll();
                // 如果成就页面可见，刷新（已在 renderAll 中处理）
            }
        });
    }
    
    // 汉堡菜单
    document.getElementById('menuToggle').addEventListener('click', () => toggleMenu());
    document.getElementById('menuOverlay').addEventListener('click', () => toggleMenu(false));
    
    // 刷新按钮
    document.getElementById('btnRefresh')?.addEventListener('click', () => {
        // 全面刷新UI
        renderAll();
        // 如果统计页可见，额外刷新统计数据
        const statsView = document.querySelector('.page-view[data-page="stats"]');
        if (statsView && statsView.classList.contains('active')) {
            renderStats();
    }
    });
    
    // 保存按钮
    document.getElementById('btnSave')?.addEventListener('click', () => {
        saveGame();
        alert(UI_TEXTS.settings.saveSuccess);
    });
    
    // 读取按钮
    document.getElementById('btnLoad')?.addEventListener('click', () => {
        if (loadGame()) {
            renderAll();
            alert(UI_TEXTS.settings.loadSuccess);
        } else {
            alert(UI_TEXTS.settings.noSave);
        }
    });
    
    // 重置按钮
    document.getElementById('btnReset')?.addEventListener('click', () => {
        if (confirm(UI_TEXTS.settings.resetConfirm)) {
            resetGame();
            renderAll();
            alert('已重置');
        }
    });
    
    // 页面加载后，默认显示游戏页
    navigateTo('game');
    
    // ========== 开发者模式 ==========
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
            // 填充当前状态
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
            // 基本校验：必须包含 points, generatorUpgrades 等
            if (!data.points || !data.generatorUpgrades || !Array.isArray(data.generatorUpgrades)) {
                throw new Error('无效的状态结构');
            }
            // 应用状态
            deserializeState(data);
            // 刷新UI
            renderAll();
            // 如果统计页可见刷新统计
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
    // ----- 游戏内选项卡（发电机 / 挑战）切换 -----
    document.querySelectorAll('.game-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            // 更新 tab 按钮状态
            if (tabName === 'challanges' && !state.challengeUnlocked) {return}
            document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            // 切换内容区域
            document.querySelectorAll('.game-tab-content').forEach(content => content.classList.remove('active'));
            const targetContent = document.getElementById('tab-' + tabName);
            if (targetContent) targetContent.classList.add('active');
            // 如果切换到挑战选项卡，刷新挑战列表（确保数据最新）
            if (tabName === 'challenges') {
                renderChallenges();
            }
        });
    });
    
    // 绑定挑战点击事件（在 bindEvents 中）
    document.getElementById('challenges-grid').addEventListener('click', function(e) {
        const card = e.target.closest('.challenge-card');
        if (!card) return;
        const index = parseInt(card.dataset.index);
        if (isNaN(index)) return;
        toggleChallenge(index);  // 使用全局函数
    });
    
    // 批量购买切换
    document.querySelectorAll('.batch-option').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除同组所有 active 类
            const parent = this.closest('.batch-options');
            parent.querySelectorAll('.batch-option').forEach(b => b.classList.remove('active'));
            // 给当前按钮添加 active
            this.classList.add('active');
            state.batchAmount = this.dataset.amount; 
            console.log('批量购买模式切换为:', this.dataset.amount);
    });
});
    
}