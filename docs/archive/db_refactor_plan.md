# Database Refactoring Plan - API Key Manager Flask

## 1. Overview and Rationale

The current `db.py` implementation performs filtering and pagination in Python memory after fetching all records from the database. This is inefficient for large datasets and unnecessarily consumes application memory and CPU cycles. Additionally, the database initialization (`init_db`) is not explicitly called anywhere, which means the table might not be created if the `apikey.db` file doesn't exist or is empty. There is also a potential SQL injection vulnerability in the `update` function as column names are directly interpolated into the query.

This plan aims to address these issues by:
- Moving filtering and pagination logic to the SQLite database level.
- Ensuring proper database initialization upon application startup.
- Implementing robust security measures against SQL injection in the `update` function.
- Enhancing `get_providers` to return counts for each provider.

## 2. Proposed Changes

### 2.1. `db.py` Modifications

#### `get_conn()`
- Remove `os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)` from `get_conn()` and move it to `init_db()` to centralize directory creation.

#### `init_db()`
- Ensure `os.makedirs` is called here.
- This function will be called during application startup to guarantee the database schema is initialized.

#### `get_all(page, per_page, provider, status, search)`
- **Purpose**: Implement server-side filtering, searching, and pagination directly in the SQL query.
- **Logic**:
    - Construct a base SQL query `SELECT * FROM api_keys WHERE 1=1`.
    - Dynamically append `AND` clauses for `provider`, `isActive` (status), and `search` parameters using parameterized queries to prevent SQL injection.
    - For `search`, use `LOWER()` and `LIKE` with wildcards (`%`).
    - Before applying `LIMIT` and `OFFSET`, execute a `COUNT(*)` query with the same filters to get the total number of matching records.
    - Apply `ORDER BY provider, name`, `LIMIT ?`, and `OFFSET ?` for pagination.
    - Return a tuple containing the list of API keys (as dictionaries) and the total count.

#### `update(id, **kwargs)`
- **Purpose**: Securely update API key records.
- **Security Enhancement**:
    - Define a `ALLOWED_COLUMNS` set (e.g., `{"provider", "name", "apiKey", "authType", "isActive", "notes"}`).
    - Filter `kwargs` to ensure only allowed columns are included in the `SET` clause of the SQL query. This prevents malicious injection of arbitrary column names.
    - Use parameterized queries for all values.

#### `get_providers()`
- **Purpose**: Retrieve a list of unique providers along with the count of API keys for each.
- **Logic**:
    - Modify the SQL query to `SELECT provider, COUNT(*) as count FROM api_keys GROUP BY provider ORDER BY provider`.
    - Return a list of dictionaries, where each dictionary contains `provider` and `count`.

### 2.2. `app.py` Modifications

#### Application Startup
- Call `db.init_db()` when the Flask application starts, preferably within an application context or before `app.run()`.

#### `/api/keys` GET Route
- **Purpose**: Integrate the new server-side filtering and pagination from `db.get_all()`.
- **Logic**:
    - Pass `page`, `per_page`, `provider`, `status`, and `search` query parameters directly to `db.get_all()`.
    - Receive the paginated `keys` and `total` count from `db.get_all()`.
    - Construct the `jsonify` response with `data`, `total`, `page`, `per_page`, and `pages` (calculated from `total` and `per_page`).

#### `/api/providers` GET Route
- **Purpose**: Integrate the new `get_providers()` that returns counts.
- **Logic**:
    - Call `db.get_providers()` and return the result directly. The frontend will be updated to consume this new format.

### 2.3. `templates/index.html` (Frontend JS) Modifications

#### `populateProviders()`
- **Purpose**: Update sidebar and dropdowns to display provider counts.
- **Logic**:
    - Adjust how providers are rendered in the sidebar (if applicable) and filter dropdowns to show `(count)` next to each provider name.
    - Update the `providerDatalist` for the add form to reflect the new structure.

#### `renderKeys()`
- **Purpose**: Adjust rendering logic if `isActive` status changes its representation (e.g., boolean vs. integer).

#### `loadKeys()`
- **Purpose**: Ensure that the `status` parameter is correctly passed to the backend, especially handling cases where it's an empty string.

## 3. Test Plan

1.  **Unit Tests (Manual / `python -m py_compile`)**:
    - Run `python -m py_compile app.py` and `python -m py_compile db.py` to ensure no syntax errors.
2.  **Database Initialization**:
    - Delete `data/apikey.db`.
    - Run `python app.py` and verify `apikey.db` is created with the `api_keys` table.
3.  **`get_all()` with Filtering and Pagination**:
    - Add various test data to `apikey.db`.
    - Test `/api/keys` endpoint with different combinations of `page`, `per_page`, `provider`, `status`, and `search` parameters.
    - Verify correct data is returned, and pagination/filtering works as expected.
    - Verify `total` and `pages` values in the JSON response are accurate.
4.  **`update()` Security**:
    - Attempt to update a key with an invalid column name (e.g., `invalid_col='value'`). Verify the update fails or the invalid column is ignored, and no SQL error occurs.
    - Verify updates to valid columns work correctly.
5.  **`get_providers()`**:
    - Verify `/api/providers` returns providers with correct counts.
6.  **Frontend Integration**:
    - Run the application (`python app.py`).
    - Manually test all UI elements:
        - Sidebar navigation.
        - API Key table display, search, and filters.
        - Add New API Key form.
        - Edit modal.
        - Export functionality.
    - Ensure provider counts are displayed correctly in the sidebar and dropdowns.
    - Verify toast notifications appear correctly for add/delete/update operations.

## 4. Rollback Plan

- If issues arise during implementation or testing, revert all changes to `db.py`, `app.py`, and `templates/index.html` to their state prior to this refactoring. The current `db.py` logic, while inefficient, is stable.