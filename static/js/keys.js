// Keys Page JavaScript

// Pagination state
let pagination = { page: 1, per_page: 50, total: 0, pages: 0 };

// ============================================
// Load & Render Keys
// ============================================

async function loadKeys(page = 1) {
    pagination.page = page;
    pagination.per_page = parseInt(document.getElementById('perPageFilter').value);
    const search = document.getElementById('searchInput').value;
    const name = document.getElementById('nameFilter').value;
    const provider = document.getElementById('providerFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    let url = `/api/keys?page=${page}&per_page=${pagination.per_page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (provider) url += `&provider=${encodeURIComponent(provider)}`;
    if (status) url += `&status=${status}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        pagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            pages: data.pages
        };
        
        renderKeys(data.data);
        renderPagination();
        populateProviders();
    } catch (e) {
        console.error('Failed to load keys:', e);
    }
}

function renderKeys(keys) {
    const tbody = document.getElementById('keysTableBody');
    
    if (keys.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-icon">🔑</div>
                    <div class="empty-text">No API keys found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = keys.map(k => `
        <tr>
            <td><strong>${escapeHtml(k.provider_display_name)}</strong></td>
            <td class="key-cell" onclick="copyKey('${escapeHtml(k.name || '')}')" title="Click to copy">${escapeHtml(k.name || '-')}</td>
            <td class="key-cell" onclick="copyKey('${escapeHtml(k.apiKey)}')" title="Click to copy">${escapeHtml(k.apiKey)}</td>
            <td><span class="badge ${k.isActive ? 'badge-active' : 'badge-inactive'}">${k.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn edit" onclick="openEditModal('${k.id}', '${k.provider_id}', '${escapeHtml(k.name || '')}', '${escapeHtml(k.apiKey)}', '${k.authType}', '${k.isActive}', '${escapeHtml(k.notes || '')}')" title="Edit">✏️</button>
                    <button class="icon-btn delete" onclick="deleteKey('${k.id}', '${escapeHtml(k.name || k.apiKey.substring(0, 20))}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderPagination() {
    const pg = document.getElementById('pagination');
    if (pagination.pages <= 1) {
        pg.innerHTML = `<span class="pg-info">${pagination.total} keys total</span>`;
        return;
    }
    
    const start = (pagination.page - 1) * pagination.per_page + 1;
    const end = Math.min(pagination.page * pagination.per_page, pagination.total);
    
    let html = `<span class="pg-info">${start}-${end} of ${pagination.total}</span>`;
    
    // Pagination controls
    html += `<div class="pg-controls">`;
    
    // First
    html += `<button class="pg-btn" onclick="loadKeys(1)" ${pagination.page === 1 ? 'disabled' : ''} title="First">&laquo;</button>`;
    
    // Prev
    html += `<button class="pg-btn" onclick="loadKeys(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''} title="Previous">&lsaquo;</button>`;
    
    // Page numbers with ellipsis
    for (let i = 1; i <= pagination.pages; i++) {
        if (i === 1 || i === pagination.pages || (i >= pagination.page - 1 && i <= pagination.page + 1)) {
            html += `<button class="pg-btn ${i === pagination.page ? 'active' : ''}" onclick="loadKeys(${i})">${i}</button>`;
        } else if (i === pagination.page - 2 || i === pagination.page + 2) {
            html += `<span class="pg-ellipsis">&hellip;</span>`;
        }
    }
    
    // Next
    html += `<button class="pg-btn" onclick="loadKeys(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''} title="Next">&rsaquo;</button>`;
    
    // Last
    html += `<button class="pg-btn" onclick="loadKeys(${pagination.pages})" ${pagination.page >= pagination.pages ? 'disabled' : ''} title="Last">&raquo;</button>`;
    
    html += `</div>`;
    
    pg.innerHTML = html;
}

async function populateProviders() {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        // Provider filter dropdown
        const currentProviderFilter = document.getElementById('providerFilter').value;
        document.getElementById('providerFilter').innerHTML = 
            '<option value="">All Providers</option>' + 
            providers.map(p => `<option value="${escapeHtml(p.name)}" ${p.name === currentProviderFilter ? 'selected' : ''}>${escapeHtml(p.display_name || p.name)} (${p.key_count})</option>`).join('');
        
        // Export dropdown (if exists)
        const exportProviderEl = document.getElementById('exportProvider');
        if (exportProviderEl) {
            const currentExportProvider = exportProviderEl.value;
            exportProviderEl.innerHTML = 
                '<option value="">All Providers</option>' + 
                providers.map(p => `<option value="${escapeHtml(p.name)}" ${p.name === currentExportProvider ? 'selected' : ''}>${escapeHtml(p.display_name || p.name)} (${p.key_count})</option>`).join('');
        }
        
        // Add form datalist (if exists)
        const datalistEl = document.getElementById('providerDatalist');
        if (datalistEl) {
            datalistEl.innerHTML = 
                providers.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.display_name || p.name)}</option>`).join('');
        }

    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

// ============================================
// Search & Filter
// ============================================

let keysSearchTimeout;

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const nameFilter = document.getElementById('nameFilter');
    const providerFilter = document.getElementById('providerFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(keysSearchTimeout);
            keysSearchTimeout = setTimeout(() => loadKeys(1), 300);
        });
    }

    if (nameFilter) {
        nameFilter.addEventListener('change', () => loadKeys(1));
    }

    if (providerFilter) {
        providerFilter.addEventListener('change', () => loadKeys(1));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadKeys(1));
    }
    
    // Populate name filter
    populateNameFilter();
    
    // Load keys on page load
    loadKeys(1);
});

// ============================================
// Delete Key Functions
// ============================================

function deleteKey(id, name) {
    // Set target
    document.getElementById('deleteTargetId').value = id;
    document.getElementById('deleteTargetType').value = 'key';
    
    // Set message
    const keyName = name || 'this key';
    document.getElementById('deleteConfirmMessage').textContent = 
        `Are you sure you want to delete "${keyName}"? This action cannot be undone.`;
    
    // Show modal
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}

// ============================================
// Add Key Functions
// ============================================

function openAddKeyModal() {
    // Clear ALL fields when opening
    resetAddKeyFields(false);
    
    // Populate autocomplete and providers
    populateExistingNames();
    populateAddKeyProviders();
    
    // Add event listener for provider change
    const providerSelect = document.getElementById('addKeyProvider');
    providerSelect.removeEventListener('change', updateProviderLink);
    providerSelect.addEventListener('change', updateProviderLink);
    
    // Add event listener for name mode toggle
    document.getElementById('nameModeExisting').addEventListener('change', toggleNameMode);
    document.getElementById('nameModeNew').addEventListener('change', toggleNameMode);
    
    // Show modal
    document.getElementById('addKeyModal').style.display = 'flex';
}

function closeAddKeyModal() {
    // Reset ALL fields when closing
    resetAddKeyFields(false);
    document.getElementById('addKeyModal').style.display = 'none';
}

function resetAddKeyFields(keepName = false) {
    if (!keepName) {
        document.getElementById('addKeyNameSelect').value = '';
        document.getElementById('addKeyNameInput').value = '';
        // Reset to existing mode
        document.getElementById('nameModeExisting').checked = true;
        toggleNameMode();
    }
    document.getElementById('addKeyProvider').value = '';
    document.getElementById('addKeyApiKey').value = '';
    document.getElementById('addKeyAuthType').value = 'apikey';
    document.getElementById('addKeyStatus').value = '1';
    document.getElementById('addKeyNotes').value = '';
    
    // Hide provider link
    hideProviderLink();
}

async function populateExistingNames() {
    try {
        const res = await fetch('/api/keys/names');
        const data = await res.json();
        const names = data.names || [];
        
        const select = document.getElementById('addKeyNameSelect');
        select.innerHTML = '<option value="">Select existing name...</option>' + 
            names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
        
        // Auto-switch to "New" mode if no existing names
        if (names.length === 0) {
            document.getElementById('nameModeNew').checked = true;
            toggleNameMode();
        }
    } catch (e) {
        console.error('Failed to load existing names:', e);
        // Switch to "New" mode on error
        document.getElementById('nameModeNew').checked = true;
        toggleNameMode();
    }
}

async function populateNameFilter() {
    try {
        const res = await fetch('/api/keys/names');
        const data = await res.json();
        const names = data.names || [];
        
        const select = document.getElementById('nameFilter');
        if (select) {
            select.innerHTML = '<option value="">All Names</option>' + 
                names.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
        }
    } catch (e) {
        console.error('Failed to load name filter:', e);
    }
}

async function populateAddKeyProviders() {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        document.getElementById('addKeyProvider').innerHTML = 
            '<option value="">Select Provider</option>' + 
            providers.map(p => `<option value="${p.id}">${escapeHtml(p.display_name || p.name)}</option>`).join('');
    } catch (e) {
        console.error('Failed to load providers:', e);
        showToast('Failed to load providers', true);
    }
}

function toggleNameMode() {
    const isExisting = document.getElementById('nameModeExisting').checked;
    const selectEl = document.getElementById('addKeyNameSelect');
    const inputEl = document.getElementById('addKeyNameInput');
    
    if (isExisting) {
        selectEl.style.display = 'block';
        inputEl.style.display = 'none';
    } else {
        selectEl.style.display = 'none';
        inputEl.style.display = 'block';
    }
}

async function updateProviderLink() {
    const providerId = document.getElementById('addKeyProvider').value;
    const linkContainer = document.getElementById('providerLinkContainer');
    
    if (!providerId) {
        linkContainer.style.display = 'none';
        return;
    }
    
    try {
        const res = await fetch(`/api/providers/${providerId}`);
        const provider = await res.json();
        
        if (provider.website_url) {
            linkContainer.innerHTML = `
                <a href="${escapeHtml(provider.website_url)}" 
                   target="_blank" 
                   class="btn btn-secondary btn-sm">
                    🔗 Visit ${escapeHtml(provider.display_name || provider.name)}
                </a>
            `;
            linkContainer.style.display = 'block';
        } else {
            linkContainer.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to load provider:', e);
        linkContainer.style.display = 'none';
    }
}

function hideProviderLink() {
    const linkContainer = document.getElementById('providerLinkContainer');
    if (linkContainer) {
        linkContainer.style.display = 'none';
    }
}

async function saveAddKey() {
    const provider_id = document.getElementById('addKeyProvider').value;
    
    // Get name from active mode (existing select or new input)
    const isExisting = document.getElementById('nameModeExisting').checked;
    let name = isExisting 
        ? document.getElementById('addKeyNameSelect').value.trim()
        : document.getElementById('addKeyNameInput').value.trim();
    
    const apiKey = document.getElementById('addKeyApiKey').value.trim();
    const authType = document.getElementById('addKeyAuthType').value;
    const isActive = parseInt(document.getElementById('addKeyStatus').value);
    const notes = document.getElementById('addKeyNotes').value.trim();
    
    // Auto-lowercase if email format
    if (name.includes('@')) {
        name = name.toLowerCase();
    }
    
    // Validation
    if (!provider_id) {
        showToast('Provider is required', true);
        return;
    }
    if (!apiKey) {
        showToast('API Key is required', true);
        return;
    }
    
    const data = {
        provider_id,
        name,
        apiKey,
        authType,
        isActive,
        notes
    };
    
    try {
        const res = await fetch('/api/keys', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.status === 'added' || result.id) {
            showToast('API Key added successfully!');
            // DON'T close modal - reset fields except name
            resetAddKeyFields(true); // keepName = true
            loadKeys(1);
        } else if (result.status === 'duplicate') {
            showToast('API Key already exists', true);
            // DON'T reset fields on error
        } else {
            showToast('Error adding API Key', true);
            // DON'T reset fields on error
        }
    } catch (e) {
        showToast('Error adding API Key', true);
        // DON'T reset fields on error
    }
}

// ============================================
// Edit Modal
// ============================================

async function openEditModal(id, provider_id, name, apiKey, authType, isActive, notes) {
    console.log('Opening edit modal for key ID:', id);
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editKey').value = apiKey;
    document.getElementById('editAuth').value = authType;
    document.getElementById('editStatus').value = isActive;
    document.getElementById('editNotes').value = notes;
    
    // Populate provider dropdown
    await populateEditProviders(provider_id);
    
    document.getElementById('editModal').style.display = 'flex';
}

async function populateEditProviders(selectedProviderId) {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        document.getElementById('editProvider').innerHTML = 
            '<option value="">Select Provider</option>' + 
            providers.map(p => `<option value="${p.id}" ${p.id === selectedProviderId ? 'selected' : ''}>${escapeHtml(p.display_name || p.name)}</option>`).join('');
    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

async function saveEdit() {
    const id = document.getElementById('editId').value;
    const data = {
        provider_id: document.getElementById('editProvider').value,
        name: document.getElementById('editName').value,
        apiKey: document.getElementById('editKey').value,
        authType: document.getElementById('editAuth').value,
        isActive: parseInt(document.getElementById('editStatus').value),
        notes: document.getElementById('editNotes').value
    };
    
    if (!data.provider_id || !data.apiKey) {
        showToast('Provider and API Key are required', true);
        return;
    }
    
    try {
        const res = await fetch(`/api/keys/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.updated) {
            showToast('Key updated!');
            closeEditModal();
            loadKeys(pagination.page);
        }
    } catch (e) {
        showToast('Error updating key', true);
    }
}

