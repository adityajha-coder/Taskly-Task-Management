class TaskManager {
    constructor() {
        this.state = {
            tasks: [],
            projects: ['Work', 'Personal', 'Growth'],
            user: { xp: 0, level: 1, streak: 0, lastLogin: null },
            view: 'board',
            filter: 'all',
            sortBy: 'newest',
            darkMode: false
        };
        this.debounceTimer = null;
        try { this.state.darkMode = localStorage.getItem('theme') === 'dark'; } catch (e) { }
        this.draggedTaskId = null;
        this.tempSubtasks = [];
        this.tempAlarms = [];
        this.lastDeletedTask = null;
        this.sortables = [];
        this.init();
    }

    init() {
        this.loadState();
        this.applyTheme();
        this.checkStreak();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.postDOMInit());
        } else {
            this.postDOMInit();
        }
    }

    postDOMInit() {
        this.setupEventListeners();
        this.initSortable();
        this.renderProjects();
        this.setView(this.state.view);
        this.renderGamification();
        this.updateDateDisplay();
    }

    loadState() {
        try {
            const storedTasks = localStorage.getItem('tf_tasks');
            const storedUser = localStorage.getItem('tf_user');
            const storedProjects = localStorage.getItem('tf_projects');
            const storedView = localStorage.getItem('tf_view');
            const storedFilter = localStorage.getItem('tf_filter');
            if (storedTasks) this.state.tasks = JSON.parse(storedTasks);
            else this.state.tasks = [
                { id: '1', title: 'Welcome to Taskly', description: 'This is a **safe** and optimized task manager.', status: 'todo', priority: 'high', dueDate: new Date().toISOString().slice(0, 16), project: 'Personal', subtasks: [{ text: 'Try adding a task', completed: false }], createdAt: Date.now() }
            ];
            if (storedUser) this.state.user = JSON.parse(storedUser);
            if (storedProjects) this.state.projects = JSON.parse(storedProjects);
            if (storedView && ['board', 'list', 'dashboard'].includes(storedView)) this.state.view = storedView;
            if (storedFilter) this.state.filter = storedFilter;
        } catch (e) { }
    }

    saveState() {
        try {
            localStorage.setItem('tf_tasks', JSON.stringify(this.state.tasks));
            localStorage.setItem('tf_user', JSON.stringify(this.state.user));
            localStorage.setItem('tf_projects', JSON.stringify(this.state.projects));
        } catch (e) { }
    }

    initSortable() {
        if (!checkLibrary('Sortable')) return;
        const columns = ['col-todo', 'col-inprogress', 'col-done'];
        this.sortables.forEach(s => s.destroy());
        this.sortables = [];
        columns.forEach(colId => {
            const el = document.getElementById(colId);
            if (!el) return;
            this.sortables.push(new Sortable(el, {
                group: 'shared',
                animation: 200,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                delay: 50,
                delayOnTouchOnly: true,
                touchStartThreshold: 3,
                swapThreshold: 0.65,
                scroll: true,
                scrollSensitivity: 80,
                scrollSpeed: 12,
                bubbleScroll: true,
                fallbackOnBody: true,
                forceFallback: true,
                fallbackClass: 'sortable-fallback',
                fallbackTolerance: 3,
                onStart: (evt) => {
                    if (navigator.vibrate) navigator.vibrate(5);
                    evt.item.style.opacity = '0.9';
                    document.body.classList.add('is-dragging');
                },
                onEnd: (evt) => {
                    evt.item.style.opacity = '';
                    document.body.classList.remove('is-dragging');
                    const newStatus = evt.to.id.replace('col-', '').replace('inprogress', 'in-progress');
                    const oldStatus = evt.from.id.replace('col-', '').replace('inprogress', 'in-progress');
                    const taskId = evt.item.getAttribute('data-id');
                    if (newStatus !== oldStatus) {
                        this.updateTaskStatus(taskId, newStatus);
                        if (navigator.vibrate) navigator.vibrate(10);
                    }
                }
            }));
        });
    }

    setupEventListeners() {
        const searchInput = document.getElementById('search-input');
        const searchInputMobile = document.getElementById('search-input-mobile');
        const subtaskInput = document.getElementById('new-subtask-input');
        const handleSearch = (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => { this.render(e.target.value.toLowerCase()); }, 300);
        };
        if (searchInput) searchInput.addEventListener('input', handleSearch);
        if (searchInputMobile) searchInputMobile.addEventListener('input', handleSearch);
        if (subtaskInput) {
            subtaskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.addSubtaskFromInput(); }
            });
        }
        const modal = document.getElementById('task-modal');
        if (modal) { modal.addEventListener('click', (e) => { if (e.target === modal) this.closeModal(); }); }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) this.closeModal();
        });
    }

    updateDateDisplay() {
        const el = document.getElementById('date-display');
        if (el) {
            try { el.innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
            catch (e) { el.innerText = "Today"; }
        }
    }

    getProjectColor(name) {
        if (!name) return 'bg-gray-400';
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    renderProjects() {
        const container = document.getElementById('project-list');
        const select = document.getElementById('task-project');
        if (!container || !select) return;
        const escapedProjects = this.state.projects.map(p => escapeHtml(p));
        container.innerHTML = escapedProjects.map(p => `
            <div class="group flex items-center justify-between w-full text-left px-3 py-3 sm:py-2 rounded-lg gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer">
                <button onclick="app.setFilter('project:${p}')" class="flex-1 flex items-center gap-2 truncate text-left" aria-label="Filter by ${p}">
                    <span class="w-2 h-2 rounded-full ${this.getProjectColor(p)} shadow-sm"></span> ${p}
                </button>
                <button onclick="app.deleteProject('${p}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all transform scale-90 hover:scale-110 p-1.5 focus:opacity-100" aria-label="Delete ${p}">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>
        `).join('');
        select.innerHTML = escapedProjects.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    addProject() {
        let name = prompt("Enter project name:");
        if (name) {
            name = name.trim();
            if (name && !this.state.projects.includes(name)) {
                this.state.projects.push(name);
                this.saveState();
                this.renderProjects();
            }
        }
    }

    deleteProject(name) {
        if (confirm(`Delete project "${name}"?`)) {
            this.state.projects = this.state.projects.filter(p => p !== name);
            this.saveState();
            this.renderProjects();
            if (this.state.filter === `project:${name}`) this.setFilter('all');
            this.showToast('Project deleted', 'neutral');
        }
    }

    updateTaskStatus(id, status) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) {
            task.status = status;
            if (status === 'done') {
                this.addXP(10);
                this.triggerConfetti();
                if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
            }
            this.saveState();
            this.render();
        }
    }

    promptDelete(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (!task) return;
        if (confirm('Delete this task?')) {
            this.lastDeletedTask = task;
            this.state.tasks = this.state.tasks.filter(t => t.id !== id);
            try { if (window.alarmManager) alarmManager.deleteAlarmsForTask(id); } catch (e) { }
            this.saveState();
            this.render();
            if (navigator.vibrate) navigator.vibrate(20);
            this.showToastWithAction('Task deleted', 'Undo', () => {
                this.state.tasks.push(this.lastDeletedTask);
                this.saveState();
                this.render();
                this.lastDeletedTask = null;
            });
        }
    }

    exportData() {
        const headers = ["Title", "Status", "Priority", "Project", "Due Date", "Description"];
        const rows = this.state.tasks.map(t => [
            `"${(t.title || '').replace(/"/g, '""')}"`, t.status, t.priority, t.project || '', t.dueDate || '',
            `"${(t.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Taskly_Export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showToast('Tasks exported to CSV', 'success');
    }

    getFilteredTasks(term) {
        let tasks = [...this.state.tasks];
        if (term) tasks = tasks.filter(t => t.title.toLowerCase().includes(term) || (t.description && t.description.toLowerCase().includes(term)));
        if (this.state.filter.startsWith('project:')) {
            tasks = tasks.filter(t => t.project === this.state.filter.split(':')[1]);
        } else {
            const today = new Date().toISOString().split('T')[0];
            if (this.state.filter === 'today') tasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
        }
        const sort = this.state.sortBy;
        tasks.sort((a, b) => {
            if (sort === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
            if (sort === 'priority') {
                const map = { high: 3, medium: 2, low: 1 };
                return (map[b.priority?.toLowerCase()] || 0) - (map[a.priority?.toLowerCase()] || 0);
            }
            if (sort === 'dueDate') {
                return (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
            }
            return 0;
        });
        return tasks;
    }

    setFilter(f) {
        this.state.filter = f;
        try { localStorage.setItem('tf_filter', f); } catch (e) { }
        if (this.state.view === 'dashboard') {
            this.setView('board');
            return;
        }
        document.querySelectorAll('#sidebar button[id^="nav-"]').forEach(b => {
            b.classList.remove('bg-white/60', 'dark:bg-white/10', 'text-brand-600', 'dark:text-white');
            b.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        if (!f.startsWith('project:')) {
            const btn = document.getElementById(`nav-${f}`);
            if (btn) {
                btn.classList.add('bg-white/60', 'dark:bg-white/10', 'text-brand-600', 'dark:text-white');
                btn.classList.remove('text-slate-600', 'dark:text-slate-400');
            }
        }
        this.render();
        if (window.innerWidth < 640) document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    setView(v) {
        this.state.view = v;
        try { localStorage.setItem('tf_view', v); } catch (e) { }
        const active = 'w-10 h-8 sm:w-8 sm:h-7 rounded-md bg-white dark:bg-white/10 shadow-sm transition-all text-slate-900 dark:text-white flex items-center justify-center';
        const inactive = 'w-10 h-8 sm:w-8 sm:h-7 rounded-md text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center';
        const boardBtn = document.getElementById('view-board-btn');
        const listBtn = document.getElementById('view-list-btn');
        if (boardBtn) boardBtn.className = v === 'board' ? active : inactive;
        if (listBtn) listBtn.className = v === 'list' ? active : inactive;
        this.render();
        if (v === 'dashboard') {
            this.renderDashboard();
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.innerText = 'Dashboard';
        } else {
            if (v === 'board') this.initSortable();
            const titleEl = document.getElementById('page-title');
            if (titleEl) {
                if (this.state.filter === 'all') titleEl.innerText = 'All Tasks';
                else if (this.state.filter === 'today') titleEl.innerText = 'Today';
                else if (this.state.filter.startsWith('project:')) titleEl.innerText = this.state.filter.split(':')[1];
            }
        }
        if (window.innerWidth < 640) document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    sortTasks(val) {
        this.state.sortBy = val;
        this.render(document.getElementById('search-input')?.value || '');
        if (this.state.view === 'board') this.initSortable();
    }

    toggleTheme() {
        this.state.darkMode = !this.state.darkMode;
        try { localStorage.setItem('theme', this.state.darkMode ? 'dark' : 'light'); } catch (e) { }
        this.applyTheme();
    }

    applyTheme() {
        if (this.state.darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }

    formatDate(d) {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const now = new Date();
        if (date.toDateString() === now.toDateString()) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    isOverdue(task) {
        if (task.status === 'done' || !task.dueDate) return false;
        return new Date(task.dueDate) < new Date();
    }

    showToast(msg, type = 'success') { this.showToastWithAction(msg, null, null, type); }

    showToastWithAction(msg, actionText, actionCallback, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const colors = type === 'success' ? 'bg-emerald-600/90' : (type === 'error' ? 'bg-red-600/90' : 'bg-slate-800/90');
        const toastId = 'toast-' + Date.now() + Math.random().toString(36).slice(2, 5);
        let btnHtml = '';
        if (actionText) btnHtml = `<button data-toast-action="${toastId}" class="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-colors">${actionText}</button>`;
        toast.className = `${colors} text-white px-4 py-3 rounded-xl shadow-glass flex items-center justify-between transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto min-w-[280px] backdrop-blur-md`;
        toast.innerHTML = `<div class="flex items-center gap-3"><i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span class="text-xs font-medium">${msg}</span></div>${btnHtml}`;
        container.appendChild(toast);
        if (actionCallback && actionText) {
            const btn = toast.querySelector(`[data-toast-action="${toastId}"]`);
            if (btn) btn.onclick = () => { actionCallback(); toast.remove(); };
        }
        requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-x-10'); setTimeout(() => toast.remove(), 300); }, 4000);
    }

    toggleMobileMenu() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }

    closeMobileMenuOutside() {
        const sb = document.getElementById('sidebar');
        if (window.innerWidth < 640 && !sb.classList.contains('-translate-x-full')) sb.classList.add('-translate-x-full');
    }
}

Object.assign(TaskManager.prototype, DashboardMixin, GamificationMixin, ModalMixin, RenderMixin);
