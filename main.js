// app.js – 初始化、游戏循环、自动保存（合并了 main.js）

let lastTimestamp = null;
let accumulatedTime = 0;
let autoSaveTimer = 0;

// ============ 初始化入口 ============
function initApp() {
    // 缓存 DOM
    cacheDom();

    // 尝试加载存档
    const loaded = loadGame();
    if (loaded) {
        console.log('存档加载成功');
    } else {
        initState();
    }

    // 渲染初始界面
    renderAll();

    // 绑定事件
    bindEvents();

    // 启动游戏循环
    requestAnimationFrame(gameLoop);
    
    // 生成导航列表
    renderNav();

    console.log('✅ 游戏已启动！');
}

// ============ 游戏循环 ============
function gameLoop(now) {
    if (lastTimestamp === null) {
        lastTimestamp = now;
        requestAnimationFrame(gameLoop);
        return;
    }

    // 计算增量时间
    let delta = Math.min((now - lastTimestamp) / 1000, GAME_CONFIG.maxDeltaTime);
    lastTimestamp = now;

    // 累积时间并批量更新
    accumulatedTime += delta;
    while (accumulatedTime >= GAME_CONFIG.updateInterval) {
        applyGrowth(GAME_CONFIG.updateInterval);
        accumulatedTime -= GAME_CONFIG.updateInterval;
    }

    // 检查成就
    const anyUnlocked = checkAchievements();
    if (anyUnlocked) {
        renderAchievements();
    }

    // 渲染 UI（可添加节流，但此处简单全量刷新）
    renderMainUI();

    // 如果统计页可见，刷新统计
    const statsView = document.querySelector('.page-view[data-page="stats"]');
    if (statsView && statsView.classList.contains('active')) {
        renderStats();
    }

    // 自动保存
    if (GAME_CONFIG.autoSaveInterval > 0) {
        autoSaveTimer += delta;
        if (autoSaveTimer >= GAME_CONFIG.autoSaveInterval) {
            saveGame();
            autoSaveTimer = 0;
        }
    }

    requestAnimationFrame(gameLoop);
}

// ============ 启动应用 ============
// 等待 DOM 完全加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM 已就绪，直接执行
    initApp();
}