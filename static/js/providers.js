// ============================================
// Providers Functions
// ============================================

let providersPagination = { page: 1, per_page: 10, total: 0, pages: 0 };

async function loadProviders(page = 1) {
    providersPagination.page = page;
    providersPagination.per_page = parseInt(document.getElementById('providersPerPageFilter').value);
    const search = document.getElementById('providersSearchInput').value;
    
    let url = `/api/providers?page=${page}&per_page=${providersPagination.per_page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        providersPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            pages: data.pages
        };
        
        renderProviders(data.data);
        renderProvidersPagination();
    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

function renderProviders(providers) {
    const tbody = document.getElementById('providersTableBody');
    
    if (providers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">🏢</div>
                    <div class="empty-text">No providers found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = providers.map(p => `
        <tr>
            <td><code style="font-size: 11px;">${escapeHtml(p.name)}</code></td>
            <td><strong>${escapeHtml(p.display_name)}</strong></td>
            <td>${p.key_count || 0}</td>
            <td>${p.model_count || 0}</td>
            <td>${p.website_url ? `<a href="${escapeHtml(p.website_url)}" target="_blank" style="color: var(--primary); text-decoration: none;">🔗</a>` : '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn edit" onclick="editProvider('${p.id}')" title="Edit">✏️</button>
                    <button class="icon-btn delete" onclick="deleteProvider('${p.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderProvidersPagination() {
    const pg = document.getElementById('providersPagination');
    if (providersPagination.pages <= 1) {
        pg.innerHTML = `<span class="pg-info">${providersPagination.total} providers total</span>`;
        return;
    }
    
    const start = (providersPagination.page - 1) * providersPagination.per_page + 1;
    const end = Math.min(providersPagination.page * providersPagination.per_page, providersPagination.total);
    
    let html = `<span class="pg-info">${start}-${end} of ${providersPagination.total}</span>`;
    html += `<div class="pg-controls">`;
    html += `<button class="pg-btn" onclick="loadProviders(1)" ${providersPagination.page === 1 ? 'disabled' : ''} title="First">&laquo;</button>`;
    html += `<button class="pg-btn" onclick="loadProviders(${providersPagination.page - 1})" ${providersPagination.page === 1 ? 'disabled' : ''} title="Previous">&lsaquo;</button>`;
    
    for (let i = 1; i <= providersPagination.pages; i++) {
        if (i === 1 || i === providersPagination.pages || (i >= providersPagination.page - 1 && i <= providersPagination.page + 1)) {
            html += `<button class="pg-btn ${i === providersPagination.page ? 'active' : ''}" onclick="loadProviders(${i})">${i}</button>`;
        } else if (i === providersPagination.page - 2 || i === providersPagination.page + 2) {
            html += `<span class="pg-ellipsis">&hellip;</span>`;
        }
    }
    
    html += `<button class="pg-btn" onclick="loadProviders(${providersPagination.page + 1})" ${providersPagination.page >= providersPagination.pages ? 'disabled' : ''} title="Next">&rsaquo;</button>`;
    html += `<button class="pg-btn" onclick="loadProviders(${providersPagination.pages})" ${providersPagination.page >= providersPagination.pages ? 'disabled' : ''} title="Last">&raquo;</button>`;
    html += `</div>`;
    
    pg.innerHTML = html;
}

function editProvider(id) {
    fetch(`/api/providers/${id}`)
        .then(res => res.json())
        .then(provider => {
            document.getElementById('providerModalTitle').textContent = 'Edit Provider';
            document.getElementById('editProviderId').value = provider.id;
            document.getElementById('editProviderName').value = provider.name;
            document.getElementById('editProviderName').readOnly = true;
            document.getElementById('editProviderDisplayName').value = provider.display_name;
            document.getElementById('editProviderWebsite').value = provider.website_url || '';
            document.getElementById('editProviderDocs').value = provider.docs_url || '';
            document.getElementById('editProviderApiBase').value = provider.api_base_url || '';
            document.getElementById('editProviderNotes').value = provider.notes || '';
            document.getElementById('editProviderModal').style.display = 'flex';
        })
        .catch(e => {
            showToast('Error loading provider', true);
        });
}

function openAddProviderModal() {
    document.getElementById('providerModalTitle').textContent = 'Add Provider';
    document.getElementById('editProviderId').value = '';
    document.getElementById('editProviderName').value = '';
    document.getElementById('editProviderName').readOnly = false;
    document.getElementById('editProviderDisplayName').value = '';
    document.getElementById('editProviderWebsite').value = '';
    document.getElementById('editProviderDocs').value = '';
    document.getElementById('editProviderApiBase').value = '';
    document.getElementById('editProviderNotes').value = '';
    document.getElementById('editProviderModal').style.display = 'flex';
}

function closeEditProviderModal() {
    document.getElementById('editProviderModal').style.display = 'none';
}

async function saveProviderEdit() {
    const id = document.getElementById('editProviderId').value;
    const isEdit = !!id;
    
    const data = {
        name: document.getElementById('editProviderName').value.trim().toLowerCase(),
        display_name: document.getElementById('editProviderDisplayName').value.trim(),
        website_url: document.getElementById('editProviderWebsite').value.trim(),
        docs_url: document.getElementById('editProviderDocs').value.trim(),
        api_base_url: document.getElementById('editProviderApiBase').value.trim(),
        notes: document.getElementById('editProviderNotes').value.trim()
    };
    
    if (!data.name) {
        showToast('Provider name is required', true);
        return;
    }
    if (!data.display_name) {
        showToast('Display name is required', true);
        return;
    }
    if (!/^[a-z0-9_-]+$/.test(data.name)) {
        showToast('Provider name must be lowercase alphanumeric (a-z, 0-9, _, -)', true);
        return;
    }
    
    try {
        let res;
        if (isEdit) {
            res = await fetch(`/api/providers/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        } else {
            res = await fetch('/api/providers', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        }
        
        const result = await res.json();
        
        if (result.updated || result.status === 'added') {
            showToast(isEdit ? 'Provider updated!' : 'Provider added!');
            closeEditProviderModal();
            loadProviders(1);
        } else if (result.status === 'duplicate') {
            showToast('Provider already exists', true);
        } else {
            showToast('Error saving provider', true);
        }
    } catch (e) {
        showToast('Error saving provider', true);
    }
}

function deleteProvider(id) {
    fetch(`/api/providers/${id}`)
        .then(res => res.json())
        .then(provider => {
            document.getElementById('deleteTargetId').value = id;
            document.getElementById('deleteTargetType').value = 'provider';
            document.getElementById('deleteConfirmMessage').textContent = 
                `Are you sure you want to delete provider "${provider.display_name}"?`;
            document.getElementById('deleteConfirmModal').style.display = 'flex';
        })
        .catch(e => {
            showToast('Error loading provider', true);
        });
}

// Search - debounced
let providersSearchTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('providersSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(providersSearchTimeout);
            providersSearchTimeout = setTimeout(() => loadProviders(1), 300);
        });
    }
    
    // Load providers on page load
    loadProviders(1);
});

// ============================================
