// Import Page JavaScript

// ============================================
// Import Functions
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
            <div>Added: <strong>${result.added || 0}</strong> keys</div>
            <div>Skipped: <strong>${result.skipped || 0}</strong> keys (duplicates or invalid)</div>
            ${result.errors && result.errors.length > 0 ? `<div style="margin-top: 8px; color: var(--danger);">Errors: ${result.errors.length}</div>` : ''}
        `;
        
        showToast(`Import complete: ${result.added || 0} added, ${result.skipped || 0} skipped`);
        
        // Reset file input
        fileInput.value = '';
        
    } catch (e) {
        showToast('Error importing file', true);
        console.error('Import error:', e);
    }
}
