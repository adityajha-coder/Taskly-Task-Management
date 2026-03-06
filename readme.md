# ⚡ Taskly

A secure, privacy-first task management PWA with a glassmorphic Kanban board, gamification, smart alarms, and a quick-glance widget — all running entirely in your browser.

---

## ✨ Features

### Core
- **Kanban Board** — Drag-and-drop task cards between To Do, In Progress, and Done columns (powered by SortableJS)
- **List View** — Compact sortable task list for quick scanning
- **Dashboard** — Visual analytics with completion ring, priority breakdown, project stats, and an activity heatmap

### Organization
- **Projects** — Create custom project groups (Work, Personal, etc.) with color-coded labels
- **Priorities** — Tag tasks as High, Medium, or Low with visual indicators
- **Subtasks** — Break tasks into smaller steps with inline progress tracking
- **Markdown** — Task descriptions support full Markdown rendering
- **Search & Sort** — Filter tasks instantly; sort by newest, priority, or due date

### Productivity
- **Gamification** — Earn XP, level up, and maintain daily completion streaks
- **Alarms** — Schedule alarms with custom sounds (Beep, Chime, Bell); fires via browser notifications + audio
- **Widget** — A standalone quick-glance page with live clock, stats, progress ring, upcoming deadlines, and quick-add task

### Experience
- **Dark / Light Mode** — Toggle themes with preference persistence
- **Glassmorphic UI** — Frosted-glass card design with subtle gradients and micro-animations
- **Fully Responsive** — Optimized touch targets, GPU-accelerated scrolling, and mobile-first Kanban
- **PWA** — Installable on any device; works offline with service worker caching
- **Export** — One-click CSV export of all tasks
- **Privacy** — Zero server calls; all data lives in your browser's LocalStorage

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5, Semantic Elements |
| Styling | Tailwind CSS, Vanilla CSS |
| Logic | JavaScript (ES6+) |
| Drag & Drop | [SortableJS](https://sortablejs.github.io/Sortable/) |
| Markdown | [Marked](https://marked.js.org/) |
| Effects | [Canvas Confetti](https://www.kirilv.com/canvas-confetti/) |
| Audio | Web Audio API |
| Offline | Service Workers, Cache API |
| Font | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |

---

## 📁 Project Structure

```
Taskly/
├── Frontend/
│   ├── index.html              # Main app shell
│   ├── widget.html             # Widget page (links to widget/ components)
│   ├── manifest.json           # PWA manifest with shortcuts & widget config
│   ├── sw.js                   # Service worker (precaching + network strategies)
│   ├── favicon-v5.svg          # App icon
│   ├── css/
│   │   ├── base.css            # Global resets & utility styles
│   │   ├── components.css      # Task cards, modals, drag states, mobile overrides
│   │   └── dashboard.css       # Dashboard widgets & chart styles
│   ├── js/
│   │   ├── app.js              # Entry point — initializes TaskManager & AlarmManager
│   │   ├── utils.js            # Shared utility functions (escapeHtml, checkLibrary)
│   │   ├── Gamification.js     # XP, leveling, streak tracking, confetti
│   │   ├── Modal.js            # Task create/edit modal, subtask management
│   │   ├── Render.js           # Board/list view rendering, task card HTML
│   │   ├── Dashboard.js        # Dashboard analytics, charts, heatmap
│   │   ├── TaskManager.js      # Core class — state, events, projects, filtering
│   │   └── AlarmManager.js     # Alarm scheduling, Web Audio playback, notifications
│   └── widget/
│       ├── widget.css          # Widget styles (clean, flat design)
│       └── widget.js           # Widget logic (clock, stats, progress, quick-add)
├── vercel.json                 # Vercel deployment config
├── readme.md
└── .gitignore
```

---

## 🚀 Getting Started

### Quick Start
1. **Clone** this repository
2. **Serve** the `Frontend/` directory with any static server:
   ```bash
   cd Frontend
   python -m http.server 8000
   ```
3. **Open** `http://localhost:8000` in your browser

### As a PWA
- On **Desktop** — Click the install icon in your browser's address bar
- On **Mobile** — Tap *Share → Add to Home Screen*

### First Steps
1. Click **New Task** (or the `+` button on mobile) to create your first task
2. Set a priority, project, due date, and optional alarm
3. Drag cards between columns or use the status controls
4. Switch to **Dashboard** view to track your progress
5. Visit the **Widget** (`widget.html`) for an at-a-glance summary

---

## 📱 Widget

The widget is a lightweight standalone page designed for quick access:

- **Live Clock** — Real-time display with time-of-day greeting
- **Stats Grid** — Total, To Do, Active, and Overdue counts at a glance
- **Progress Ring** — Animated SVG completion indicator with motivational messages
- **Quick Add** — Add tasks directly from the widget without opening the main app
- **Upcoming Deadlines** — Next 4 tasks due, with urgency badges and project tags
- **Open App / Dashboard** — One-tap navigation back to the full app

---

## ⏰ How Alarms Work

1. When creating or editing a task, set an **Alarm Time** and choose a **Sound** (Beep, Chime, or Bell)
2. Alarms are automatically scheduled and persist across page refreshes
3. When an alarm fires:
   - 🔊 Audio plays using the Web Audio API
   - 🔔 A browser notification appears (permission required on first use)
   - 📋 A toast message confirms the alarm in-app
4. Alarms trigger when the page or PWA is open or recently active

---

## 🎮 Gamification

| Action | XP Earned |
|---|---|
| Complete a task | +15 XP |
| Maintain daily streak | Streak counter increases |
| Level up | Every 100 XP |

- Completing tasks triggers a **confetti animation** 🎉
- Your **Level**, **XP**, and **Streak** are shown in the sidebar and widget

---

## 🔒 Privacy & Data

- **100% local** — All data is stored in browser `LocalStorage`
- **No accounts, no servers, no tracking** — Your tasks never leave your device
- **Export anytime** — Download all tasks as a CSV file from the sidebar
- **Clear data** — Clearing browser data or LocalStorage resets the app

---

## 📄 License

This project is for personal use. Feel free to fork and modify.