// ============================================
// Copy Key
// ============================================

function copyKey(key) {
    copyToClipboardSafe(key);
}

// ============================================
// Export
// ============================================

async function doExport() {
    const format = document.getElementById('exportFormat').value;
    const provider = document.getElementById('exportProvider').value;
    
    // Get ALL keys for export (bypass pagination)
    let url = '/api/keys?page=1&per_page=100000';
    if (provider) url += `&provider=${encodeURIComponent(provider)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        const keys = data.data;
        
        let output = '';
        if (format === 'json') {
            output = JSON.stringify(keys, null, 2);
        } else if (format === 'csv') {
            const headers = ['provider', 'name', 'apiKey', 'authType', 'isActive', 'notes'];
            output = headers.join(',') + '\n' + keys.map(k => 
                headers.map(h => `"${(k[h] || '').replace(/"/g, '""')}"` ).join(',')
            ).join('\n');
        } else if (format === 'env') {
            output = keys.map(k => `# ${k.provider}\n${k.provider.toUpperCase().replace(/-/g, '_')}_KEY="${k.apiKey}"`).join('\n\n');
        }
        
        document.getElementById('exportOutput').value = output;
    } catch (e) {
        showToast('Error generating export', true);
    }
}

function copyExport() {
    const output = document.getElementById('exportOutput').value;
    if (output) {
        copyToClipboardSafe(output);
    }
}

// ============================================
// Import
// ============================================

async function importKeys() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) {
        showToast('Please select a file', true);
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        showToast('Importing...');
        const res = await fetch('/api/keys/import', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        
        if (result.error) {
            showToast(result.error, true);
            return;
        }
        
        // Show result
        const resultDiv = document.getElementById('importResult');
        const resultText = document.getElementById('importResultText');
        resultDiv.style.display = 'block';
        resultText.innerHTML = `
            <div style="color: var(--success); margin-bottom: 8px;">✓ Import Complete</div>
            <div>Imported: <strong>${result.imported}</strong> keys</div>
            <div>Skipped: <strong>${result.skipped}</strong> keys (duplicates or invalid)</div>
        `;
        
        showToast(`Imported ${result.imported} keys, skipped ${result.skipped}`);
        
        // Reset file input and refresh keys table
        fileInput.value = '';
        loadKeys(1);
        
    } catch (e) {
        showToast('Error importing file', true);
    }
}

// ============================================
