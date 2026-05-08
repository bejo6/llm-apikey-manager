# Plan: Template Refactoring (Jinja2 Inheritance)

## Overview
Refactor large `templates/index.html` (659 lines) into modular structure using Jinja2 template inheritance and includes.

---

## Current Problem
- Single file `index.html` contains 659 lines
- Hard to maintain: HTML structure, 4 pages, modals, and JavaScript all in one file
- Difficult to locate specific sections

---

## Target Structure

```
templates/
├── base.html              # Base layout: <html>, <head>, sidebar, main wrapper
├── index.html             # Extends base, includes all page components
├── pages/
│   ├── keys.html          # Keys list page (table, search, filters, pagination)
│   ├── add.html           # Add new key page (form)
│   ├── import.html        # Import page (file upload)
│   └── export.html        # Export page (format selection)
├── components/
│   ├── sidebar.html       # Sidebar navigation
│   └── modals.html        # Edit modal & Delete confirmation modal
└── scripts/
    └── main.js.html       # JavaScript code (kept as .html for Jinja2 variables)
```

---

## Implementation Steps

### 1. Create `base.html`
- `<!DOCTYPE html>`, `<head>` with CSS link
- `<body>` structure with sidebar placeholder and main content block
- Include scripts at bottom
- Define Jinja2 blocks: `{% block content %}`, `{% block scripts %}`

### 2. Create `components/sidebar.html`
- Extract sidebar HTML (lines ~10-40 from current index.html)
- Keep navigation items and provider list section
- Can be included in base.html: `{% include 'components/sidebar.html' %}`

### 3. Create `components/modals.html`
- Extract edit modal (lines ~200-250)
- Extract delete confirmation modal (lines ~250-280)
- Include in index.html or base.html

### 4. Create `pages/keys.html`
- Extract "Keys Page" section (lines ~44-94)
- Contains: page header, search bar, filters, table, pagination

### 5. Create `pages/add.html`
- Extract "Add Page" section (lines ~96-140)
- Contains: page header, form with provider datalist

### 6. Create `pages/import.html`
- Extract "Import Page" section (lines ~141-166)
- Contains: page header, file input, import button, result display

### 7. Create `pages/export.html`
- Extract "Export Page" section (lines ~168-210)
- Contains: page header, format/provider selectors, export button

### 8. Create `scripts/main.js.html`
- Extract all `<script>` content (lines ~300-659)
- Keep as `.html` extension so Jinja2 can process `{{ url_for() }}` if needed
- Include at bottom of base.html or index.html

### 9. Update `index.html`
- Extend base.html: `{% extends 'base.html' %}`
- Include all page components in content block
- Include modals

---

## File Breakdown (Estimated Lines)

| File | Lines | Content |
|------|-------|---------|
| `base.html` | ~30 | HTML structure, head, body wrapper |
| `components/sidebar.html` | ~30 | Sidebar navigation |
| `components/modals.html` | ~80 | Edit & delete modals |
| `pages/keys.html` | ~50 | Keys list page |
| `pages/add.html` | ~45 | Add key form |
| `pages/import.html` | ~25 | Import file upload |
| `pages/export.html` | ~45 | Export options |
| `scripts/main.js.html` | ~350 | All JavaScript |
| `index.html` | ~15 | Extends base, includes pages |

**Total:** ~670 lines (split into 9 files)

---

## Benefits

1. **Maintainability** - Each file has single responsibility
2. **Readability** - Easy to find specific sections
3. **Reusability** - Components can be reused
4. **Scalability** - Easy to add new pages
5. **Collaboration** - Multiple devs can work on different files

---

## Testing Plan

1. Start Flask app: `python app.py`
2. Verify all pages render correctly:
   - Keys page (default)
   - Add page
   - Import page
   - Export page
3. Test navigation (sidebar buttons)
4. Test all JavaScript functions:
   - Load keys
   - Add key
   - Edit key (modal)
   - Delete key (modal)
   - Import (JSON/CSV)
   - Export (JSON/CSV/.env)
   - Search & filters
   - Pagination
5. Verify no console errors

---

## Rollback Plan

If refactor breaks something:
- Git has the working version in previous commit
- Can revert with: `git checkout HEAD~1 templates/index.html`

---

## Notes

- Keep JavaScript in `.html` file (not `.js`) so Jinja2 can process `{{ url_for() }}`
- Maintain exact same HTML structure and IDs (JavaScript depends on them)
- No functional changes - pure refactoring
- CSS stays in `static/style.css` (no changes needed)
