// Dashboard Page JavaScript

// ============================================
// Load Dashboard Stats
// ============================================

async function loadDashboardStats() {
    try {
        // Load total keys
        const keysRes = await fetch('/api/keys?page=1&per_page=1');
        const keysData = await keysRes.json();
        document.getElementById('totalKeys').textContent = keysData.total || 0;

        // Load active keys count
        const activeRes = await fetch('/api/keys?page=1&per_page=1&status=1');
        const activeData = await activeRes.json();
        document.getElementById('activeKeys').textContent = activeData.total || 0;

        // Load total providers
        const providersRes = await fetch('/api/providers?page=1&per_page=1');
        const providersData = await providersRes.json();
        document.getElementById('totalProviders').textContent = providersData.total || 0;

        // Load total models
        const modelsRes = await fetch('/api/models?page=1&per_page=1');
        const modelsData = await modelsRes.json();
        document.getElementById('totalModels').textContent = modelsData.total || 0;
    } catch (e) {
        console.error('Dashboard: Failed to load stats:', e);
        showToast('Failed to load dashboard stats', true);
    }
}

// ============================================
// Load Recent Keys
// ============================================

async function loadRecentKeys() {
    try {
        const res = await fetch('/api/keys?page=1&per_page=5');
        const data = await res.json();
        const keys = data.data || [];

        const tbody = document.getElementById('recentKeysBody');

        if (keys.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-icon">🔑</div>
                        <div class="empty-text">No API keys yet</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = keys.map(k => {
            const date = new Date(k.createdAt);
            const dateStr = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <tr>
                    <td><strong>${escapeHtml(k.provider_display_name || k.provider)}</strong></td>
                    <td>${escapeHtml(k.name || '-')}</td>
                    <td><span class="badge ${k.isActive ? 'badge-active' : 'badge-inactive'}">${k.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>${dateStr}</td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error('Dashboard: Failed to load recent keys:', e);
    }
}

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentKeys();
});
