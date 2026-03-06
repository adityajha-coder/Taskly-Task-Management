(function () {
    const now = new Date();

    function updateClock() {
        const d = new Date();
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        document.getElementById('widget-time').textContent = `${h12}:${m}`;
        document.getElementById('widget-date').textContent = `${ampm} · ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
    }
    updateClock();
    setInterval(updateClock, 15000);

    const hour = now.getHours();
    let greet = 'Good evening';
    if (hour < 12) greet = 'Good morning';
    else if (hour < 17) greet = 'Good afternoon';
    document.getElementById('greeting').textContent = greet + ' ☀️';

    let tasks = [];
    let user = { level: 1, streak: 0, xp: 0 };
    try {
        const storedTasks = localStorage.getItem('tf_tasks');
        const storedUser = localStorage.getItem('tf_user');
        if (storedTasks) tasks = JSON.parse(storedTasks);
        if (storedUser) user = JSON.parse(storedUser);
    } catch (e) { }

    const total = tasks.length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => {
        if (t.status === 'done' || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
    }).length;

    renderStats(total, todo, inProgress, overdue);
    renderProgress(total, done, user);
    renderDeadlines(tasks, now);

    function renderStats(total, todo, inProgress, overdue) {
        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-tile glass-card blue">
                <div class="stat-value">${total}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-tile glass-card amber">
                <div class="stat-value">${todo}</div>
                <div class="stat-label">To Do</div>
            </div>
            <div class="stat-tile glass-card violet">
                <div class="stat-value">${inProgress}</div>
                <div class="stat-label">Active</div>
            </div>
            <div class="stat-tile glass-card red ${overdue > 0 ? 'has-overdue' : ''}">
                <div class="stat-value">${overdue}</div>
                <div class="stat-label">Overdue</div>
            </div>
        `;
    }

    function renderProgress(total, done, user) {
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const radius = 26;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (pct / 100) * circ;

        let gradId;
        if (pct >= 75) { gradId = '<stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#34d399"/>'; }
        else if (pct >= 40) { gradId = '<stop offset="0%" stop-color="#0ea5e9"/><stop offset="100%" stop-color="#06b6d4"/>'; }
        else { gradId = '<stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#fbbf24"/>'; }

        let motivationMsg = '';
        if (total === 0) motivationMsg = 'Add your first task to get started!';
        else if (pct === 100) motivationMsg = '🎉 All tasks completed. Amazing!';
        else if (pct >= 75) motivationMsg = '🚀 Almost there, keep going!';
        else if (pct >= 50) motivationMsg = '💪 Great progress, keep it up!';
        else if (pct >= 25) motivationMsg = '🌱 Good start, stay focused!';
        else if (done > 0) motivationMsg = '✨ You\'ve started, keep the momentum!';
        else motivationMsg = '🎯 Start knocking out those tasks!';

        document.getElementById('progress-section').innerHTML = `
            <div class="ring-container">
                <svg viewBox="0 0 60 60">
                    <defs>
                        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            ${gradId}
                        </linearGradient>
                    </defs>
                    <circle class="ring-bg" cx="30" cy="30" r="${radius}"/>
                    <circle class="ring-progress" cx="30" cy="30" r="${radius}"
                        stroke="url(#ring-gradient)" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
                        id="progress-ring"/>
                </svg>
                <div class="ring-label">${pct}%</div>
            </div>
            <div class="progress-info">
                <h3>${done} of ${total} done</h3>
                <div class="progress-sub">
                    <span>Lvl ${user.level || 1}</span>
                    <span class="divider"></span>
                    <span>🔥 ${user.streak || 0} streak</span>
                    <span class="divider"></span>
                    <span>⚡ ${user.xp || 0} XP</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="progress-bar" style="width: 0%"></div>
                </div>
                <div class="motivation-text">${motivationMsg}</div>
            </div>
        `;

        requestAnimationFrame(() => {
            setTimeout(() => {
                const ring = document.getElementById('progress-ring');
                const bar = document.getElementById('progress-bar');
                if (ring) ring.style.strokeDashoffset = offset;
                if (bar) bar.style.width = pct + '%';
            }, 200);
        });
    }

    function renderDeadlines(tasks, now) {
        const upcoming = tasks
            .filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) > now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 4);

        document.getElementById('deadline-count').textContent = upcoming.length;

        const listEl = document.getElementById('deadlines-list');
        if (upcoming.length === 0) {
            listEl.innerHTML = `
                <div class="empty-deadlines">
                    <span class="empty-icon">🎯</span>
                    No upcoming deadlines — you're all clear!
                </div>`;
        } else {
            listEl.innerHTML = upcoming.map(t => {
                const due = new Date(t.dueDate);
                const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                let badge, badgeClass;
                if (diff <= 1) { badge = 'Today'; badgeClass = 'urgent'; }
                else if (diff <= 3) { badge = diff + 'd left'; badgeClass = 'soon'; }
                else { badge = diff + 'd left'; badgeClass = 'normal'; }

                const pIcon = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🔵';
                const pClass = t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'medium' : 'low';
                const timeStr = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return `
                    <div class="deadline-row">
                        <div class="deadline-indicator ${pClass}">${pIcon}</div>
                        <div class="deadline-text">
                            <h4>${escapeHtml(t.title)}</h4>
                            <div class="deadline-meta">
                                <span>${timeStr}</span>
                                ${t.project ? `<span class="meta-dot"></span><span>${escapeHtml(t.project)}</span>` : ''}
                            </div>
                        </div>
                        <span class="deadline-badge ${badgeClass}">${badge}</span>
                    </div>
                `;
            }).join('');
        }
    }

    function escapeHtml(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    window.handleQuickAdd = function (e) {
        e.preventDefault();
        const input = document.getElementById('quick-add-input');
        const title = input.value.trim();
        if (!title) return false;

        const newTask = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            title: title,
            description: '',
            status: 'todo',
            priority: 'medium',
            project: '',
            dueDate: '',
            subtasks: [],
            createdAt: new Date().toISOString()
        };

        try {
            let currentTasks = [];
            const stored = localStorage.getItem('tf_tasks');
            if (stored) currentTasks = JSON.parse(stored);
            currentTasks.push(newTask);
            localStorage.setItem('tf_tasks', JSON.stringify(currentTasks));

            input.value = '';
            showToast('✓ Task added!');

            setTimeout(() => location.reload(), 800);
        } catch (err) {
            showToast('⚠ Could not save task');
        }

        return false;
    };

    function showToast(msg) {
        const toast = document.getElementById('widget-toast');
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }
})();
