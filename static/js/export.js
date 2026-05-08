// Export Page JavaScript

// ============================================
// Export Functions
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
                headers.map(h => `"${(k[h] || '').replace(/"/g, '""')}"`).join(',')
            ).join('\n');
        } else if (format === 'env') {
            output = keys.map(k => `# ${k.provider}\n${k.provider.toUpperCase().replace(/-/g, '_')}_KEY="${k.apiKey}"`).join('\n\n');
        }
        
        document.getElementById('exportOutput').value = output;
        showToast('Export generated successfully!');
    } catch (e) {
        showToast('Error generating export', true);
    }
}

function copyExport() {
    const output = document.getElementById('exportOutput').value;
    if (!output) {
        showToast('Nothing to copy', true);
        return;
    }
    
    navigator.clipboard.writeText(output).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy', true);
    });
}

// ============================================
// Populate Provider Filter
// ============================================

async function populateExportProviders() {
    try {
        const res = await fetch('/api/providers?per_page=100');
        const data = await res.json();
        const providers = data.data || [];
        
        document.getElementById('exportProvider').innerHTML = 
            '<option value="">All Providers</option>' + 
            providers.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.display_name || p.name)}</option>`).join('');
    } catch (e) {
        console.error('Failed to load providers:', e);
    }
}

// ============================================
// Init
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    populateExportProviders();
});
