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

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const dismissed = localStorage.getItem('install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.remove('hidden');
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'install-btn' || e.target.closest('#install-btn')) {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(result => {
                deferredPrompt = null;
                const banner = document.getElementById('install-banner');
                if (banner) banner.classList.add('hidden');
            });
        }
    }
    if (e.target.id === 'install-dismiss' || e.target.closest('#install-dismiss')) {
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.add('hidden');
        localStorage.setItem('install_dismissed', Date.now().toString());
    }
});

window.addEventListener('appinstalled', () => {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('hidden');
    deferredPrompt = null;
});
