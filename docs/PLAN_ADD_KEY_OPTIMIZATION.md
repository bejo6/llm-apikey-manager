# Plan: Add API Key Modal Optimization

**Status:** ✅ All Phases Complete! (Updated with Phase 2.1)  
**Created:** 2026-05-08  
**Priority:** High

---

## Problem Statement

Current Add Key workflow is inefficient for bulk adding keys:
- Modal auto-closes after successful add
- User must re-input name/email for each key (same email, different providers)
- No autocomplete for existing names
- No quick access to provider website for API key generation

**User Pain Point:**
> "I register 1 email for multiple providers. When adding keys one by one, I have to re-type the same email every time. Very repetitive!"

---

## Objectives

1. **Keep modal open** after successful add (allow rapid multi-key entry)
2. **Preserve name field** across adds (same email, different providers)
3. **Autocomplete names** from existing database entries
4. **Auto-lowercase emails** before saving to database
5. **Show provider website link** for quick access to get API keys

---

## Implementation Plan

### Phase 1: Modal Behavior (No Auto-Close)

**Goal:** Modal stays open after success, selective field reset

**File:** `static/js/keys.js`

#### Changes to `saveAddKey()` function:

**Current behavior:**
```javascript
// After success
showToast('API key added!');
closeAddKeyModal();  // ❌ Auto-close
loadKeys(1);
```

**New behavior:**
```javascript
// After success
showToast('API key added!');
// ✅ DON'T close modal
// ✅ Reset fields EXCEPT addKeyName
resetAddKeyFields(keepName = true);
loadKeys(1);

// After error
showToast('Error adding key', true);
// ✅ DON'T reset any fields
```

#### New function: `resetAddKeyFields(keepName = false)`

```javascript
function resetAddKeyFields(keepName = false) {
    if (!keepName) {
        document.getElementById('addKeyName').value = '';
    }
    document.getElementById('addKeyProvider').value = '';
    document.getElementById('addKeyApiKey').value = '';
    document.getElementById('addKeyAuthType').value = 'apikey';
    document.getElementById('addKeyStatus').value = '1';
    document.getElementById('addKeyNotes').value = '';
    
    // Hide provider link
    hideProviderLink();
}
```

#### Update `closeAddKeyModal()`:

```javascript
function closeAddKeyModal() {
    resetAddKeyFields(keepName = false); // ✅ Reset ALL fields
    document.getElementById('addKeyModal').style.display = 'none';
}
```

---

### Phase 2: Name Field Autocomplete

**Goal:** Autocomplete from existing names, auto-lowercase emails

**File:** `static/js/keys.js`

#### New function: `populateExistingNames()`

```javascript
async function populateExistingNames() {
    try {
        const res = await fetch('/api/keys/names');
        const data = await res.json();
        const names = data.names || [];
        
        const datalist = document.getElementById('existingNames');
        datalist.innerHTML = names.map(name => 
            `<option value="${escapeHtml(name)}">`
        ).join('');
    } catch (e) {
        console.error('Failed to load existing names:', e);
    }
}
```

#### Update `openAddKeyModal()`:

```javascript
function openAddKeyModal() {
    document.getElementById('modalTitle').textContent = 'Add API Key';
    document.getElementById('editKeyId').value = '';
    resetAddKeyFields(keepName = false);
    
    // ✅ Populate autocomplete
    populateExistingNames();
    populateAddKeyProviders();
    
    document.getElementById('addKeyModal').style.display = 'flex';
}
```

#### Update `saveAddKey()` - Lowercase email:

```javascript
async function saveAddKey() {
    // ... existing validation ...
    
    let name = document.getElementById('addKeyName').value.trim();
    
    // ✅ Auto-lowercase if email format
    if (name.includes('@')) {
        name = name.toLowerCase();
    }
    
    // ... rest of save logic ...
}
```

**File:** `templates/components/modals_keys.html`

#### Update name input field:

```html
<div class="form-group">
    <label class="form-label">Name / Email</label>
    <input 
        type="text" 
        class="form-input" 
        id="addKeyName" 
        list="existingNames"
        placeholder="user@example.com">
    <datalist id="existingNames"></datalist>
</div>
```

---

### Phase 2.1: Name Field Switch (Updated)

**Goal:** Replace datalist autocomplete with clean toggle between Existing (select) and New (input)

**Reason:** Datalist shows suggestions outside form element, looks messy. Radio toggle is cleaner.

**File:** `templates/components/modals_keys.html`

#### Updated name field HTML:

```html
<div class="form-group">
    <label class="form-label">Name / Email</label>
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="radio" name="nameMode" value="existing" id="nameModeExisting" checked>
            <span>Existing</span>
        </label>
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
            <input type="radio" name="nameMode" value="new" id="nameModeNew">
            <span>New</span>
        </label>
    </div>
    <!-- Existing: Select dropdown -->
    <select class="form-select" id="addKeyNameSelect" style="display: block;">
        <option value="">Select existing name...</option>
    </select>
    <!-- New: Input text -->
    <input type="text" class="form-input" id="addKeyNameInput" placeholder="user@example.com" style="display: none;">
</div>
```

**File:** `static/js/keys.js`

#### New function: `toggleNameMode()`

```javascript
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
```

#### Updated `populateExistingNames()`:

```javascript
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
        document.getElementById('nameModeNew').checked = true;
        toggleNameMode();
    }
}
```

