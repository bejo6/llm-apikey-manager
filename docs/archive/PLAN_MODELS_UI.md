# Plan: Phase 3 - Models UI

## Overview
Add UI pages for viewing and managing the models catalog in the web interface.

---

## Pages to Add

### 1. Models List Page (`pages/models.html`)
Similar to Keys page, but for models catalog.

**Features:**
- Table with columns: Provider, Model Name, Model ID, Context Length, Free Status, Rate Limits
- Search by provider/model name/model ID
- Filter by:
  - Provider (dropdown)
  - Free Status (All / Free / Paid)
  - Free Tier Type (always_free, preview, trial, credit_based)
- Pagination (5/10/25/50/100 per page)
- Actions: View Details, Edit, Delete
- "Add Model" button

**Table Columns:**
- Provider
- Model Name
- Model ID
- Context Length (e.g., "128K")
- Free Status (badge: Free/Paid)
- Free Tier Type (badge)
- Rate Limits (RPM / TPM)
- Actions (View, Edit, Delete)

---

### 2. Add Model Page (`pages/models_add.html`)
Form to add new model to catalog.

**Form Fields:**
- **Basic Info:**
  - Provider (text input with datalist)
  - Model Name (text)
  - Model ID (text)
  
- **Specifications:**
  - Context Length (number)
  - Max Input Tokens (number)
  - Max Output Tokens (number)
  - Supports Streaming (checkbox)
  - Supports Function Calling (checkbox)
  - Supports Vision (checkbox)
  
- **Pricing:**
  - Pricing Type (select: token/request/free)
  - Input Price per 1K (number, USD)
  - Output Price per 1K (number, USD)
  - Total Price per 1K (number, USD)
  
- **Free Tier:**
  - Is Free (checkbox)
  - Free Tier Type (select: always_free/preview/trial/credit_based)
  - Free Credit Amount (number, USD)
  
- **Rate Limits:**
  - Requests per Minute (number)
  - Requests per Hour (number)
  - Requests per Day (number)
  - Tokens per Minute (number)
  - Tokens per Hour (number)
  - Tokens per Day (number)
  
- **Metadata:**
  - Notes (textarea)
  - Source URL (text)

**Layout:** Multi-column form with sections (collapsible?)

---

### 3. Model Details Modal (`components/model_details_modal.html`)
Modal to view full model specifications.

**Sections:**
- Basic Info (provider, name, ID)
- Specifications (context, tokens, features)
- Pricing (type, input/output prices)
- Free Tier (status, type, credit)
- Rate Limits (all 6 types)
- Metadata (notes, source URL, last verified)

**Actions:** Edit, Close

---

### 4. Edit Model Modal (`components/model_edit_modal.html`)
Similar to Add Model form, but in modal format with pre-filled values.

---

## Backend Routes (app.py)

### New Endpoints:
```python
GET  /api/models              # Get models list (paginated, filtered)
GET  /api/models/<id>         # Get single model
POST /api/models              # Add new model
PUT  /api/models/<id>         # Update model
DELETE /api/models/<id>       # Delete model
GET  /api/models/free         # Get all free models (for export)
```

---

## JavaScript Functions (scripts/main.js.html)

### New Functions:
- `loadModels(page)` - Load models with pagination & filters
- `renderModels(models)` - Render models table
- `renderModelsPagination()` - Render pagination controls
- `addModel()` - Add new model via API
- `openModelDetailsModal(id)` - Show model details
- `openModelEditModal(id)` - Open edit modal
- `saveModelEdit()` - Save model changes
- `deleteModel(id)` - Delete model with confirmation
- `exportFreeModels()` - Export free models list (JSON)

---

## Sidebar Navigation

Add "Models" menu item:
```html
<button class="nav-item" data-page="models">
    <span class="nav-icon">🤖</span>
    <span>Models</span>
</button>
```

---

## Implementation Order

1. **Backend Routes** (`app.py`)
   - Add 6 new API endpoints
   - Use existing `db.py` functions

2. **Models List Page** (`pages/models.html`)
   - Table structure
   - Search & filters
   - Pagination

3. **Add Model Page** (`pages/models_add.html`)
   - Multi-section form
   - All fields from schema

4. **Modals** (`components/model_modals.html`)
   - Details modal (read-only)
   - Edit modal (editable form)

5. **JavaScript** (`scripts/main.js.html`)
   - All model-related functions
   - API calls
   - Event listeners

6. **Sidebar** (`components/sidebar.html`)
   - Add "Models" menu item

7. **Update index.html**
   - Include new pages
   - Include new modals

---

## UI Design Notes

### Badges
- **Free Status:** Green "Free" / Gray "Paid"
- **Free Tier Type:**
  - `always_free` → Green "Always Free"
  - `preview` → Blue "Preview"
  - `trial` → Yellow "Trial"
  - `credit_based` → Purple "Credit"

### Rate Limits Display
Show in compact format:
- "500 RPM / 200K TPM" (if both exist)
- "15 RPM" (if only RPM)
- "1M TPM" (if only TPM)
- "-" (if none)

### Context Length Display
Format large numbers:
- 128000 → "128K"
- 1000000 → "1M"
- 2000000 → "2M"

---

## Testing Checklist

- [ ] Load models page (default view)
- [ ] Search models by name/provider
- [ ] Filter by provider
- [ ] Filter by free status
- [ ] Filter by free tier type
- [ ] Pagination works
- [ ] Add new model (all fields)
- [ ] View model details (modal)
- [ ] Edit model (modal)
- [ ] Delete model (confirmation)
- [ ] Export free models (JSON)
- [ ] Navigation between pages works

---

## Optional Enhancements (Future)

- Import models from JSON/CSV
- Bulk edit (mark multiple as paid)
- Model comparison view
- Rate limit calculator
- Cost estimator
- OmniRoute config generator (export as YAML/JSON)
- Model availability checker (ping provider APIs)

---

## Notes

- Keep UI consistent with existing Keys pages
- Reuse CSS classes from `style.css`
- Use same table/form/modal patterns
- All fields optional except: provider, model_name, model_id
- NULL values display as "-" in UI
