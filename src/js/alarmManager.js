class AlarmManager {
    constructor() {
        this.storageKey = 'tf_alarms';
        this.alarms = [];
        this.timers = new Map();
        this.init();
    }

    init() {
        try { const raw = localStorage.getItem(this.storageKey); if (raw) this.alarms = JSON.parse(raw); } catch(e) { this.alarms = []; }
        this.renderList();
        this.scheduleAll();
        if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(()=>{});
    }

    save() { try { localStorage.setItem(this.storageKey, JSON.stringify(this.alarms)); } catch(e){} }

    renderList() { try { if (typeof app !== 'undefined' && app && typeof app.render === 'function') app.render(); } catch (e) {} }

    updateAlarmForTask(taskId, alarmObj) {
        this.alarms = this.alarms.filter(a => { if (a.taskId === taskId) { this.clearTimer(a.id); return false; } return true; });
        if (alarmObj && alarmObj.time) {
            const alarm = { id: Date.now().toString() + Math.random().toString(36).slice(2,6), time: alarmObj.time, label: '', sound: alarmObj.sound || 'beep', enabled: (new Date(alarmObj.time).getTime() > Date.now()), taskId };
            this.alarms.push(alarm);
            if (alarm.enabled) this.scheduleAlarm(alarm);
        }
        this.save();
        this.renderList();
    }

    deleteAlarmsForTask(taskId) {
        this.alarms.forEach(a => { if (a.taskId === taskId) this.clearTimer(a.id); });
        this.alarms = this.alarms.filter(a => a.taskId !== taskId);
        this.save();
        this.renderList();
    }

    scheduleAll() { this.clearTimers(); const now = Date.now(); this.alarms.forEach(a => { if (a.enabled) this.scheduleAlarm(a, now); }); }

    scheduleAlarm(alarm) {
        try {
            const ms = new Date(alarm.time).getTime() - Date.now();
            if (ms <= 0) return;
            this.timers.set(alarm.id, setTimeout(() => this.trigger(alarm.id), ms));
        } catch(e) { console.error(e); }
    }

    trigger(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if(!alarm) return;
        this.playSound(alarm.sound || 'beep');
        const tt = alarm.taskId ? (app.state.tasks.find(t => t.id === alarm.taskId)?.title || '') : '';
        const nt = alarm.label || tt || 'Alarm';
        const nb = tt ? `${tt} — ${this.formatTime(alarm.time)}` : this.formatTime(alarm.time);
        if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(nt, { body: nb, tag: 'taskly-alarm' }); } catch(e){} }
        app.showToast(nt, 'success');
        alarm.enabled = false;
        this.save();
        this.renderList();
    }

    playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(880, ctx.currentTime);
            g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
            o.connect(g); g.connect(ctx.destination); o.start();
            o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.6);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);
            setTimeout(() => { try { o.stop(); ctx.close(); } catch(e){} }, 2400);
        } catch(e) { console.warn(e); }
    }

    playSound(name) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (name === 'chime') {
                const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator(); const g = ctx.createGain();
                o1.frequency.setValueAtTime(880, ctx.currentTime); o2.frequency.setValueAtTime(1320, ctx.currentTime);
                g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
                o1.connect(g); o2.connect(g); g.connect(ctx.destination); o1.start(); o2.start();
                o1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2); o2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 1.2);
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
                setTimeout(()=>{ try{ o1.stop(); o2.stop(); ctx.close(); }catch(e){} }, 2200);
            } else if (name === 'bell') {
                const o = ctx.createOscillator(); const g = ctx.createGain();
                o.type = 'triangle'; o.frequency.setValueAtTime(1200, ctx.currentTime);
                g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.01);
                o.connect(g); g.connect(ctx.destination); o.start();
                o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 2.2); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.0);
                setTimeout(()=>{ try{ o.stop(); ctx.close(); }catch(e){} }, 3200);
            } else { this.playBeep(); }
        } catch(e) { console.warn(e); }
    }

    clearTimer(id) { const t = this.timers.get(id); if(t) { clearTimeout(t); this.timers.delete(id); } }
    clearTimers() { this.timers.forEach(t => clearTimeout(t)); this.timers.clear(); }
    formatTime(t) { try { return new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch(e){ return t; } }
}