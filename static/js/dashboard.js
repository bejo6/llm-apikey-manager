// Dashboard Page JavaScript

// ============================================
// Load Dashboard Stats
// ============================================

async function loadDashboardStats() {
    console.log('Dashboard: loadDashboardStats() called');
    try {
        // Load total keys
        console.log('Dashboard: Fetching total keys...');
        const keysRes = await fetch('/api/keys?page=1&per_page=1');
        const keysData = await keysRes.json();
        console.log('Dashboard: Total keys:', keysData.total);
        document.getElementById('totalKeys').textContent = keysData.total || 0;
        
        // Load active keys count
        console.log('Dashboard: Fetching active keys...');
        const activeRes = await fetch('/api/keys?page=1&per_page=1&status=1');
        const activeData = await activeRes.json();
        console.log('Dashboard: Active keys:', activeData.total);
        document.getElementById('activeKeys').textContent = activeData.total || 0;
        
        // Load total providers
        console.log('Dashboard: Fetching total providers...');
        const providersRes = await fetch('/api/providers?page=1&per_page=1');
        const providersData = await providersRes.json();
        console.log('Dashboard: Total providers:', providersData.total);
        document.getElementById('totalProviders').textContent = providersData.total || 0;
        
        // Load total models
        console.log('Dashboard: Fetching total models...');
        const modelsRes = await fetch('/api/models?page=1&per_page=1');
        const modelsData = await modelsRes.json();
        console.log('Dashboard: Total models:', modelsData.total);
        document.getElementById('totalModels').textContent = modelsData.total || 0;
        
        console.log('Dashboard: loadDashboardStats() completed');
    } catch (e) {
        console.error('Dashboard: Failed to load stats:', e);
        showToast('Failed to load dashboard stats', true);
    }
}

// ============================================
// Load Recent Keys
// ============================================

async function loadRecentKeys() {
    console.log('Dashboard: loadRecentKeys() called');
    try {
        console.log('Dashboard: Fetching recent keys...');
        const res = await fetch('/api/keys?page=1&per_page=5');
        const data = await res.json();
        const keys = data.data || [];
        console.log('Dashboard: Recent keys count:', keys.length);
        
        const tbody = document.getElementById('recentKeysBody');
        
        if (keys.length === 0) {
            console.log('Dashboard: No keys found, showing empty state');
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
        
        console.log('Dashboard: Rendering recent keys table...');
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
        
        console.log('Dashboard: loadRecentKeys() completed');
    } catch (e) {
        console.error('Dashboard: Failed to load recent keys:', e);
    }
}

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard: DOMContentLoaded fired');
    console.log('Dashboard: Initializing...');
    loadDashboardStats();
    loadRecentKeys();
    console.log('Dashboard: Init completed');
});
