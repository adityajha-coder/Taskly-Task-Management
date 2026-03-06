const DashboardMixin = {
    renderDashboard() {
        this._renderStatsWidget();
        this._renderCompletionRing();
        this._renderPriorityChart();
        this._renderProjectChart();
        this._renderHeatmap();
        this._renderDeadlines();
    },

    _renderStatsWidget() {
        const tasks = this.state.tasks;
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'done').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const overdue = tasks.filter(t => this.isOverdue(t)).length;

        const stats = [
            { label: 'Total Tasks', value: total, icon: 'fa-layer-group', gradient: 'from-sky-400 to-blue-500' },
            { label: 'In Progress', value: inProgress, icon: 'fa-spinner', gradient: 'from-amber-400 to-orange-500' },
            { label: 'Completed', value: done, icon: 'fa-circle-check', gradient: 'from-emerald-400 to-green-500' },
            { label: 'Overdue', value: overdue, icon: 'fa-triangle-exclamation', gradient: 'from-red-400 to-rose-500' }
        ];

        const container = document.getElementById('stats-cards');
        if (!container) return;

        container.innerHTML = stats.map(s => `
            <div class="stat-card">
                <div class="stat-glow bg-gradient-to-br ${s.gradient}"></div>
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-[10px] shadow-md">
                        <i class="fa-solid ${s.icon}"></i>
                    </div>
                </div>
                <div class="stat-value text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">${s.value}</div>
                <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">${s.label}</div>
            </div>
        `).join('');
    },

    _renderCompletionRing() {
        const container = document.getElementById('completion-ring-container');
        if (!container) return;

        const tasks = this.state.tasks;
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'done').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percent / 100) * circumference;
        const trackColor = this.state.darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

        container.innerHTML = `
            <div class="relative">
                <svg width="160" height="160" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="45" fill="none" stroke="${trackColor}" stroke-width="10" />
                    <circle class="ring-progress" cx="60" cy="60" r="45" fill="none"
                        stroke="url(#ringGradient)" stroke-width="10" stroke-linecap="round"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        transform="rotate(-90 60 60)" />
                    <defs>
                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#10b981" />
                            <stop offset="100%" stop-color="#0ea5e9" />
                        </linearGradient>
                    </defs>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-3xl font-extrabold text-slate-800 dark:text-white">${percent}%</span>
                    <span class="text-[10px] font-medium text-slate-400 mt-0.5">${done} of ${total}</span>
                </div>
            </div>
        `;
    },

    _renderPriorityChart() {
        const container = document.getElementById('priority-chart');
        if (!container) return;

        const tasks = this.state.tasks;
        const total = tasks.length || 1;
        const priorities = [
            { label: 'High', count: tasks.filter(t => t.priority === 'high').length, color: 'bg-red-500', track: 'bg-red-100 dark:bg-red-900/20' },
            { label: 'Medium', count: tasks.filter(t => t.priority === 'medium').length, color: 'bg-amber-500', track: 'bg-amber-100 dark:bg-amber-900/20' },
            { label: 'Low', count: tasks.filter(t => t.priority === 'low').length, color: 'bg-slate-400', track: 'bg-slate-100 dark:bg-white/5' }
        ];

        container.innerHTML = priorities.map(p => {
            const pct = Math.round((p.count / total) * 100);
            return `
                <div>
                    <div class="flex justify-between items-center mb-1.5">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full ${p.color}"></span>
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">${p.label}</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">${p.count} <span class="text-slate-300 dark:text-slate-600">(${pct}%)</span></span>
                    </div>
                    <div class="w-full h-2 rounded-full ${p.track}">
                        <div class="bar-fill h-2 rounded-full ${p.color}" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    _renderProjectChart() {
        const container = document.getElementById('project-chart');
        if (!container) return;

        const tasks = this.state.tasks;
        const total = tasks.length || 1;
        const projectCounts = {};
        tasks.forEach(t => {
            const p = t.project || 'General';
            projectCounts[p] = (projectCounts[p] || 0) + 1;
        });

        const sorted = Object.entries(projectCounts).sort((a, b) => b[1] - a[1]);
        const projectColors = {
            'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-amber-500': '#f59e0b',
            'bg-green-500': '#22c55e', 'bg-emerald-500': '#10b981', 'bg-teal-500': '#14b8a6',
            'bg-cyan-500': '#06b6d4', 'bg-sky-500': '#0ea5e9', 'bg-blue-500': '#3b82f6',
            'bg-indigo-500': '#6366f1', 'bg-violet-500': '#8b5cf6', 'bg-purple-500': '#a855f7',
            'bg-fuchsia-500': '#d946ef', 'bg-pink-500': '#ec4899', 'bg-rose-500': '#f43f5e'
        };

        if (sorted.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No projects yet</p>';
            return;
        }

        container.innerHTML = sorted.map(([name, count]) => {
            const pct = Math.round((count / total) * 100);
            const twColor = this.getProjectColor(name);
            const hexColor = projectColors[twColor] || '#94a3b8';
            return `
                <div>
                    <div class="flex justify-between items-center mb-1.5">
                        <div class="flex items-center gap-2">
                            <span class="w-2.5 h-2.5 rounded-full" style="background:${hexColor}"></span>
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">${escapeHtml(name)}</span>
                        </div>
                        <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400">${count} <span class="text-slate-300 dark:text-slate-600">(${pct}%)</span></span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5">
                        <div class="bar-fill h-2 rounded-full" style="width: ${pct}%; background: ${hexColor}"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    _renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        const activityMap = this._getActivityData();
        const weeks = 12;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(today);
        start.setDate(start.getDate() - (weeks * 7) + 1);
        start.setDate(start.getDate() - start.getDay());

        const dayLabels = ['', 'M', '', 'W', '', 'F', ''];
        const isDark = this.state.darkMode;

        let html = '<div class="flex gap-1">';
        html += '<div class="flex flex-col gap-1 mr-1">';
        dayLabels.forEach(l => {
            html += `<div class="w-3 h-3 flex items-center justify-center text-[8px] text-slate-400 font-medium">${l}</div>`;
        });
        html += '</div>';

        for (let w = 0; w < weeks; w++) {
            html += '<div class="flex flex-col gap-1">';
            for (let d = 0; d < 7; d++) {
                const cellDate = new Date(start);
                cellDate.setDate(cellDate.getDate() + w * 7 + d);
                const key = cellDate.toISOString().split('T')[0];
                const count = activityMap[key] || 0;
                const isFuture = cellDate > today;

                let colorClass;
                if (isFuture) colorClass = isDark ? 'bg-white/[0.02]' : 'bg-slate-50';
                else if (count === 0) colorClass = isDark ? 'bg-white/5' : 'bg-slate-100';
                else if (count === 1) colorClass = isDark ? 'bg-emerald-900/40' : 'bg-emerald-200';
                else if (count <= 3) colorClass = isDark ? 'bg-emerald-600/60' : 'bg-emerald-400';
                else colorClass = isDark ? 'bg-emerald-500' : 'bg-emerald-600';

                const dateStr = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const tooltip = isFuture ? '' : `title="${dateStr}: ${count} task${count !== 1 ? 's' : ''}"`;
                html += `<div class="heatmap-cell w-3 h-3 ${colorClass}" ${tooltip}></div>`;
            }
            html += '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    },

    _getActivityData() {
        const map = {};
        this.state.tasks.forEach(t => {
            if (t.createdAt) {
                const key = new Date(t.createdAt).toISOString().split('T')[0];
                map[key] = (map[key] || 0) + 1;
            }
        });
        try {
            const stored = localStorage.getItem('tf_activity');
            if (stored) {
                const parsed = JSON.parse(stored);
                Object.entries(parsed).forEach(([k, v]) => { map[k] = (map[k] || 0) + v; });
            }
        } catch (e) { }
        return map;
    },

    _recordActivity() {
        const today = new Date().toISOString().split('T')[0];
        try {
            let data = {};
            const stored = localStorage.getItem('tf_activity');
            if (stored) data = JSON.parse(stored);
            data[today] = (data[today] || 0) + 1;
            localStorage.setItem('tf_activity', JSON.stringify(data));
        } catch (e) { }
    },

    _renderDeadlines() {
        const container = document.getElementById('deadlines-list');
        if (!container) return;

        const now = new Date();
        const upcoming = this.state.tasks
            .filter(t => t.dueDate && t.status !== 'done' && new Date(t.dueDate) > now)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8 text-center opacity-50">
                    <i class="fa-solid fa-calendar-check text-2xl text-slate-300 mb-2"></i>
                    <p class="text-xs text-slate-400">No upcoming deadlines</p>
                </div>`;
            return;
        }

        container.innerHTML = upcoming.map(t => {
            const due = new Date(t.dueDate);
            const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
            let urgency, urgencyColor;
            if (diff <= 1) { urgency = 'Today'; urgencyColor = 'text-red-500 bg-red-50 dark:bg-red-900/20'; }
            else if (diff <= 3) { urgency = `${diff}d`; urgencyColor = 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'; }
            else { urgency = `${diff}d`; urgencyColor = 'text-slate-500 bg-slate-100 dark:bg-white/5'; }

            const priorityDot = t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400';

            return `
                <div class="deadline-item">
                    <span class="w-2 h-2 rounded-full ${priorityDot} shrink-0"></span>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">${escapeHtml(t.title)}</p>
                        <p class="text-[10px] text-slate-400">${this.formatDate(t.dueDate)}</p>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-1 rounded-lg ${urgencyColor} shrink-0">${urgency}</span>
                </div>
            `;
        }).join('');
    }
};
