# SalinDugo User Manual

Last reviewed: June 18, 2026

## 1. System Overview

SalinDugo is a blood demand forecasting and inventory planning system for blood centers and hospitals. It combines:

- A React/Vite frontend for users and hospital operators.
- A Node.js/Express backend for authentication, profiles, imports, location lookup, and forecast proxy endpoints.
- A Python FastAPI machine learning service that generates 30-day blood demand forecasts, backtests predictions, and maps facility risk.
- A PostgreSQL database used for users, requests, imported batches, stock, inventory history, and refresh tokens.

The currently wired application flow focuses on hospital and blood center operations:

- Import blood request history.
- Audit and revert imported files.
- View live 30-day demand forecasts.
- View model backtests.
- Print executive forecast reports.
- Maintain hospital profile and account security.

Source files for donor and recipient dashboards also exist, but the active route configuration does not currently expose `/user-dashboard`, and the backend included in this repository does not include the donor/request/schedule/notification route modules required by those screens. See "Implementation Status Notes" for details.

## 2. User Roles

### Public Visitor

Public visitors can open the landing page, review product information, go to login, open registration, and view the Terms and Privacy pages.

### Hospital / Blood Center User

Hospital users are the main active users in the current system. They can access the hospital dashboard, import historical blood request records, audit imports, view forecasts, print reports, update profile information, and change passwords.

## 3. Main Application Routes

The active frontend routes are:

| Route                 | Purpose                                                                     | Access        |
| --------------------- | --------------------------------------------------------------------------- | ------------- |
| `/`                   | Landing page. Logged-in hospitals are redirected to the hospital dashboard. | Public        |
| `/login`              | Sign in and password reset request.                                         | Public        |
| `/register`           | Account registration.                                                       | Public        |
| `/reset-password`     | Reset password using an emailed token.                                      | Public        |
| `/terms`              | Terms and Conditions.                                                       | Public        |
| `/privacy`            | Privacy Policy.                                                             | Public        |
| `/profile`            | User or hospital profile settings.                                          | Authenticated |
| `/change-password`    | Change account password.                                                    | Authenticated |
| `/hospital-dashboard` | Hospital forecasting, reporting, import, and audit dashboard.               | Hospital role |
| `/import-data`        | Import page, also available inside the hospital dashboard.                  | Hospital role |

If a logged-in user has not completed their profile, private routes redirect them to `/profile` first.

## 4. Account Access

### Sign In

1. Open `/login`.
2. Enter email address and password.
3. Select **Sign In**.
4. Hospital users are redirected to `/hospital-dashboard`.

If login fails, check that the email and password are correct. Multiple failed login attempts are rate-limited.

### Register

1. Open `/register`.
2. Enter personal information: name, email, age, phone number, date of birth, gender, civil status, and blood type.
3. Create and confirm a strong password.
4. Accept the required consent checkboxes.
5. Select **Create Account**.

Password requirements:

- At least 8 characters.
- At least one lowercase letter.
- At least one uppercase letter.
- At least one number.
- At least one special character.

Important: the current registration form does not expose a role selector. Unless a role is supplied another way, the backend defaults new registrations to `user`. Hospital accounts may need to be provisioned directly in the database or through a separate admin process.

### Forgot Password

1. Open `/login`.
2. Select **Forgot your password?**
3. Enter the account email address.
4. Select **Send Email**.
5. Open the reset link from the email.
6. Enter and confirm the new password on `/reset-password`.

Password reset links expire after 1 hour.

### Change Password

1. Sign in.
2. Open **Settings** then **Change Password**, or go to `/change-password`.
3. Enter the current password.
4. Enter and confirm a new password.
5. Select **Change Password**.

The new password must satisfy the same password rules used during registration.

### Sign Out

Use the **Sign Out** button in the top navigation. This clears the stored user session from the browser.

## 5. Profile Setup

The profile page is used by both hospital and user accounts.

### Open Profile

1. Sign in.
2. Open **Settings** then **Profile**, or go to `/profile`.
3. Select **Edit Profile**.
4. Update available fields.
5. Select **Save Changes**.

### Hospital Profile Fields

Hospital accounts can view their blood center name and update contact and location information. The blood center name is shown as read-only in the current profile UI.

Location fields include:

- Region.
- Full address.
- Province.
- City or municipality.
- Barangay.
- Zip code.
- Latitude.
- Longitude.

