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
        try {
            this.state.darkMode = localStorage.getItem('theme') === 'dark';
        } catch(e) { console.warn("LocalStorage access denied"); }
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
        if(document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.postDOMInit());
        } else {
            this.postDOMInit();
        }
    }

    postDOMInit() {
        this.setupEventListeners();
        this.initSortable();
        this.renderProjects();
        this.render();
        this.renderGamification();
        this.updateDateDisplay();
    }

    loadState() {
        try {
            const storedTasks = localStorage.getItem('tf_tasks');
            const storedUser = localStorage.getItem('tf_user');
            const storedProjects = localStorage.getItem('tf_projects');
            if (storedTasks) this.state.tasks = JSON.parse(storedTasks);
            else this.state.tasks = [{ id: '1', title: 'Welcome to Taskly', description: 'This is a **safe** and optimized task manager.', status: 'todo', priority: 'high', dueDate: new Date().toISOString().slice(0,16), project: 'Personal', subtasks: [{text: 'Try adding a task', completed: false}], createdAt: Date.now() }];
            if (storedUser) this.state.user = JSON.parse(storedUser);
            if (storedProjects) this.state.projects = JSON.parse(storedProjects);
        } catch(e) { console.error("Error loading state", e); }
    }

    saveState() {
        try {
            localStorage.setItem('tf_tasks', JSON.stringify(this.state.tasks));
            localStorage.setItem('tf_user', JSON.stringify(this.state.user));
            localStorage.setItem('tf_projects', JSON.stringify(this.state.projects));
        } catch(e) { console.warn("Saving failed"); }
    }

    initSortable() {
        if(!hasSortable) return;
        const columns = ['col-todo', 'col-inprogress', 'col-done'];
        this.sortables.forEach(s => s.destroy());
        this.sortables = [];
        columns.forEach(colId => {
            const el = document.getElementById(colId);
            if(!el) return;
            this.sortables.push(new Sortable(el, {
                group: 'shared',
                animation: 150,
                easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                delay: 120,
                delayOnTouchOnly: true,
                swapThreshold: 0.65,
                scroll: true,
                scrollSensitivity: 60,
                scrollSpeed: 10,
                onStart: () => { if (navigator.vibrate) navigator.vibrate(5); },
                onEnd: (evt) => {
                    const newStatus = evt.to.id.replace('col-', '').replace('inprogress', 'in-progress');
                    const oldStatus = evt.from.id.replace('col-', '').replace('inprogress', 'in-progress');
                    const taskId = evt.item.getAttribute('data-id');
                    if (newStatus !== oldStatus) {
                        this.updateTaskStatus(taskId, newStatus);
                        if(navigator.vibrate) navigator.vibrate(10);
                    }
                }
            }));
        });
    }

    setupEventListeners() {
        const handleSearch = (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.render(e.target.value.toLowerCase()), 300);
        };
        ['search-input', 'search-input-mobile'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', handleSearch);
        });
        const subInput = document.getElementById('new-subtask-input');
        if(subInput) subInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.addSubtaskFromInput(); }});
        const modal = document.getElementById('task-modal');
        if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) this.closeModal(); });
    }

    updateDateDisplay() {
        const el = document.getElementById('date-display');
        if(el) {
            try { el.innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
            catch(e) { el.innerText = "Today"; }
        }
    }

    checkStreak() {
        const today = new Date().toDateString();
        const last = this.state.user.lastLogin;
        if (last !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (last === yesterday.toDateString()) this.state.user.streak++;
            else if (last) { if(new Date(last) < yesterday) this.state.user.streak = 1; }
            else this.state.user.streak = 1;
            this.state.user.lastLogin = today;
            this.saveState();
        }
    }

    addXP(amount) {
        this.state.user.xp += amount;
        const nextLevel = this.state.user.level * 100;
        if (this.state.user.xp >= nextLevel) {
            this.state.user.level++;
            this.state.user.xp -= nextLevel;
            this.showToast(`Level Up! You are now Level ${this.state.user.level} 🎉`, 'success');
            this.triggerConfetti();
        }
        this.saveState();
        this.renderGamification();
    }

    renderGamification() {
        const levelEl = document.getElementById('user-level');
        const streakEl = document.getElementById('streak-count');
        const barEl = document.getElementById('xp-bar');
        const currentXpEl = document.getElementById('current-xp');
        const nextLevelXpEl = document.getElementById('next-level-xp');
        const nextLevelXP = this.state.user.level * 100;
        if(levelEl) levelEl.innerText = this.state.user.level;
        if(streakEl) streakEl.innerText = this.state.user.streak;
        if(barEl) barEl.style.width = `${Math.min(100, Math.round((this.state.user.xp / nextLevelXP) * 100))}%`;
        if (currentXpEl) currentXpEl.innerText = `${this.state.user.xp} XP`;
        if (nextLevelXpEl) nextLevelXpEl.innerText = `${nextLevelXP} XP`;
    }

    getProjectColor(name) {
        if(!name) return 'bg-gray-400';
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    renderProjects() {
        const container = document.getElementById('project-list');
        const select = document.getElementById('task-project');
        if(!container || !select) return;
        container.innerHTML = this.state.projects.map(p => {
            const ep = escapeHtml(p);
            return `
            <div class="group flex items-center justify-between w-full text-left px-3 py-3 sm:py-2 rounded-lg gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer">
                <button onclick="app.setFilter('project:${ep}')" class="flex-1 flex items-center gap-2 truncate text-left">
                    <span class="w-2 h-2 rounded-full ${this.getProjectColor(p)} shadow-sm"></span> ${ep}
                </button>
                <button onclick="app.deleteProject('${ep}')" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all transform scale-90 hover:scale-110 p-1.5 focus:opacity-100">
                    <i class="fa-solid fa-times"></i>
                </button>
            </div>`;
        }).join('');
        select.innerHTML = this.state.projects.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
    }

    addProject() {
        let name = prompt("Enter project name:");
        if(name) {
            name = name.trim();
            if(name && !this.state.projects.includes(name)) {
                this.state.projects.push(name);
                this.saveState();
                this.renderProjects();
            }
        }
    }

    deleteProject(name) {
        if(confirm(`Delete project "${name}"?`)) {
            this.state.projects = this.state.projects.filter(p => p !== name);
            this.saveState();
            this.renderProjects();
            if(this.state.filter === `project:${name}`) this.setFilter('all');
            this.showToast(`Project deleted`, 'neutral');
        }
    }

    updateTaskStatus(id, status) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) {
            task.status = status;
            if(status === 'done') { this.addXP(10); this.triggerConfetti(); if(navigator.vibrate) navigator.vibrate([10, 50, 10]); }
            this.saveState();
            this.render();
        }
    }

    promptDelete(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if(!task) return;
        if(confirm('Delete this task?')) {
            this.lastDeletedTask = task;
            this.state.tasks = this.state.tasks.filter(t => t.id !== id);
            try { if (window.alarmManager) alarmManager.deleteAlarmsForTask(id); } catch(e) {}
            this.saveState();
            this.render();
            if(navigator.vibrate) navigator.vibrate(20);
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
            `"${(t.title || '').replace(/"/g, '""')}"`, t.status, t.priority, t.project, t.dueDate || '', `"${(t.description || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Taskly_Export_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.showToast('Tasks exported to CSV', 'success');
    }

    openModal(status = 'todo', taskId = null) {
        const modal = document.getElementById('task-modal');
        document.body.style.overflow = 'hidden';
        modal.classList.remove('hidden');
        document.getElementById('task-form').reset();
        this.tempSubtasks = [];
        if (taskId) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if(task) {
                document.getElementById('modal-title').innerText = 'Edit Task';
                document.getElementById('task-id').value = task.id;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-desc').value = task.description;
                document.getElementById('task-status').value = task.status;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-date').value = task.dueDate || '';
                const ps = document.getElementById('task-project');
                if(ps) ps.value = task.project || this.state.projects[0];
                const at = document.getElementById('task-alarm-time');
                const as = document.getElementById('task-alarm-sound');
                if (at && as && task.alarm) { at.value = task.alarm.time || ''; as.value = task.alarm.sound || 'beep'; }
                this.tempSubtasks = [...(task.subtasks || [])];
            }
        } else {
            document.getElementById('modal-title').innerText = 'Create Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = status;
            document.getElementById('task-priority').value = 'medium';
        }
        this.renderSubtaskList();
        if(window.innerWidth > 640) requestAnimationFrame(() => document.getElementById('task-title').focus());
    }

    closeModal() {
        document.getElementById('task-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.tempSubtasks = [];
    }

    addSubtaskFromInput() {
        const input = document.getElementById('new-subtask-input');
        const text = input.value.trim();
        if (text) {
            this.tempSubtasks.push({ text, completed: false });
            input.value = '';
            this.renderSubtaskList();
            input.focus();
        }
    }

    toggleSubtaskInModal(index) { this.tempSubtasks[index].completed = !this.tempSubtasks[index].completed; this.renderSubtaskList(); }

    deleteSubtaskInModal(index) { this.tempSubtasks.splice(index, 1); this.renderSubtaskList(); }

    renderSubtaskList() {
        const list = document.getElementById('subtask-list');
        list.innerHTML = this.tempSubtasks.map((st, index) => `
            <li class="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5 group hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="app.toggleSubtaskInModal(${index})" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer">
                <span class="flex-1 text-xs font-medium ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${escapeHtml(st.text)}</span>
                <button type="button" onclick="app.deleteSubtaskInModal(${index})" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><i class="fa-solid fa-times"></i></button>
            </li>
        `).join('');
    }

    saveTask(e) {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value.trim();
        if(!title) { this.showToast("Title is required", "error"); return; }
        const taskData = {
            title, 
            description: document.getElementById('task-desc').value, 
            status: document.getElementById('task-status').value, 
            priority: document.getElementById('task-priority').value, 
            dueDate: document.getElementById('task-date').value, 
            project: document.getElementById('task-project').value,
            subtasks: this.tempSubtasks,
            alarm: (document.getElementById('task-alarm-time').value && document.getElementById('task-alarm-sound').value) ? { time: document.getElementById('task-alarm-time').value, sound: document.getElementById('task-alarm-sound').value } : null
        };
        let taskId = id;
        if (id) {
            const index = this.state.tasks.findIndex(t => t.id === id);
            this.state.tasks[index] = { ...this.state.tasks[index], ...taskData };
        } else {
            taskId = Date.now().toString();
            this.state.tasks.push({ id: taskId, ...taskData, createdAt: Date.now() });
            this.addXP(5);
        }
        this.saveState();
        try { if (typeof alarmManager !== 'undefined') alarmManager.updateAlarmForTask(taskId, taskData.alarm); } catch(e) {}
        this.closeModal();
        this.render();
    }

    render(searchTerm = '') {
        const filtered = this.getFilteredTasks(searchTerm);
        document.getElementById('count-todo').innerText = filtered.filter(t => t.status === 'todo').length;
        document.getElementById('count-inprogress').innerText = filtered.filter(t => t.status === 'in-progress').length;
        document.getElementById('count-done').innerText = filtered.filter(t => t.status === 'done').length;
        document.getElementById('count-total').innerText = filtered.length;
        if (this.state.view === 'board') {
            document.getElementById('board-view').classList.replace('hidden', 'flex');
            document.getElementById('list-view').classList.add('hidden');
            document.getElementById('col-todo').innerHTML = this.renderColumn(filtered, 'todo');
            document.getElementById('col-inprogress').innerHTML = this.renderColumn(filtered, 'in-progress');
            document.getElementById('col-done').innerHTML = this.renderColumn(filtered, 'done');
        } else {
            document.getElementById('board-view').classList.replace('flex', 'hidden');
            document.getElementById('list-view').classList.remove('hidden');
            const lc = document.getElementById('list-container');
            lc.innerHTML = filtered.length ? filtered.map(t => this.createTaskListHTML(t)).join('') : this.getEmptyStateHTML();
        }
    }

    renderColumn(tasks, status) {
        const ct = tasks.filter(t => t.status === status);
        return ct.length ? ct.map(t => this.createTaskHTML(t)).join('') : this.getEmptyStateHTML();
    }

    createTaskHTML(task) {
        const subs = task.subtasks || [];
        const ds = subs.filter(s => s.completed).length;
        const prog = subs.length > 0 ? (ds / subs.length) * 100 : 0;
        const pc = { high: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30', medium: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30', low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/5' };
        const sd = escapeHtml(task.description);
        const pd = (hasMarked && sd) ? marked.parse(sd) : sd;
        return `
            <div class="glass-card p-2 sm:p-4 rounded-xl transition-all duration-200 group relative cursor-grab active:cursor-grabbing mb-2 sm:mb-3" data-id="${task.id}" tabindex="0">
                <div class="flex justify-between items-start mb-1.5 sm:mb-2.5">
                    <div class="flex gap-1.5 flex-wrap">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${pc[task.priority]}">${task.priority}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5 truncate max-w-[80px]">
                            <span class="w-1.5 h-1.5 rounded-full inline-block mr-1 ${this.getProjectColor(task.project || '')}"></span>${escapeHtml(task.project || 'General')}
                        </span>
                        ${task.alarm ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/20 ml-1 flex items-center gap-1"><i class="fa-solid fa-bell text-xs"></i></span>` : ''}
                    </div>
                    <div class="sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-black/50 rounded-lg backdrop-blur-sm p-0.5">
                        <button onclick="app.openModal(null, '${task.id}')" class="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-white/50 dark:hover:bg-white/10"><i class="fa-solid fa-pen text-[9px] sm:text-[10px]"></i></button>
                        <button onclick="app.promptDelete('${task.id}')" class="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10"><i class="fa-solid fa-trash text-[9px] sm:text-[10px]"></i></button>
                    </div>
                </div>
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 mb-1 leading-snug break-words line-clamp-2">${escapeHtml(task.title)}</h4>
                ${sd ? `<div class="prose prose-sm dark:prose-invert text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 mb-2 sm:mb-3 max-w-none opacity-80">${pd}</div>` : ''}
                ${subs.length > 0 ? `<div class="mb-2 sm:mb-3"><div class="flex justify-between items-end mb-1"><span class="text-[9px] text-slate-400 font-medium">${ds}/${subs.length}</span></div><div class="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1"><div class="bg-brand-500 h-1 rounded-full transition-all duration-500" style="width: ${prog}%"></div></div></div>` : ''}
                <div class="flex items-center justify-between text-[10px] sm:text-[11px] pt-2 sm:pt-3 border-t border-black/5 dark:border-white/5">
                    <div class="flex items-center gap-3">
                        ${task.dueDate ? `<span class="flex items-center gap-1 text-slate-500 ${this.isOverdue(task) ? 'text-red-500 font-bold' : ''}"><i class="fa-regular fa-clock text-[9px] sm:text-[10px]"></i> ${this.formatDate(task.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>`;
    }

    createTaskListHTML(task) {
        return `
        <div class="glass-card p-3 rounded-lg flex items-center gap-4 group hover:bg-white/80 dark:hover:bg-white/5 transition-colors">
            <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} onchange="app.updateTaskStatus('${task.id}', this.checked ? 'done' : 'todo')" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer">
            <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-sm ${task.status === 'done' ? 'line-through text-slate-400' : ''} truncate">${escapeHtml(task.title)}</h4>
                <div class="text-[11px] text-slate-500 flex gap-2 items-center mt-0.5">
                    <span class="font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full ${this.getProjectColor(task.project || '')}"></span> ${escapeHtml(task.project)}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span><span class="capitalize">${task.priority}</span>
                    ${task.dueDate ? `<span class="w-1 h-1 rounded-full bg-slate-300"></span> <span class="${this.isOverdue(task) ? 'text-red-500' : ''}">${this.formatDate(task.dueDate)}</span>` : ''}
                </div>
            </div>
            <div class="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="app.openModal(null, '${task.id}')" class="p-2 text-slate-400 hover:text-brand-600 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"><i class="fa-solid fa-pen"></i></button>
                <button onclick="app.promptDelete('${task.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }

    getFilteredTasks(term) {
        let tasks = [...this.state.tasks];
        if (term) tasks = tasks.filter(t => t.title.toLowerCase().includes(term));
        if(this.state.filter.startsWith('project:')) {
            const proj = this.state.filter.split(':')[1];
            tasks = tasks.filter(t => t.project === proj);
        } else if (this.state.filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            tasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
        }
        const s = this.state.sortBy;
        tasks.sort((a, b) => {
            if (s === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
            if (s === 'priority') { const m = { high: 3, medium: 2, low: 1 }; return (m[b.priority?.toLowerCase()] || 0) - (m[a.priority?.toLowerCase()] || 0); }
            if (s === 'dueDate') return (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
            return 0;
        });
        return tasks;
    }

    setFilter(f) {
        this.state.filter = f;
        document.querySelectorAll('#sidebar button[id^="nav-"]').forEach(b => {
            b.classList.remove('bg-white/60', 'dark:bg-white/10', 'text-brand-600', 'dark:text-white');
            b.classList.add('text-slate-600', 'dark:text-slate-400');
        });
        const btn = document.getElementById(`nav-${f}`);
        if(btn) { btn.classList.add('bg-white/60', 'dark:bg-white/10', 'text-brand-600', 'dark:text-white'); btn.classList.remove('text-slate-600', 'dark:text-slate-400'); }
        this.render();
        if(window.innerWidth < 640) document.getElementById('sidebar').classList.add('-translate-x-full');
    }

    setView(v) { 
        this.state.view = v; 
        document.getElementById('view-board-btn').className = v === 'board' ? 'w-10 h-8 sm:w-8 sm:h-7 rounded-md bg-white dark:bg-white/10 shadow-sm transition-all text-slate-900 dark:text-white flex items-center justify-center' : 'w-10 h-8 sm:w-8 sm:h-7 rounded-md text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center';
        document.getElementById('view-list-btn').className = v === 'list' ? 'w-10 h-8 sm:w-8 sm:h-7 rounded-md bg-white dark:bg-white/10 shadow-sm transition-all text-slate-900 dark:text-white flex items-center justify-center' : 'w-10 h-8 sm:w-8 sm:h-7 rounded-md text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center';
        this.render(); 
    }
    
    sortTasks(val) { this.state.sortBy = val; this.render(document.getElementById('search-input')?.value || ''); }

    toggleTheme() { this.state.darkMode = !this.state.darkMode; try { localStorage.setItem('theme', this.state.darkMode ? 'dark' : 'light'); } catch(e) {} this.applyTheme(); }

    applyTheme() { if (this.state.darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }

    getEmptyStateHTML() {
        return `<div class="flex flex-col items-center justify-center h-48 text-center opacity-50"><div class="w-12 h-12 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm"><i class="fa-solid fa-layer-group text-slate-300 text-lg"></i></div><p class="text-slate-500 dark:text-slate-400 text-xs font-medium">No tasks found</p></div>`;
    }

    formatDate(d) {
        if(!d) return '';
        const date = new Date(d);
        if(isNaN(date.getTime())) return '';
        if (date.toDateString() === new Date().toDateString()) return `Today, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    isOverdue(t) { return (t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()); }

    showToast(msg, type = 'success') { this.showToastWithAction(msg, null, null, type); }

    showToastWithAction(msg, actionText, actionCallback, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const c = type === 'success' ? 'bg-emerald-600/90' : (type === 'error' ? 'bg-red-600/90' : 'bg-slate-800/90');
        toast.className = `${c} text-white px-4 py-3 rounded-xl shadow-glass flex items-center justify-between transform transition-all duration-300 translate-y-10 opacity-0 pointer-events-auto min-w-[280px] backdrop-blur-md`;
        toast.innerHTML = `<div class="flex items-center gap-3"><i class="fa-solid ${type==='success'?'fa-check-circle':'fa-info-circle'}"></i><span class="text-xs font-medium">${msg}</span></div>${actionText ? `<button id="toast-action-btn" class="ml-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-colors">${actionText}</button>` : ''}`;
        container.appendChild(toast);
        if(actionCallback && actionText) toast.querySelector('#toast-action-btn').onclick = () => { actionCallback(); toast.remove(); };
        requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0'));
        setTimeout(() => { toast.classList.add('opacity-0', 'translate-x-10'); setTimeout(() => toast.remove(), 300); }, 4000);
    }
    
    triggerConfetti() { if(hasConfetti) confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#3b82f6', '#10b981', '#f59e0b'], disableForReducedMotion: true, decay: 0.9 }); }
    toggleMobileMenu() { document.getElementById('sidebar').classList.toggle('-translate-x-full'); }
    closeMobileMenuOutside() { const sb = document.getElementById('sidebar'); if (window.innerWidth < 640 && !sb.classList.contains('-translate-x-full')) sb.classList.add('-translate-x-full'); }
}