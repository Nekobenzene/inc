// main.js

let lastTimestamp = null;
let accumulatedTime = 0;
let autoSaveTimer = 0;

function initApp() {
    cacheDom();

    const loaded = loadGame();
    if (loaded) {
        console.log('存档加载成功');
    } else {
        initState();
    }

    renderAll();
    bindEvents();
    requestAnimationFrame(gameLoop);

    console.log('✅ 游戏已启动!');
}

function gameLoop(now) {
    if (lastTimestamp === null) {
        lastTimestamp = now;
        requestAnimationFrame(gameLoop);
        return;
    }

    let delta = Math.min((now - lastTimestamp) / 1000, GAME_CONFIG.maxDeltaTime);
    lastTimestamp = now;

    if (!state.isInfinityReached) {
        accumulatedTime += delta;
        while (accumulatedTime >= GAME_CONFIG.updateInterval) {
            applyGrowth(GAME_CONFIG.updateInterval);
            accumulatedTime -= GAME_CONFIG.updateInterval;
        }

        if (canTriggerInfinity()) {
            triggerInfinity();
        }

        const anyUnlocked = checkAchievements();
        if (anyUnlocked) {
            renderAchievements();
        }

        checkNotifications();

        if (state.isInChallenge !== -1) {
            checkChallenge();
        }
    }

    renderMainUI();

    const statsView = document.querySelector('.page-view[data-page="stats"]');
    if (statsView && statsView.classList.contains('active')) {
        renderStats();
    }

    if (GAME_CONFIG.autoSaveInterval > 0) {
        autoSaveTimer += delta;
        if (autoSaveTimer >= GAME_CONFIG.autoSaveInterval) {
            saveGame();
            autoSaveTimer = 0;
        }
    }

    renderNotifications();

    requestAnimationFrame(gameLoop);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
