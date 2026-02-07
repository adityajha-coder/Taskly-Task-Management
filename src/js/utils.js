function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const hasMarked = typeof marked !== 'undefined';
const hasSortable = typeof Sortable !== 'undefined';
const hasConfetti = typeof confetti !== 'undefined';