#### Updated `saveAddKey()`:

```javascript
// Get name from active mode
const isExisting = document.getElementById('nameModeExisting').checked;
let name = isExisting 
    ? document.getElementById('addKeyNameSelect').value.trim()
    : document.getElementById('addKeyNameInput').value.trim();
```

---

### Phase 3: Provider Website Link

**Goal:** Show dynamic link to provider website when provider selected

**File:** `static/js/keys.js`

#### New function: `updateProviderLink()`

```javascript
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
                   class="btn btn-secondary btn-sm" 
                   style="margin-top: 8px;">
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
```

#### Update `openAddKeyModal()`:

```javascript
function openAddKeyModal() {
    // ... existing code ...
    
    // ✅ Add event listener for provider change
    const providerSelect = document.getElementById('addKeyProvider');
    providerSelect.addEventListener('change', updateProviderLink);
    
    document.getElementById('addKeyModal').style.display = 'flex';
}
```

**File:** `templates/components/modals_keys.html`

#### Add provider link container after provider dropdown:

```html
<div class="form-group">
    <label class="form-label">Provider</label>
    <select class="form-select" id="addKeyProvider" required>
        <option value="">Select Provider</option>
    </select>
    <!-- ✅ Provider link container -->
    <div id="providerLinkContainer" style="display: none;"></div>
</div>
```

---

### Phase 4: Backend Support

**File:** `routes/keys.py`

#### New endpoint: `/api/keys/names`

```python
@keys_bp.route('/api/keys/names', methods=['GET'])
def get_key_names():
    """Get distinct names from api_keys for autocomplete."""
    try:
        names = db.get_distinct_names()
        return jsonify({"names": names})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

**File:** `db.py`

#### New function: `get_distinct_names()`

```python
def get_distinct_names():
    """Get distinct non-empty names from api_keys table."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT DISTINCT name 
        FROM api_keys 
        WHERE name IS NOT NULL AND name != '' 
        ORDER BY name
    """)
    rows = cur.fetchall()
    conn.close()
    return [row[0] for row in rows]
```

---

## Files to Modify

| File | Changes | Lines Est. |
|------|---------|------------|
| `static/js/keys.js` | Modal behavior, autocomplete, provider link | +80 |
| `templates/components/modals_keys.html` | Datalist, provider link container | +5 |
| `routes/keys.py` | New endpoint `/api/keys/names` | +10 |
| `db.py` | New function `get_distinct_names()` | +12 |

**Total:** ~107 lines added/modified

---

## User Flow (After Implementation)

### Scenario: Add 5 keys for same email, different providers

1. Click "Add Key" button
2. **Name field:** Type "rocky@" → Autocomplete shows existing "rocky@example.com" → Select it
3. **Provider:** Select "OpenAI" → Link "🔗 Visit OpenAI" appears → Click (opens in new tab)
4. Copy API key from OpenAI dashboard
5. Paste API key → Click "Save"
6. ✅ **Success toast** → Modal **stays open**
7. **Name field:** Still shows "rocky@example.com" (preserved)
8. **Other fields:** Reset to default
9. **Provider:** Select "Anthropic" → Link changes to "🔗 Visit Anthropic"
10. Copy API key from Anthropic dashboard
11. Paste API key → Click "Save"
12. ✅ **Success toast** → Modal **stays open**
13. Repeat for Google, Groq, DeepSeek...
14. Click "Close" → All fields reset

**Time saved:** ~70% reduction in repetitive input

---

## Testing Checklist

### Modal Behavior
- [ ] Add key success → Modal stays open
- [ ] Add key success → Fields reset except name
- [ ] Add key error → Modal stays open
- [ ] Add key error → All fields preserved
- [ ] Close modal manually → All fields reset

### Name Autocomplete
- [ ] Open modal → Datalist populated with existing names
- [ ] Type partial name → Autocomplete suggestions appear
- [ ] Select from autocomplete → Value filled
- [ ] Input new name → Works normally
- [ ] Input email with uppercase → Saved as lowercase
- [ ] Input "Rocky@Example.COM" → Saved as "rocky@example.com"

### Provider Link
- [ ] No provider selected → Link hidden
- [ ] Select provider with website_url → Link appears
- [ ] Link text shows provider display_name
- [ ] Click link → Opens in new tab
- [ ] Select provider without website_url → Link hidden
- [ ] Change provider → Link updates dynamically

### Backend
- [ ] GET `/api/keys/names` → Returns array of distinct names
- [ ] Empty database → Returns empty array
- [ ] Names sorted alphabetically

---

## Edge Cases

1. **Empty name field:** Validation should prevent save
2. **Duplicate key:** Show error, preserve all fields
3. **Network error during autocomplete:** Fail silently, allow manual input
4. **Provider API error:** Hide link, allow form submission
5. **Very long name list (100+):** Datalist handles natively (browser scrollable)

---

## Future Enhancements (Out of Scope)

- [ ] Provider link → Direct to signup page (not just homepage)
- [ ] Remember last used provider per session
- [ ] Bulk add: CSV upload with same name for all rows
- [ ] Keyboard shortcut: Ctrl+Enter to save and stay open

---

## Notes

- Datalist is native HTML5 (no library needed)
- Provider link uses existing `website_url` from providers table
- Email lowercase conversion is client-side (before API call)
- Modal behavior change is non-breaking (existing edit flow unchanged)
