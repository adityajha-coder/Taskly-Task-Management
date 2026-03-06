const GamificationMixin = {
    checkStreak() {
        const today = new Date().toDateString();
        const last = this.state.user.lastLogin;
        if (last !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (last === yesterday.toDateString()) this.state.user.streak++;
            else if (this.state.user.lastLogin) {
                if (new Date(last) < yesterday) this.state.user.streak = 1;
            } else this.state.user.streak = 1;
            this.state.user.lastLogin = today;
            this.saveState();
        }
    },

    addXP(amount) {
        this.state.user.xp += amount;
        const nextLevel = this.state.user.level * 100;
        if (this.state.user.xp >= nextLevel) {
            this.state.user.level++;
            this.state.user.xp -= nextLevel;
            this.showToast(`Level Up! You are now Level ${this.state.user.level}`, 'success');
            this.triggerConfetti();
        }
        this.saveState();
        this.renderGamification();
    },

    renderGamification() {
        const levelEl = document.getElementById('user-level');
        if (levelEl) levelEl.innerText = this.state.user.level;
        const streakEl = document.getElementById('streak-count');
        if (streakEl) streakEl.innerText = this.state.user.streak;
        const nextLevelXP = this.state.user.level * 100;
        const percent = Math.min(100, Math.round((this.state.user.xp / nextLevelXP) * 100));
        const barEl = document.getElementById('xp-bar');
        if (barEl) barEl.style.width = `${percent}%`;
        const currentXpEl = document.getElementById('current-xp');
        const nextLevelXpEl = document.getElementById('next-level-xp');
        if (currentXpEl) currentXpEl.innerText = `${this.state.user.xp} XP`;
        if (nextLevelXpEl) nextLevelXpEl.innerText = `${nextLevelXP} XP`;
    },

    triggerConfetti() {
        if (checkLibrary('confetti')) confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#3b82f6', '#10b981', '#f59e0b'], disableForReducedMotion: true, decay: 0.9 });
    }
};
