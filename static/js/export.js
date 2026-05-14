// Export Page JavaScript

// ============================================
// Export Functions
// ============================================

async function generatePreview() {
    const format = document.getElementById('exportFormat').value;
    const provider = document.getElementById('exportProvider').value;
    
    try {
        const output = await fetchExportData(format, provider);
        
        // Show preview in textarea
        document.getElementById('exportOutput').value = output;
        
        showToast('Preview generated successfully!');
        
    } catch (e) {
        console.error('Export error:', e);
        showToast('Error generating preview', true);
    }
}

async function downloadExport() {
    const format = document.getElementById('exportFormat').value;
    const provider = document.getElementById('exportProvider').value;
    
    try {
        const output = await fetchExportData(format, provider);
        
        // Determine filename and MIME type
        let filename = '';
        let mimeType = '';
        
        if (format === 'json') {
            filename = `apikeys_${Date.now()}.json`;
            mimeType = 'application/json';
        } else if (format === 'csv') {
            filename = `apikeys_${Date.now()}.csv`;
            mimeType = 'text/csv';
        } else if (format === 'env') {
            filename = `apikeys_${Date.now()}.env`;
            mimeType = 'text/plain';
        }
        
        // Download file
        downloadFile(output, filename, mimeType);
        
        showToast(`Downloaded ${filename}`);
        
    } catch (e) {
        console.error('Download error:', e);
        showToast('Error downloading file', true);
    }
}

async function fetchExportData(format, provider) {
    // Get ALL keys for export (bypass pagination)
    let url = '/api/keys?page=1&per_page=100000';
    if (provider) url += `&provider=${encodeURIComponent(provider)}`;
    
    const res = await fetch(url);
    const data = await res.json();
    const keys = data.data;
    
    let output = '';
    
    if (format === 'json') {
        // Export format compatible with import
        const exportData = keys.map(k => ({
            provider: k.provider, // Use provider name (not provider_id)
            name: k.name || '',
            apiKey: k.apiKey,
            authType: k.authType || 'apikey',
            isActive: k.isActive,
            notes: k.notes || ''
        }));
        output = JSON.stringify(exportData, null, 2);
        
    } else if (format === 'csv') {
        // CSV with proper escaping
        const headers = ['provider', 'name', 'apiKey', 'authType', 'isActive', 'notes'];
        const csvRows = [headers.join(',')];
        
        keys.forEach(k => {
            const row = [
                escapeCSV(k.provider || ''),
                escapeCSV(k.name || ''),
                escapeCSV(k.apiKey || ''),
                escapeCSV(k.authType || 'apikey'),
                k.isActive ? '1' : '0',
                escapeCSV(k.notes || '')
            ];
            csvRows.push(row.join(','));
        });
        
        output = csvRows.join('\n');
        
    } else if (format === 'env') {
        // .env format (not importable, just for reference)
        output = keys.map(k => {
            const envKey = k.provider.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            return `# ${k.provider}${k.name ? ' - ' + k.name : ''}\n${envKey}_KEY="${k.apiKey}"`;
        }).join('\n\n');
    }
    
    return output;
}

function escapeCSV(value) {
    // Escape CSV values: wrap in quotes if contains comma, quote, or newline
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyExport() {
    const output = document.getElementById('exportOutput').value;
    if (!output) {
        showToast('Generate preview first', true);
        return;
    }

    copyToClipboardSafe(output);
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
