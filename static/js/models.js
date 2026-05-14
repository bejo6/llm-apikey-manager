// ============================================
// Models Functions
// ============================================

let modelsPagination = { page: 1, per_page: 10, total: 0, pages: 0 };

async function loadModels(page = 1) {
    modelsPagination.page = page;
    modelsPagination.per_page = parseInt(document.getElementById('modelsPerPageFilter').value);
    const search = document.getElementById('modelsSearchInput').value;
    const provider = document.getElementById('modelsProviderFilter').value;
    const is_free = document.getElementById('modelsFreeFilter').value;
    const tier = document.getElementById('modelsTierFilter').value;
    
    let url = `/api/models?page=${page}&per_page=${modelsPagination.per_page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (provider) url += `&provider=${encodeURIComponent(provider)}`;
    if (is_free) url += `&is_free=${is_free}`;
    if (tier) url += `&tier=${encodeURIComponent(tier)}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        modelsPagination = {
            page: data.page,
            per_page: data.per_page,
            total: data.total,
            pages: data.pages
        };
        
        renderModels(data.data);
        renderModelsPagination();
        populateModelsProviders();
    } catch (e) {
        console.error('Failed to load models:', e);
    }
}

function renderModels(models) {
    const tbody = document.getElementById('modelsTableBody');
    
    if (models.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-icon">🤖</div>
                    <div class="empty-text">No models found</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = models.map(m => `
        <tr>
            <td><strong>${escapeHtml(m.provider_display_name)}</strong></td>
            <td>${escapeHtml(m.model_name)}</td>
            <td class="clickable copy-to-clipboard" onclick="copyToClipboard('${escapeHtml(m.model_id)}', 'Model ID')" title="Click to copy"><code style="font-size: 11px;">${escapeHtml(m.model_id)}</code></td>
            <td>${formatContextLength(m.context_length)}</td>
            <td><span class="badge ${m.is_free ? 'badge-active' : 'badge-inactive'}">${m.is_free ? 'Free' : 'Paid'}</span></td>
            <td>${formatFreeTier(m.free_tier_type)}</td>
            <td style="font-size: 12px;">${formatRateLimits(m)}</td>
            <td>
                <div class="action-btns">
                    <button class="icon-btn edit" onclick="editModel('${m.id}')" title="Edit">✏️</button>
                    <button class="icon-btn delete" onclick="deleteModel('${m.id}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function formatContextLength(length) {
    if (!length) return '-';
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`;
    return length.toString();
}

function formatFreeTier(type) {
    if (!type) return '-';
    const badges = {
        'always_free': '<span class="badge badge-active">Always Free</span>',
        'preview': '<span class="badge" style="background: #3b82f6;">Preview</span>',
        'trial': '<span class="badge" style="background: #eab308;">Trial</span>',
        'credit_based': '<span class="badge" style="background: #a855f7;">Credit</span>'
    };
    return badges[type] || type;
}

function formatRateLimits(m) {
    const parts = [];
    if (m.rate_limit_rpm) parts.push(`${m.rate_limit_rpm} RPM`);
    if (m.rate_limit_tpm) {
        const tpm = m.rate_limit_tpm >= 1000 ? `${(m.rate_limit_tpm / 1000).toFixed(0)}K` : m.rate_limit_tpm;
        parts.push(`${tpm} TPM`);
    }
    return parts.length > 0 ? parts.join(' / ') : '-';
}

function renderModelsPagination() {
    const pg = document.getElementById('modelsPagination');
    if (modelsPagination.pages <= 1) {
        pg.innerHTML = `<span class="pg-info">${modelsPagination.total} models total</span>`;
        return;
    }
    
    const start = (modelsPagination.page - 1) * modelsPagination.per_page + 1;
    const end = Math.min(modelsPagination.page * modelsPagination.per_page, modelsPagination.total);
    
    let html = `<span class="pg-info">${start}-${end} of ${modelsPagination.total}</span>`;
    html += `<div class="pg-controls">`;
    html += `<button class="pg-btn" onclick="loadModels(1)" ${modelsPagination.page === 1 ? 'disabled' : ''} title="First">&laquo;</button>`;
    html += `<button class="pg-btn" onclick="loadModels(${modelsPagination.page - 1})" ${modelsPagination.page === 1 ? 'disabled' : ''} title="Previous">&lsaquo;</button>`;
    
    for (let i = 1; i <= modelsPagination.pages; i++) {
        if (i === 1 || i === modelsPagination.pages || (i >= modelsPagination.page - 1 && i <= modelsPagination.page + 1)) {
            html += `<button class="pg-btn ${i === modelsPagination.page ? 'active' : ''}" onclick="loadModels(${i})">${i}</button>`;
        } else if (i === modelsPagination.page - 2 || i === modelsPagination.page + 2) {
            html += `<span class="pg-ellipsis">&hellip;</span>`;
        }
    }
    
    html += `<button class="pg-btn" onclick="loadModels(${modelsPagination.page + 1})" ${modelsPagination.page >= modelsPagination.pages ? 'disabled' : ''} title="Next">&rsaquo;</button>`;
    html += `<button class="pg-btn" onclick="loadModels(${modelsPagination.pages})" ${modelsPagination.page >= modelsPagination.pages ? 'disabled' : ''} title="Last">&raquo;</button>`;
    html += `</div>`;
    
    pg.innerHTML = html;
}

async function populateModelsProviders() {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        const currentProvider = document.getElementById('modelsProviderFilter').value;
        document.getElementById('modelsProviderFilter').innerHTML = 
            '<option value="">All Providers</option>' + 
            providers.map(p => {
                const name = p.name;
                const displayName = p.display_name || p.name;
                return `<option value="${escapeHtml(name)}" ${name === currentProvider ? 'selected' : ''}>${escapeHtml(displayName)}</option>`;
            }).join('');
    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

async function deleteModel(id) {
    // Open delete confirmation modal
    fetch(`/api/models/${id}`)
        .then(res => res.json())
        .then(model => {
            document.getElementById('deleteTargetId').value = id;
            document.getElementById('deleteTargetType').value = 'model';
            document.getElementById('deleteConfirmMessage').textContent = 
                `Are you sure you want to delete model "${model.model_name}" (${model.provider})?`;
            document.getElementById('deleteConfirmModal').style.display = 'flex';
        })
        .catch(e => {
            showToast('Error loading model', true);
        });
}

function openAddModelModal() {
    // Clear form
    document.getElementById('modelModalTitle').textContent = 'Add Model';
    document.getElementById('editModelId').value = '';
    document.getElementById('addModelProvider').value = '';
    document.getElementById('addModelProvider').disabled = false;
    document.getElementById('addModelName').value = '';
    document.getElementById('addModelId').value = '';
    document.getElementById('addModelContext').value = '';
    document.getElementById('addModelIsFree').value = '1';
    document.getElementById('addModelFreeTier').value = '';
    document.getElementById('addModelRPM').value = '';
    document.getElementById('addModelTPM').value = '';
    document.getElementById('addModelNotes').value = '';
    
    // Populate providers dropdown
    populateAddModelProviders();
    
    // Show modal
    document.getElementById('addModelModal').style.display = 'flex';
}

function editModel(id) {
    // Fetch model data
    fetch(`/api/models/${id}`)
        .then(res => res.json())
        .then(async model => {
            document.getElementById('modelModalTitle').textContent = 'Edit Model';
            document.getElementById('editModelId').value = model.id;
            
            // Populate providers dropdown FIRST
            await populateAddModelProviders();
            
            // THEN set the value
            document.getElementById('addModelProvider').value = model.provider_id;
            document.getElementById('addModelProvider').disabled = false; // Allow changing provider
            document.getElementById('addModelName').value = model.model_name;
            document.getElementById('addModelId').value = model.model_id;
            document.getElementById('addModelContext').value = model.context_length || '';
            document.getElementById('addModelIsFree').value = model.is_free ? '1' : '0';
            document.getElementById('addModelFreeTier').value = model.free_tier_type || '';
            document.getElementById('addModelRPM').value = model.rate_limit_rpm || '';
            document.getElementById('addModelTPM').value = model.rate_limit_tpm || '';
            document.getElementById('addModelNotes').value = model.notes || '';
            
            // Show modal
            document.getElementById('addModelModal').style.display = 'flex';
        })
        .catch(e => {
            showToast('Error loading model', true);
        });
}

function closeAddModelModal() {
    document.getElementById('addModelModal').style.display = 'none';
}

async function populateAddModelProviders() {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        document.getElementById('addModelProvider').innerHTML = 
            '<option value="">Select Provider</option>' + 
            providers.map(p => `<option value="${p.id}">${escapeHtml(p.display_name || p.name)}</option>`).join('');
    } catch (e) {
        console.error('Failed to load providers:', e);
        showToast('Failed to load providers', true);
    }
}

async function saveAddModel() {
    const id = document.getElementById('editModelId').value;
    const isEdit = !!id;
    
    const provider_id = document.getElementById('addModelProvider').value;
    const model_name = document.getElementById('addModelName').value.trim();
    const model_id = document.getElementById('addModelId').value.trim();
    const context_length = document.getElementById('addModelContext').value;
    const is_free = document.getElementById('addModelIsFree').value;
    const free_tier_type = document.getElementById('addModelFreeTier').value;
    const rate_limit_rpm = document.getElementById('addModelRPM').value;
    const rate_limit_tpm = document.getElementById('addModelTPM').value;
    const notes = document.getElementById('addModelNotes').value.trim();
    
    // Validation
    if (!provider_id) {
        showToast('Provider is required', true);
        return;
    }
    if (!model_name) {
        showToast('Model name is required', true);
        return;
    }
    if (!model_id) {
        showToast('Model ID is required', true);
        return;
    }
    
    const data = {
        provider_id,
        model_name,
        model_id,
        is_free: parseInt(is_free)
    };
    
    // Optional fields
    if (context_length) data.context_length = parseInt(context_length);
    if (free_tier_type) data.free_tier_type = free_tier_type;
    if (rate_limit_rpm) data.rate_limit_rpm = parseInt(rate_limit_rpm);
    if (rate_limit_tpm) data.rate_limit_tpm = parseInt(rate_limit_tpm);
    if (notes) data.notes = notes;
    
    try {
        let res;
        if (isEdit) {
            // Update existing
            res = await fetch(`/api/models/${id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        } else {
            // Add new
            res = await fetch('/api/models', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
        }
        
        const result = await res.json();
        
        if (result.updated || result.status === 'added' || result.id) {
            showToast(isEdit ? 'Model updated!' : 'Model added successfully!');
            closeAddModelModal();
            loadModels(isEdit ? modelsPagination.page : 1);
        } else if (result.status === 'duplicate') {
            showToast('Model already exists', true);
        } else {
            showToast('Error saving model', true);
        }
    } catch (e) {
        showToast('Error saving model', true);
    }
}

// Search & Filter - debounced
let modelsSearchTimeout;
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('modelsSearchInput');
    const providerFilter = document.getElementById('modelsProviderFilter');
    const freeFilter = document.getElementById('modelsFreeFilter');
    const tierFilter = document.getElementById('modelsTierFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(modelsSearchTimeout);
            modelsSearchTimeout = setTimeout(() => loadModels(1), 300);
        });
    }
    
    if (providerFilter) {
        providerFilter.addEventListener('change', () => loadModels(1));
    }
    
    if (freeFilter) {
        freeFilter.addEventListener('change', () => loadModels(1));
    }
    
    if (tierFilter) {
        tierFilter.addEventListener('change', () => loadModels(1));
    }
    
    // Load models on page load
    loadModels(1);
});

// ============================================
// Copy to Clipboard
// ============================================

function copyToClipboard(text, label) {
    copyToClipboardSafe(text, `${label} copied to clipboard!`);
}