### Location Search and Map

The profile page supports address lookup through the backend location proxy, which calls OpenStreetMap Nominatim.

To update location:

1. Select **Edit Profile**.
2. Enter an address in the search field.
3. Select **Search**.
4. Review the auto-filled address fields.
5. Optionally click the map to set a more precise latitude and longitude.
6. Select **Save Changes**.

Accurate hospital coordinates are important for forecast map views and donor directions.

### Donor Profile Fields

For donor or recipient accounts, the profile page also includes medical and identity fields such as blood type, date of birth, age, weight, height, medical conditions, allergies, and civil status. New donor users are required to complete profile fields before dashboard access.

## 6. Hospital Dashboard

The hospital dashboard is the main operational workspace. It is available at `/hospital-dashboard` for accounts with the `hospital` role.

The sidebar contains:

- **Forecasting** - live demand forecasts and model backtesting.
- **Print Report** - print-friendly forecast summary.
- **Import Data** - upload blood request history.
- **Data Audit** - trace, inspect, and revert upload batches.
- **Settings** - profile and password management.
- **Help** - short usage guidance.

## 7. Import Blood Requests

The Import Data screen accepts historical blood request records. These records become the main demand signal used by the forecasting engine.

### Supported Files

- CSV.
- XLSX.
- Maximum upload size: 2 MB.

The UI provides a **Download Template** button with this format:

```csv
request_date,blood_type,units_needed,status
2026-03-01,O+,3,fulfilled
2026-03-02,A+,2,fulfilled
```

### Required Columns

Column names must match exactly:

| Column         | Description                                                         | Example      |
| -------------- | ------------------------------------------------------------------- | ------------ |
| `request_date` | Date of the request. Strings must use `YYYY-MM-DD`.                 | `2026-03-01` |
| `blood_type`   | Blood type requested.                                               | `O+`         |
| `units_needed` | Number of units requested. Must be a valid number and not negative. | `3`          |
| `status`       | Request status.                                                     | `fulfilled`  |

Valid blood types:

- `A+`
- `A-`
- `B+`
- `B-`
- `AB+`
- `AB-`
- `O+`
- `O-`

Valid statuses:

- `open`
- `matched`
- `fulfilled`
- `cancelled`

Cancelled requests are excluded from the machine learning history query.

### Date Rules

For text values, dates must be exactly `YYYY-MM-DD`, such as `2026-05-03`. Ambiguous formats such as `5/3/2026` or `May 3, 2026` are rejected.

Excel date cells and Excel serial date numbers are accepted by the backend parser.

### Upload Steps

1. Open **Hospital Dashboard**.
2. Select **Import Data**.
3. Enter your name in **Your name (for trace)**.
4. Choose or drop a CSV/XLSX file.
5. Review the file preview.
6. Select **Upload Requests Data**.
7. Review the confirmation dialog.
8. Select **Confirm upload**.

The upload is stored as a batch with:

- Uploading staff name.
- Filename.
- Row count.
- Earliest and latest request date.
- Created timestamp.

### Daily Upload Banner

The import screen checks whether any batch has already been uploaded today in the browser's local timezone. If data has already been uploaded, the system warns the user before they continue.

### Duplicate Date Protection

The backend blocks an upload if any request date in the file already exists for the same hospital. This prevents duplicated historical demand from inflating forecasts.

If an upload is blocked:

1. Review the conflict modal.
2. Note the conflicting date ranges and related batches.
3. Open **Data Audit**.
4. Revert the old batch if appropriate.
5. Re-upload the corrected file.

If conflicting records are legacy records without a batch ID, they cannot be reverted from the UI and require database/admin cleanup.

## 8. Data Audit

The Data Audit tab tracks uploaded request batches and allows operators to inspect or revert them.

### Audit Summary

The top cards show:

- Total uploads.
- Total rows imported.
- Unique personnel names recorded on uploads.
- Last upload date and time.

The page also shows whether data has been uploaded today.

### Search and Filter

Use the filters to narrow upload history by:

- Uploader name.
- Filename.
- Upload date.

### View Batch Details

1. Open **Data Audit**.
2. Find the upload batch.
3. Select **View**.

The modal shows:

- Uploaded by.
- Filename.
- Row count.
- Date range.
- A sample table of inserted request rows, up to 500 rows.

### Revert a Batch

