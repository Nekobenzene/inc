// notification.js

const notificationManager = {
    activeNotifications: [],
    maxVisible: 3,
    lastRenderKey: '',

    push(notification) {
        const now = Date.now();
        state.notificationQueue.push({
            id: notification.id,
            title: notification.title || '提示',
            message: notification.message || '',
            type: notification.type || 'default',
            duration: notification.duration || 3,
            createdAt: now,
            expiresAt: now + (notification.duration || 3) * 1000,
            isExiting: false,
            removeAt: null,
        });
    },

    markShown(id) {
        state.notificationHistory[id] = true;
    },

    hasShown(id) {
        return !!state.notificationHistory[id];
    },

    removeNow(id) {
        state.notificationQueue = state.notificationQueue.filter(n => n.id !== id);
        this.lastRenderKey = '';
    }
};

function checkNotifications() {
    if (!Array.isArray(NOTIFICATIONS)) return;

    for (const n of NOTIFICATIONS) {
        const alreadyShown = notificationManager.hasShown(n.id);

        if (n.once !== false && alreadyShown) continue;

        let passed = false;
        try {
            passed = !!n.condition(state);
        } catch (e) {
            console.error('通知条件检查失败:', n.id, e);
            continue;
        }

        if (passed) {
            notificationManager.push(n);

            if (n.once !== false) {
                notificationManager.markShown(n.id);
            }
        }
    }
}
