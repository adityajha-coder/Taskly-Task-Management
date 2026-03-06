const app = new TaskManager();
const alarmManager = new AlarmManager();

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof alarmManager !== 'undefined' && app && app.state.tasks) {
            app.state.tasks.forEach(t => {
                if (t.alarm) alarmManager.updateAlarmForTask(t.id, t.alarm);
            });
        }
    } catch (e) { }

    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'new') setTimeout(() => app.openModal(), 300);
        if (params.get('view') === 'dashboard') setTimeout(() => app.setView('dashboard'), 100);
        if (params.toString()) window.history.replaceState({}, '', window.location.pathname);
    } catch (e) { }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
        setInterval(() => reg.update(), 30 * 60 * 1000);
    }).catch(() => { });
}
