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

// 绑定所有事件
function bindEvents() {
    // 购买按钮点击
    for (let i = 0; i < COUNT; i++) {
        const ref = dom.upgradeBoxes[i];
        if (!ref) continue;
        ref.btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const result = performGenerator(i);
            if (result === 'upgrade' || result === 'buy') {
                state.totalClicks = state.totalClicks.add(1);
                renderAll();
                // 如果成就页面可见，刷新（已在 renderAll 中处理）
            }
        });
    }
    
    // 汉堡菜单
    document.getElementById('menuToggle').addEventListener('click', () => toggleMenu());
    document.getElementById('menuOverlay').addEventListener('click', () => toggleMenu(false));
    
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
            // 基本校验：必须包含 points, upgrades 等
            if (!data.points || !data.upgrades || !Array.isArray(data.upgrades)) {
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
}