1. Open **Data Audit**.
2. Find the upload batch.
3. Select **Revert**.
4. Read the confirmation message.
5. Select **Revert upload**.

Reverting deletes the batch and the request rows linked to that batch. This cannot be undone except by re-importing the file.

## 9. Forecasting

The Forecasting tab has two modes:

- **Live Forecast** - the normal 30-day forecast view.
- **Backtest** - compares past predictions against actual historical demand.

### Live Forecast

Live Forecast loads:

- Historical total demand.
- Historical demand by blood type.
- 30-day total forecast.
- 30-day forecast by blood type.

Key cards include:

- 30-Day Total Demand.
- Peak Daily Demand.
- Top Blood Type over 30 days.
- Top Blood Type over 7 days.
- Year-over-Year Demand.

Main visual sections include:

- **Total Demand Forecast** - predicted total daily demand.
- **Demand Change** - day-to-day acceleration or decline.
- **30-Day Demand Budget by Blood Type** - total projected units by blood type.
- **Demand by Blood Type** - trend lines by blood type.
- **High-Demand Streak Alerts** - blood types forecasted to stay above recent baseline for at least 3 days.
- **7-Day Demand Trend by Blood Type** - next 7 days compared with recent actual demand.
- **Per Blood Type Forecast with Confidence Range** - selected blood type forecast with 80% and 95% confidence interval options.

### Confidence Intervals

Confidence intervals are residual-based. The ML service computes residual standard deviation from backtest results per blood type and applies:

- 80% interval.
- 95% interval.

If residual data is not available for a blood type, the interval may be unavailable.

### Custom Chart Printing

The Forecasting tab includes **Print Custom Charts**.

1. Select **Print Custom Charts**.
2. Select the chart cards to include.
3. Use **Select all** or **Clear** if needed.
4. Select **Print**.

Selected charts are formatted for printing.

## 10. Backtesting

Backtest mode evaluates the forecasting model against actual historical data.

The current backtest period is:

- Training cutoff: September 30, 2025.
- Test window: October 1, 2025 to October 31, 2025.

Backtest outputs include:

- Total demand actual vs predicted chart.
- Per-blood-type actual vs predicted chart.
- Model metrics.
- Lag-1 baseline metrics.
- Actual total.
- Predicted total.
- Difference.
- Percentage error.

Metrics shown:

- **RMSE** - Root Mean Squared Error. Penalizes larger misses more strongly.
- **MAE** - Mean Absolute Error. Average raw unit error.
- **MAPE** - Mean Absolute Percentage Error. Percentage-based error where actual demand is nonzero.

The lag-1 baseline is used to compare the model against a simple "yesterday predicts today" style baseline.

## 11. Print Report

The Print Report tab generates a print-friendly report using forecast data.

### Use the Report

1. Open **Hospital Dashboard**.
2. Select **Print Report**.
3. Choose the report date range inside the available forecast window.
4. Optionally select a quick preset: first 7, 14, or 30 days.
5. Select **Print Report**.

The report includes:

- Hospital name and location.
- Forecast period and generation timestamp.
- Executive summary.
- Total demand.
- Average daily demand.
- Peak and lowest demand days.
- Top blood type.
- Year-over-year comparison when historical data is available.
- Total demand forecast chart.
- Demand by blood type chart.
- Average demand by weekday.
- Blood type trend chart.
- Detailed blood type breakdown table.
- Highest demand days table.

Use the report alongside current stock, procurement plans, and donation schedules.

## 12. Forecast Map

The source includes a forecast map component that calls `/api/forecast-map`. The ML service builds this map from hospitals with latitude and longitude.

The map classifies facilities by stock coverage:

- **Critical** - 3 days of cover or less.
- **Warning** - more than 3 and up to 7 days of cover.
- **Safe** - more than 7 days of cover, or no forecasted demand.

The map displays:

- Facility name.
- Current stock.
- 30-day predicted demand.
- Estimated days cover.
- Risk level.

Note: the active hospital dashboard imports the forecasting tab, report tab, import tab, and audit tab. The forecast map component is present in source and can be used where mounted.

## 13. Machine Learning Forecasting Engine

The ML engine is implemented in `salindugo_ml_engine/forecast_service.py`.

### Data Used

The ML service reads from the `requests` table:

- Groups demand by request date and blood type.
- Sums `units_needed`.
- Excludes cancelled requests.
- Fills missing dates with zero demand per blood type.

