const app = new TaskManager();
const alarmManager = new AlarmManager();

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (typeof alarmManager !== 'undefined' && app && app.state.tasks) {
            app.state.tasks.forEach(t => { if (t.alarm) alarmManager.updateAlarmForTask(t.id, t.alarm); });
        }
    } catch(e) { console.warn(e); }
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}