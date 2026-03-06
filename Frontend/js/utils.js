function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function checkLibrary(name) {
    try {
        if (name === 'Sortable') return typeof Sortable !== 'undefined';
        if (name === 'marked') return typeof marked !== 'undefined';
        if (name === 'confetti') return typeof confetti !== 'undefined';
    } catch (e) { }
    return false;
}