### Model

The service loads `model/xgboost_real.pkl`.

Forecasting uses engineered lag, rolling, exponential moving average, zero-demand, spike, weekday, month, and seasonal sine/cosine features.

If there is not enough history for a blood type, or a model is missing for that blood type, the service uses a fallback based on recent averages.

### ML Endpoints

The ML service exposes:

| Endpoint                        | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `/forecast/{hospital_id}`       | 30-day forecast by blood type.      |
| `/forecast-total/{hospital_id}` | 30-day total forecast.              |
| `/history-total/{hospital_id}`  | Historical total demand.            |
| `/history/{hospital_id}`        | Historical demand by blood type.    |
| `/backtest/{hospital_id}`       | Model backtest results and metrics. |
| `/forecast-map`                 | Facility risk map data.             |

The Node backend proxies these through `/api/...` routes for the frontend.

## 14. Backend API Summary

The active Node/Express backend exposes:

### Authentication

| Method | Route                       | Purpose                             |
| ------ | --------------------------- | ----------------------------------- |
| POST   | `/api/auth/register`        | Register a user.                    |
| POST   | `/api/auth/login`           | Sign in.                            |
| POST   | `/api/auth/logout`          | Revoke refresh token.               |
| POST   | `/api/auth/refresh-token`   | Issue a new access token.           |
| PATCH  | `/api/auth/change-password` | Change password for logged-in user. |
| POST   | `/api/auth/forgot-password` | Email password reset link.          |
| POST   | `/api/auth/reset-password`  | Reset password using token.         |

### Profiles

| Method | Route            | Purpose              |
| ------ | ---------------- | -------------------- |
| GET    | `/api/users/:id` | Get user profile.    |
| PATCH  | `/api/users/:id` | Update user profile. |

### Location

| Method | Route                                   | Purpose                      |
| ------ | --------------------------------------- | ---------------------------- |
| GET    | `/api/location/search?q=...`            | Forward geocode an address.  |
| GET    | `/api/location/reverse?lat=...&lon=...` | Reverse geocode coordinates. |

### Import

All import routes require authentication.

| Method | Route                             | Purpose                       |
| ------ | --------------------------------- | ----------------------------- |
| POST   | `/api/import/requests`            | Upload blood request history. |
| POST   | `/api/import/stocks`              | Upload stock counts.          |
| POST   | `/api/import/inventory-history`   | Upload inventory history.     |
| GET    | `/api/import/batches`             | List import batches.          |
| GET    | `/api/import/batches/:id`         | View a batch and sample rows. |
| DELETE | `/api/import/batches/:id`         | Revert a batch.               |
| GET    | `/api/import/today-status?tz=...` | Check today's import status.  |

Only request import is currently exposed in the main import UI. Stock and inventory-history import endpoints exist in the backend but are not wired into the active import page.

### Forecast Proxy

| Method | Route                     | Purpose                             |
| ------ | ------------------------- | ----------------------------------- |
| GET    | `/api/forecast/:centerId` | Proxy ML forecast by blood type.    |
| GET    | `/api/forecast-total/:id` | Proxy ML total forecast.            |
| GET    | `/api/history-total/:id`  | Proxy ML historical totals.         |
| GET    | `/api/history/:id`        | Proxy ML historical demand by type. |
| GET    | `/api/backtest/:id`       | Proxy ML backtest.                  |
| GET    | `/api/forecast-map`       | Proxy ML forecast map.              |

## 15. Data and Database Notes

The code references these main tables:

- `users`
- `refresh_tokens`
- `requests`
- `import_batches`
- `blood_stocks`
- `inventory_history`

The import route creates or updates parts of the schema automatically:

- Creates `import_batches` if missing.
- Adds `batch_id` to `requests` if missing.
- Adds indexes for batch lookup and request batch IDs.

The rest of the database schema must exist before the system can run correctly.

## 16. Operator Setup

These steps are for running the system locally.

### Frontend

From `salindugo_frontend`:

```bash
npm install
npm run dev
```

Required frontend environment variable:

```env
VITE_API_URL=http://localhost:5000
```

The frontend expects `VITE_API_URL` to be the backend origin. Most frontend calls append `/api/...`.

### Backend

From `salindugo_backend`:

```bash
npm install
npm run dev
```

Or for production:

```bash
npm start
```

Recommended backend environment variables:

