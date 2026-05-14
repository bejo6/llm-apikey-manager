// ============================================
// Shared Functions
// ============================================

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.className = 'toast' + (isError ? ' error' : '');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
}

function copyToClipboardSafe(text, successMsg = 'Copied to clipboard!', errorMsg = 'Failed to copy') {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(() => {
            fallbackCopy(text, successMsg, errorMsg);
        });
    } else {
        fallbackCopy(text, successMsg, errorMsg);
    }
}

function fallbackCopy(text, successMsg, errorMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        const ok = document.execCommand('copy');
        showToast(ok ? successMsg : errorMsg, !ok);
    } catch (e) {
        showToast(errorMsg, true);
    }
    document.body.removeChild(textarea);
}

function closeDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

async function confirmDelete() {
    const id = document.getElementById('deleteTargetId').value;
    const type = document.getElementById('deleteTargetType').value;
    
    if (type === 'provider') {
        try {
            const res = await fetch(`/api/providers/${id}`, {method: 'DELETE'});
            const result = await res.json();
            if (result.deleted) {
                showToast('Provider deleted successfully');
                closeDeleteConfirmModal();
                loadProviders(providersPagination.page);
            } else {
                showToast('Failed to delete provider', true);
            }
        } catch (e) {
            showToast('Error deleting provider', true);
        }
    } else if (type === 'model') {
        try {
            const res = await fetch(`/api/models/${id}`, {method: 'DELETE'});
            const result = await res.json();
            if (result.deleted) {
                showToast('Model deleted successfully');
                closeDeleteConfirmModal();
                loadModels(modelsPagination.page);
            } else {
                showToast('Failed to delete model', true);
            }
        } catch (e) {
            showToast('Error deleting model', true);
        }
    } else if (type === 'key') {
        try {
            const res = await fetch(`/api/keys/${id}`, {method: 'DELETE'});
            const result = await res.json();
            if (result.deleted) {
                showToast('Key deleted successfully');
                closeDeleteConfirmModal();
                loadKeys(pagination.page);
            } else {
                showToast('Failed to delete key', true);
            }
        } catch (e) {
            showToast('Error deleting key', true);
        }
    }
}
