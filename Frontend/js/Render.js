const RenderMixin = {
    render(searchTerm = '') {
        const filtered = this.getFilteredTasks(searchTerm);
        const counts = {
            todo: filtered.filter(t => t.status === 'todo').length,
            inprogress: filtered.filter(t => t.status === 'in-progress').length,
            done: filtered.filter(t => t.status === 'done').length
        };
        document.getElementById('count-todo').innerText = counts.todo;
        document.getElementById('count-inprogress').innerText = counts.inprogress;
        document.getElementById('count-done').innerText = counts.done;
        document.getElementById('count-total').innerText = filtered.length;

        const boardView = document.getElementById('board-view');
        const listView = document.getElementById('list-view');
        const dashView = document.getElementById('dashboard-view');
        boardView.classList.add('hidden');
        boardView.classList.remove('flex');
        listView.classList.add('hidden');
        if (dashView) dashView.classList.add('hidden');

        if (this.state.view === 'board') {
            boardView.classList.remove('hidden');
            boardView.classList.add('flex');
            document.getElementById('col-todo').innerHTML = this.renderColumn(filtered, 'todo');
            document.getElementById('col-inprogress').innerHTML = this.renderColumn(filtered, 'in-progress');
            document.getElementById('col-done').innerHTML = this.renderColumn(filtered, 'done');
        } else if (this.state.view === 'list') {
            listView.classList.remove('hidden');
            document.getElementById('list-container').innerHTML = filtered.length ? filtered.map(t => this.createTaskListHTML(t)).join('') : this.getEmptyStateHTML();
        } else if (this.state.view === 'dashboard') {
            if (dashView) dashView.classList.remove('hidden');
        }
    },

    renderColumn(tasks, status) {
        const colTasks = tasks.filter(t => t.status === status);
        return colTasks.length ? colTasks.map(t => this.createTaskHTML(t)).join('') : this.getEmptyStateHTML();
    },

    createTaskHTML(task) {
        const subtasks = task.subtasks || [];
        const doneSubs = subtasks.filter(s => s.completed).length;
        const progress = subtasks.length > 0 ? (doneSubs / subtasks.length) * 100 : 0;
        const priorityColors = {
            high: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
            medium: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
            low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/5'
        };
        const safeDesc = escapeHtml(task.description || '');
        const parsedDesc = (checkLibrary('marked') && safeDesc) ? marked.parse(safeDesc) : safeDesc;
        const safeTitle = escapeHtml(task.title);
        return `
            <div class="glass-card p-2 sm:p-4 rounded-xl transition-all duration-200 group relative cursor-grab active:cursor-grabbing mb-2 sm:mb-3" data-id="${task.id}" tabindex="0">
                <div class="flex justify-between items-start mb-1.5 sm:mb-2.5">
                    <div class="flex gap-1.5 flex-wrap">
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${priorityColors[task.priority]}">${task.priority}</span>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5 truncate max-w-[80px]">
                            <span class="w-1.5 h-1.5 rounded-full inline-block mr-1 ${this.getProjectColor(task.project || '')}"></span>${escapeHtml(task.project || 'General')}
                        </span>
                        ${task.alarm ? `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/20 ml-1 flex items-center gap-1"><i class="fa-solid fa-bell text-xs"></i></span>` : ''}
                    </div>
                    <div class="sm:opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-black/50 rounded-lg backdrop-blur-sm p-0.5">
                        <button onclick="app.openModal(null, '${task.id}')" class="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-white/50 dark:hover:bg-white/10" aria-label="Edit Task"><i class="fa-solid fa-pen text-[9px] sm:text-[10px]"></i></button>
                        <button onclick="app.promptDelete('${task.id}')" class="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10" aria-label="Delete Task"><i class="fa-solid fa-trash text-[9px] sm:text-[10px]"></i></button>
                    </div>
                </div>
                <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 mb-1 leading-snug break-words line-clamp-2">${safeTitle}</h4>
                ${safeDesc ? `<div class="prose prose-sm dark:prose-invert text-[10px] sm:text-[11px] text-slate-500 line-clamp-2 mb-2 sm:mb-3 max-w-none opacity-80">${parsedDesc}</div>` : ''}
                ${subtasks.length > 0 ? `
                <div class="mb-2 sm:mb-3">
                    <div class="flex justify-between items-end mb-1"><span class="text-[9px] text-slate-400 font-medium">${doneSubs}/${subtasks.length}</span></div>
                    <div class="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1"><div class="bg-brand-500 h-1 rounded-full transition-all duration-500" style="width: ${progress}%"></div></div>
                </div>` : ''}
                <div class="flex items-center justify-between text-[10px] sm:text-[11px] pt-2 sm:pt-3 border-t border-black/5 dark:border-white/5">
                    <div class="flex items-center gap-3">
                        ${task.dueDate ? `<span class="flex items-center gap-1 text-slate-500 ${this.isOverdue(task) ? 'text-red-500 font-bold' : ''}"><i class="fa-regular fa-clock text-[9px] sm:text-[10px]"></i> ${this.formatDate(task.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    createTaskListHTML(task) {
        const safeTitle = escapeHtml(task.title);
        return `
            <div class="glass-card p-3 rounded-lg flex items-center gap-4 group hover:bg-white/80 dark:hover:bg-white/5 transition-colors">
                <input type="checkbox" ${task.status === 'done' ? 'checked' : ''} onchange="app.updateTaskStatus('${task.id}', this.checked ? 'done' : 'todo')" class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" aria-label="Mark task done">
                <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-sm ${task.status === 'done' ? 'line-through text-slate-400' : ''} truncate">${safeTitle}</h4>
                    <div class="text-[11px] text-slate-500 flex gap-2 items-center mt-0.5">
                        <span class="font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full ${this.getProjectColor(task.project || '')}"></span> ${escapeHtml(task.project)}
                        </span>
                        <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span class="capitalize">${task.priority}</span>
                        ${task.dueDate ? `<span class="w-1 h-1 rounded-full bg-slate-300"></span> <span class="${this.isOverdue(task) ? 'text-red-500' : ''}">${this.formatDate(task.dueDate)}</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="app.openModal(null, '${task.id}')" class="p-2 text-slate-400 hover:text-brand-600 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="app.promptDelete('${task.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    },

    getEmptyStateHTML() {
        return `
        <div class="flex flex-col items-center justify-center h-48 text-center opacity-50">
            <div class="w-12 h-12 bg-white/50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                <i class="fa-solid fa-layer-group text-slate-300 text-lg"></i>
            </div>
            <p class="text-slate-500 dark:text-slate-400 text-xs font-medium">No tasks found</p>
        </div>`;
    }
};