```env
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH=...
REDIS_URL=redis://...
BREVO_MAIL=...
EMAIL_USER=...
FRONTEND_URL=http://localhost:5173
ML_API_URL=http://localhost:8000
```

The backend uses Redis-backed rate limiting, so `REDIS_URL` must be available.

### ML Engine

From `salindugo_ml_engine`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn forecast_service:app --reload --host 0.0.0.0 --port 8000
```

Required ML environment variable:

```env
DATABASE_URL=postgresql://...
```

The model file must exist at:

```text
salindugo_ml_engine/model/xgboost_real.pkl
```

### Startup Order

1. Start PostgreSQL and Redis.
2. Start the ML engine.
3. Start the backend.
4. Start the frontend.
5. Sign in with a hospital account.

## 17. Deployment Notes

The frontend includes `vercel.json` with a rewrite to `/`, which supports client-side React routing on Vercel.

The backend includes `railway.toml` and is configured for Railway/Nixpacks with Node.js 20.

The ML engine must be deployed as a separate Python/FastAPI service and referenced by backend `ML_API_URL`.

## 18. Troubleshooting

### I am redirected to the profile page.

Your account has `profile_completed` set to false. Complete and save your profile before accessing private dashboard pages.

### I cannot access the hospital dashboard.

Your account must have the `hospital` role. New registrations currently default to `user` unless role provisioning is handled elsewhere.

### Forecast data is empty.

Possible causes:

- No request history has been imported for the hospital.
- Imported rows were all cancelled.
- The ML service is not running.
- `ML_API_URL` is incorrect.
- The model file is missing.
- The database does not contain enough history for model features, so fallback or empty output may occur.

### Upload is blocked because of date conflicts.

The file contains at least one date already present in the `requests` table for the hospital. Use Data Audit to inspect and revert the existing batch, then re-upload.

### Upload fails with missing columns.

Ensure the header row contains exactly:

```text
request_date,blood_type,units_needed,status
```

### Upload fails because of invalid dates.

Use `YYYY-MM-DD` for string dates. Example:

```text
2026-05-03
```

### Password reset email does not arrive.

Check:

- `BREVO_MAIL`.
- `EMAIL_USER`.
- `FRONTEND_URL`.
- Email spam folder.
- Whether the account email exists in the `users` table.

### Location search fails.

The backend location routes call OpenStreetMap Nominatim. Check network access and backend logs.

### Rate limit messages appear.

The backend rate-limits login, auth, profile reads, and profile updates. Wait for the configured window to pass before retrying.

## 19. Implementation Status Notes

The following notes reflect the source tree as reviewed on June 18, 2026:

- The active app routes do not mount `/user-dashboard`, even though `src/views/user/dashboard/page.jsx` exists.
- The registration page redirects `user` accounts to `/user-dashboard`, but the current route configuration catches unknown routes and redirects to `/`.
- The donor/recipient dashboard references backend endpoints such as `/api/requests`, `/api/schedules`, `/api/matching`, `/api/donations`, and `/api/notifications`. Those route modules are not present in the backend files included in this repository.
- Hospital components for blood requests, donation schedules, inventory, and inventory history are present in the frontend source, but the active hospital dashboard currently mounts Forecasting, Print Report, Import Data, and Data Audit.
- Backend import endpoints for stocks and inventory history exist, but the visible Import Data page currently uploads blood request files only.
- The frontend Axios refresh-token interceptor calls a refresh path without the `/api` prefix. If token refresh fails unexpectedly, signing in again should restore the session.

These notes are not end-user instructions; they are included so maintainers understand which parts of the system are production-wired and which parts need additional routing or backend work.

## 20. Quick Reference

### Normal Hospital Workflow

1. Sign in as a hospital.
2. Complete profile and location if prompted.
3. Open **Import Data**.
4. Download the template if needed.
5. Prepare a CSV/XLSX file with the required columns.
6. Upload request history.
7. Open **Data Audit** to confirm the batch.
8. Open **Forecasting** to review live demand.
9. Use **Backtest** to inspect model accuracy.
10. Open **Print Report** to generate a printable planning report.

### Required Request Import Header

```text
request_date,blood_type,units_needed,status
```

### Valid Blood Types

```text
A+, A-, B+, B-, AB+, AB-, O+, O-
```

### Valid Request Statuses

```text
open, matched, fulfilled, cancelled
```
