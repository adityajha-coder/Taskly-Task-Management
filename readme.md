Taskly

Taskly is a secure, minimalist task management web application designed for focus and productivity. It features a drag-and-drop Kanban board, gamification elements (XP, Levels), alarms with multiple sound options, and PWA support for offline use.

Features

Views: Switch between Kanban Board and List views.

Organization: Group tasks by Projects and set Priorities.

Drag & Drop: Smooth drag-and-drop interface powered by SortableJS with mobile optimization.

Gamification: Earn XP and level up by completing tasks. Daily streak tracking.

Alarms: Set multiple alarms per task with custom sounds (Beep, Chime, Bell). Alarms trigger with browser notifications and audio.

PWA Support: Installable as a web app. Works offline with service worker caching.

Theme: Toggle between Light and Dark modes.

Subtasks: Break tasks into smaller steps with progress tracking.

Privacy: All data is stored locally in your browser (LocalStorage).

Markdown: Task descriptions support Markdown rendering.

Mobile Optimized: Fully responsive design with smooth touch interactions and improved tap targets.

Tech Stack

HTML5 & CSS3

JavaScript (ES6+)

Tailwind CSS (Styling)

SortableJS (Drag and Drop)

Marked (Markdown Parsing)

Canvas Confetti (Visual Effects)

Web Audio API (Alarm sounds)

Service Workers (PWA & Offline)

Setup & Usage

Open Frontend/index.html in your web browser (or serve with Python: `python -m http.server 8000`)

Create a task by clicking "New Task" or the + button

Add alarms to your tasks by setting a time and selecting a sound in the task modal

Complete tasks to earn XP and level up

Switch between Board and List views for different perspectives

Toggle dark mode for a comfortable viewing experience

Export tasks to CSV for backup

Mobile Usage

The app is fully optimized for mobile:
- Larger touch targets and buttons
- Smooth scrolling with GPU acceleration
- Optimized drag-and-drop for touch devices
- Responsive layout that adapts to all screen sizes

Can be installed as a PWA for native app experience (Add to Home Screen on mobile)

How Alarms Work

1. When creating/editing a task, use the "Alarms" section to add alarms
2. Select the alarm time and choose a sound (Beep, Chime, or Bell)
3. Multiple alarms per task are supported
4. Alarms are automatically scheduled and will trigger when the time is reached
5. When an alarm fires: audio plays, a notification appears, and a toast message shows
6. Alarms persist across page refreshes and browser sessions

Notes

- All data persists in browser LocalStorage
- Alarms fire when the page/app is open or recently active
- Browser notifications require permission (prompted on first use)
- Dark mode preference is saved
- Streak is maintained across days