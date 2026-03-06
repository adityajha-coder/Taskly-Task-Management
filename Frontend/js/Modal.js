const ModalMixin = {
    openModal(status = 'todo', taskId = null) {
        const modal = document.getElementById('task-modal');
        const titleEl = document.getElementById('modal-title');
        document.body.style.overflow = 'hidden';
        modal.classList.remove('hidden');
        document.getElementById('task-form').reset();
        this.tempSubtasks = [];
        if (taskId) {
            const task = this.state.tasks.find(t => t.id === taskId);
            if (task) {
                titleEl.innerText = 'Edit Task';
                document.getElementById('task-id').value = task.id;
                document.getElementById('task-title').value = task.title;
                document.getElementById('task-desc').value = task.description;
                document.getElementById('task-status').value = task.status;
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-date').value = task.dueDate || '';
                const projSelect = document.getElementById('task-project');
                if (projSelect) projSelect.value = task.project || this.state.projects[0];
                const alarmTimeEl = document.getElementById('task-alarm-time');
                const alarmSoundEl = document.getElementById('task-alarm-sound');
                if (alarmTimeEl && alarmSoundEl && task.alarm) {
                    alarmTimeEl.value = task.alarm.time || '';
                    alarmSoundEl.value = task.alarm.sound || 'beep';
                } else {
                    if (alarmTimeEl) alarmTimeEl.value = '';
                    if (alarmSoundEl) alarmSoundEl.value = '';
                }
                this.tempSubtasks = [...(task.subtasks || [])];
            }
        } else {
            titleEl.innerText = 'Create Task';
            document.getElementById('task-id').value = '';
            document.getElementById('task-status').value = status;
            document.getElementById('task-priority').value = 'medium';
        }
        this.renderSubtaskList();
        if (window.innerWidth > 640) {
            requestAnimationFrame(() => { document.getElementById('task-title').focus(); });
        }
    },

    closeModal() {
        document.getElementById('task-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.tempSubtasks = [];
        this.tempAlarms = [];
    },

    addSubtaskFromInput() {
        const input = document.getElementById('new-subtask-input');
        const text = input.value.trim();
        if (text) {
            this.tempSubtasks.push({ text, completed: false });
            input.value = '';
            this.renderSubtaskList();
            input.focus();
        }
    },

    toggleSubtaskInModal(index) {
        this.tempSubtasks[index].completed = !this.tempSubtasks[index].completed;
        this.renderSubtaskList();
    },

    deleteSubtaskInModal(index) {
        this.tempSubtasks.splice(index, 1);
        this.renderSubtaskList();
    },

    renderSubtaskList() {
        const list = document.getElementById('subtask-list');
        list.innerHTML = this.tempSubtasks.map((st, index) => `
            <li class="flex items-center gap-3 bg-white/50 dark:bg-white/5 p-3 rounded-lg border border-black/5 dark:border-white/5 group hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="app.toggleSubtaskInModal(${index})" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" aria-label="Toggle subtask">
                <span class="flex-1 text-xs font-medium ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}">${escapeHtml(st.text)}</span>
                <button type="button" onclick="app.deleteSubtaskInModal(${index})" class="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1" aria-label="Delete subtask"><i class="fa-solid fa-times"></i></button>
            </li>
        `).join('');
    },

    saveTask(e) {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value.trim();
        if (!title) { this.showToast("Title is required", "error"); return; }
        const desc = document.getElementById('task-desc').value;
        const status = document.getElementById('task-status').value;
        const priority = document.getElementById('task-priority').value;
        const date = document.getElementById('task-date').value;
        const project = document.getElementById('task-project').value;
        const alarmTime = document.getElementById('task-alarm-time').value;
        const alarmSound = document.getElementById('task-alarm-sound').value;
        const alarm = (alarmTime && alarmSound) ? { time: alarmTime, sound: alarmSound } : null;
        const taskData = { title, description: desc, status, priority, dueDate: date, project, subtasks: this.tempSubtasks, alarm };
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
        try { if (typeof alarmManager !== 'undefined') alarmManager.updateAlarmForTask(taskId, alarm); } catch (e) { }
        this.closeModal();
        this.render();
    }
};
