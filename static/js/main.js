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
