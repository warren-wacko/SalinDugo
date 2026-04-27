from fastapi import FastAPI
import joblib
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import mean_squared_error, mean_absolute_error

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://salin-dugo.vercel.app/",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TARGET = "blood_requests"

# ====================================================
# FEATURES — must match training FEATURES list exactly
# ====================================================
FEATURES = [
    "lag_1", "lag_2", "lag_3", "lag_7", "lag_14",
    "diff_1", "diff_7",
    "roll_mean_7", "roll_std_7", "roll_max_7",
    "roll_mean_3",
    "roll_max_14", "roll_std_14",
    "ewm_7",
    "is_zero_lag1",
    "zero_streak",
    "spike_flag",
    "weekday", "month", "is_weekend",
    "sin_week", "cos_week",
    "sin_month", "cos_month",
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
models   = joblib.load(os.path.join(BASE_DIR, "model/xgboost_real.pkl"))
engine   = create_engine(os.getenv("DATABASE_URL"))


# ====================================================
# LOAD DATA
# ====================================================
def load_center_history(hospital_id):
    query = """
        SELECT
            DATE(request_date) AS date,
            blood_type,
            SUM(units_needed) AS blood_requests
        FROM requests
        WHERE hospital_id = %s
          AND (status IS NULL OR status != 'cancelled')
        GROUP BY DATE(request_date), blood_type
        ORDER BY date
    """
    return pd.read_sql(query, engine, params=(hospital_id,))


# ====================================================
# COMPLETE MISSING DATES
# ====================================================
def complete_missing_dates(df):
    df["date"] = pd.to_datetime(df["date"])
    all_filled = []

    for bt in df["blood_type"].unique():
        sub        = df[df["blood_type"] == bt].copy()
        full_range = pd.date_range(sub["date"].min(), sub["date"].max(), freq="D")

        sub = (
            sub.set_index("date")
            .reindex(full_range)
            .rename_axis("date")
            .reset_index()
        )
        sub["blood_type"]     = bt
        sub["blood_requests"] = sub["blood_requests"].fillna(0)
        all_filled.append(sub)

    return pd.concat(all_filled, ignore_index=True)


# ====================================================
# FEATURE ENGINEERING — mirrors training exactly
# ====================================================
def build_features(df):
    df["blood_type"] = df["blood_type"].str.strip().str.upper()
    groups = []

    for bt, g in df.groupby("blood_type"):
        g = g.sort_values("date").copy()

        g["lag_1"]  = g[TARGET].shift(1)
        g["lag_2"]  = g[TARGET].shift(2)
        g["lag_3"]  = g[TARGET].shift(3)
        g["lag_7"]  = g[TARGET].shift(7)
        g["lag_14"] = g[TARGET].shift(14)

        g["is_zero_lag1"] = (g["lag_1"] == 0).astype(int)

        is_zero_series = (g[TARGET].shift(1) == 0).astype(int)
        streak = []
        count  = 0
        for val in is_zero_series:
            if val == 1:
                count += 1
            else:
                count = 0
            streak.append(count)
        g["zero_streak"] = streak

        g["diff_1"] = g["lag_1"] - g["lag_2"]
        g["diff_7"] = g["lag_7"] - g["lag_14"]

        shifted = g[TARGET].shift(1)

        g["roll_mean_3"]  = shifted.rolling(3).mean()
        g["roll_mean_7"]  = shifted.rolling(7).mean()
        g["roll_std_7"]   = shifted.rolling(7).std()
        g["roll_max_7"]   = shifted.rolling(7).max()
        g["roll_max_14"]  = shifted.rolling(14).max()
        g["roll_std_14"]  = shifted.rolling(14).std()
        g["ewm_7"]        = shifted.ewm(span=7, adjust=False).mean()

        g["spike_flag"] = (
            (g["lag_1"] > g["roll_mean_7"] * 2) & (g["roll_mean_7"] > 0)
        ).astype(int)

        g["weekday"]    = g["date"].dt.weekday
        g["month"]      = g["date"].dt.month
        g["is_weekend"] = g["weekday"].isin([5, 6]).astype(int)

        g["sin_week"]  = np.sin(2 * np.pi * g["weekday"] / 7)
        g["cos_week"]  = np.cos(2 * np.pi * g["weekday"] / 7)
        g["sin_month"] = np.sin(2 * np.pi * g["month"] / 12)
        g["cos_month"] = np.cos(2 * np.pi * g["month"] / 12)

        groups.append(g)

    return pd.concat(groups, ignore_index=True).dropna().reset_index(drop=True)


# ====================================================
# COMPUTE FEATURES FOR ONE FUTURE STEP
# ====================================================
def compute_row_features(hist: pd.Series, new_date: pd.Timestamp) -> dict:
    lag_1  = float(hist.iloc[-1])
    lag_2  = float(hist.iloc[-2])
    lag_3  = float(hist.iloc[-3])
    lag_7  = float(hist.iloc[-7])
    lag_14 = float(hist.iloc[-14])

    diff_1 = lag_1 - lag_2
    diff_7 = lag_7 - lag_14

    tail_3  = hist.tail(3)
    tail_7  = hist.tail(7)
    tail_14 = hist.tail(14)

    roll_mean_3 = float(tail_3.mean())
    roll_mean_7 = float(tail_7.mean())
    roll_std_7  = float(tail_7.std())  if len(tail_7)  > 1 else 0.0
    roll_max_7  = float(tail_7.max())
    roll_max_14 = float(tail_14.max())
    roll_std_14 = float(tail_14.std()) if len(tail_14) > 1 else 0.0
    ewm_7       = float(hist.ewm(span=7, adjust=False).mean().iloc[-1])

    is_zero_lag1 = int(lag_1 == 0)

    zero_streak = 0
    for v in reversed(hist.values):
        if v == 0:
            zero_streak += 1
        else:
            break

    spike_flag = int((lag_1 > roll_mean_7 * 2) and (roll_mean_7 > 0))

    weekday    = new_date.weekday()
    month      = new_date.month
    is_weekend = int(weekday in [5, 6])

    return {
        "lag_1":        lag_1,
        "lag_2":        lag_2,
        "lag_3":        lag_3,
        "lag_7":        lag_7,
        "lag_14":       lag_14,
        "diff_1":       diff_1,
        "diff_7":       diff_7,
        "roll_mean_7":  roll_mean_7,
        "roll_std_7":   roll_std_7,
        "roll_max_7":   roll_max_7,
        "roll_mean_3":  roll_mean_3,
        "roll_max_14":  roll_max_14,
        "roll_std_14":  roll_std_14,
        "ewm_7":        ewm_7,
        "is_zero_lag1": is_zero_lag1,
        "zero_streak":  zero_streak,
        "spike_flag":   spike_flag,
        "weekday":      weekday,
        "month":        month,
        "is_weekend":   is_weekend,
        "sin_week":     np.sin(2 * np.pi * weekday / 7),
        "cos_week":     np.cos(2 * np.pi * weekday / 7),
        "sin_month":    np.sin(2 * np.pi * month / 12),
        "cos_month":    np.cos(2 * np.pi * month / 12),
    }


# ====================================================
# SOFT PREDICTION
#
# FIX 3: replaces hard binary (prob < thr → 0).
# Scales prediction down for mid-confidence probs
# to eliminate the cliff edge that inflates MAE.
#
# prob < soft_floor              → hard 0
# soft_floor ≤ prob < threshold  → partial (scaled by prob)
# prob ≥ threshold               → full prediction
# ====================================================
def soft_predict_scalar(clf, reg, X_future, threshold, soft_floor):
    prob = clf.predict_proba(X_future)[0][1]

    if prob < soft_floor:
        return 0.0

    raw = float(reg.predict(X_future)[0])

    if prob < threshold:
        # Dampen proportionally between soft_floor and threshold
        scale = (prob - soft_floor) / (threshold - soft_floor)
        return raw * scale

    return raw


# ====================================================
# RECURSIVE FORECAST
# ====================================================
def recursive_forecast_with_meta(models, df, days_ahead=30):
    future_predictions = []
    working_df         = df.copy()

    if working_df.empty:
        return pd.DataFrame()

    last_date = working_df["date"].max()

    for step in range(1, days_ahead + 1):
        new_date = last_date + pd.Timedelta(days=step)

        for bt in working_df["blood_type"].unique():
            sub  = working_df[working_df["blood_type"] == bt].sort_values("date")
            hist = sub["blood_requests"].reset_index(drop=True)

            # ── FALLBACK ───────────────────────────────
            if len(hist) < 14 or bt not in models:
                if len(hist) >= 7:
                    pred = float(hist.tail(7).mean())
                elif len(hist) > 0:
                    pred = float(hist.mean())
                else:
                    pred = 0.0

                pred      = max(0.0, round(pred, 2))
                pred_type = "fallback"

            # ── MODEL ──────────────────────────────────
            else:
                clf = models[bt]["clf"]
                reg = models[bt]["reg"]

                row      = compute_row_features(hist, new_date)
                X_future = pd.DataFrame([row])[FEATURES].fillna(0)

                # 🔥 Get probability (demand likelihood)
                prob = float(clf.predict_proba(X_future)[0][1])

                # 🔥 Get regression output (magnitude)
                reg_pred = float(reg.predict(X_future)[0])

                # 🔥 Smooth gating (NO thresholds, NO hard cuts)
                raw_pred = prob * reg_pred

                # 🔥 Optional: light spike correction (very conservative)
                if raw_pred > 10:
                    raw_pred *= 1.05

                pred = max(0, round(raw_pred))
                pred_type = "model"

            new_row = {
                "date":            new_date,
                "blood_type":      bt,
                "blood_requests":  pred,
                "prediction_type": pred_type,
            }

            future_predictions.append(new_row)

            working_df = pd.concat(
                [working_df, pd.DataFrame([new_row])],
                ignore_index=True,
            )

    return pd.DataFrame(future_predictions)


# ====================================================
# HELPERS
# ====================================================
def compute_days_cover(stock, total_predicted_demand, days=30):
    if total_predicted_demand <= 0:
        return None
    avg_daily = total_predicted_demand / days
    if avg_daily <= 0:
        return None
    return stock / avg_daily


def compute_risk_level(days_cover):
    if days_cover is None:
        return "safe"
    if days_cover <= 3:
        return "critical"
    elif days_cover <= 7:
        return "warning"
    return "safe"


# ====================================================
# API ENDPOINTS
# ====================================================

@app.get("/forecast/{hospital_id}")
def forecast(hospital_id, days: int = 30):
    try:
        df = load_center_history(hospital_id)
        if df.empty:
            return []

        df          = complete_missing_dates(df)
        df          = build_features(df)
        forecast_df = recursive_forecast_with_meta(models, df, days)

        if forecast_df.empty:
            return []

        forecast_df["date"] = forecast_df["date"].astype(str)
        return (
            forecast_df[["date", "blood_type", "blood_requests"]]
            .rename(columns={"blood_requests": "predicted_demand"})
            .to_dict(orient="records")
        )

    except Exception as e:
        print("FORECAST ERROR:", str(e))
        return {"error": str(e)}


@app.get("/forecast-total/{hospital_id}")
def forecast_total(hospital_id, days: int = 30):
    try:
        df = load_center_history(hospital_id)
        if df.empty:
            return []

        df          = complete_missing_dates(df)
        df          = build_features(df)
        forecast_df = recursive_forecast_with_meta(models, df, days)

        if forecast_df.empty:
            return []

        total = (
            forecast_df.groupby("date")["blood_requests"]
            .sum()
            .reset_index()
        )
        total["date"] = total["date"].astype(str)
        return (
            total.rename(columns={"blood_requests": "total_predicted_demand"})
            .to_dict(orient="records")
        )

    except Exception as e:
        print("FORECAST-TOTAL ERROR:", str(e))
        return {"error": str(e)}


@app.get("/history-total/{hospital_id}")
def history_total(hospital_id):
    try:
        df = load_center_history(hospital_id)
        df = complete_missing_dates(df)
        if df.empty:
            return []

        total = (
            df.groupby("date")["blood_requests"]
            .sum()
            .reset_index()
        )
        total["date"] = total["date"].astype(str)
        return total.to_dict(orient="records")

    except Exception as e:
        print("HISTORY-TOTAL ERROR:", str(e))
        return {"error": str(e)}

def mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    if mask.sum() == 0:
        return float("nan")
    return float(
        np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    )

@app.get("/backtest/{hospital_id}")
def backtest(hospital_id):
    try:
        # ===============================
        # LOAD DATA
        # ===============================
        full_df = load_center_history(hospital_id)
        full_df = complete_missing_dates(full_df)

        if full_df.empty:
            return {"error": "No data available"}

        full_df["date"] = pd.to_datetime(full_df["date"])

        # ===============================
        # DEFINE SPLIT (OCTOBER ONLY)
        # ===============================
        cutoff_date = pd.Timestamp("2025-09-30")
        test_start  = pd.Timestamp("2025-10-01")
        test_end    = pd.Timestamp("2025-10-31")  # ✅ ONLY OCTOBER

        # ===============================
        # SPLIT DATA
        # ===============================
        train_df = full_df[full_df["date"] <= cutoff_date].copy()
        test_df  = full_df[
            (full_df["date"] >= test_start) &
            (full_df["date"] <= test_end)
        ].copy()

        if train_df.empty or test_df.empty:
            return {"error": "Not enough data for selected period"}

        # ===============================
        # BUILD FEATURES (TRAIN ONLY)
        # ===============================
        train_df = build_features(train_df)

        # ===============================
        # FORECAST ONLY REQUIRED DAYS
        # ===============================
        days = (test_end - cutoff_date).days  # ~31 days
        forecast_df = recursive_forecast_with_meta(models, train_df, days)

        # ===============================
        # MERGE PREDICTION + ACTUAL
        # ===============================
        merged = pd.merge(
            forecast_df,
            test_df,
            on=["date", "blood_type"],
            how="inner",  # ✅ IMPORTANT: no extra rows
            suffixes=("_pred", "_actual"),
        )

        # ===============================
        # STRICT FILTER (SAFETY)
        # ===============================
        merged = merged[
            (merged["date"] >= test_start) &
            (merged["date"] <= test_end)
        ].copy()

        if merged.empty:
            return {"error": "No overlapping prediction vs actual data"}

        # ===============================
        # CLEAN VALUES
        # ===============================
        merged["blood_requests_actual"] = merged["blood_requests_actual"].fillna(0)
        merged["blood_requests_pred"]   = merged["blood_requests_pred"].fillna(0)

        # ===============================
        # BASELINE (LAG-1)
        # ===============================
        baseline = (
            train_df[["date", "blood_type", "blood_requests"]]
            .copy()
            .rename(columns={"blood_requests": "lag_1_pred"})
        )
        baseline["date"] = baseline["date"] + pd.Timedelta(days=1)

        merged = merged.merge(baseline, on=["date", "blood_type"], how="left")
        merged["lag_1_pred"] = merged["lag_1_pred"].fillna(0)

        # ===============================
        # METRICS
        # ===============================
        y_true = merged["blood_requests_actual"]
        y_pred = merged["blood_requests_pred"]
        y_base = merged["lag_1_pred"]

        rmse      = float(np.sqrt(mean_squared_error(y_true, y_pred)))
        mae       = float(mean_absolute_error(y_true, y_pred))
        rmse_base = float(np.sqrt(mean_squared_error(y_true, y_base)))
        mae_base  = float(mean_absolute_error(y_true, y_base))

        mape_model = mape(y_true, y_pred)
        mape_base  = mape(y_true, y_base)

        # ===============================
        # FORMAT OUTPUT
        # ===============================
        merged["date"] = merged["date"].astype(str)

        # ===============================
        # TOTAL DEMAND COMPARISON
        # ===============================
        total_actual = float(merged["blood_requests_actual"].sum())
        total_pred   = float(merged["blood_requests_pred"].sum())

        total_error = total_pred - total_actual

        total_error_pct = (
            (total_error / total_actual) * 100
            if total_actual > 0 else 0
        )

        return {
            "mode": "single",  # 🔥 important for frontend
            "summary": {
                "RMSE_model":    round(rmse, 3),
                "MAE_model":     round(mae, 3),
                "MAPE_model":    round(mape_model, 2),

                "RMSE_baseline": round(rmse_base, 3),
                "MAE_baseline":  round(mae_base, 3),
                "MAPE_baseline": round(mape_base, 2),
            },
            "data": merged.to_dict(orient="records"),
            "totals": {
                "actual_total": round(total_actual, 2),
                "predicted_total": round(total_pred, 2),
                "difference": round(total_error, 2),
                "percentage_error": round(total_error_pct, 2),
            },
        }

    except Exception as e:
        print("BACKTEST ERROR:", str(e))
        return {"error": str(e)}


@app.get("/forecast-map")
def forecast_map():
    try:
        hospitals = pd.read_sql("""
            SELECT user_id, full_name, latitude, longitude
            FROM users
            WHERE role = 'hospital'
              AND latitude IS NOT NULL
              AND longitude IS NOT NULL
        """, engine)

        results = []

        for _, h in hospitals.iterrows():
            hospital_id   = h["user_id"]

            stock_df = pd.read_sql("""
                SELECT COALESCE(SUM(units_available), 0) AS stock
                FROM blood_stocks
                WHERE hospital_id = %s
            """, engine, params=(hospital_id,))

            current_stock = float(stock_df.iloc[0]["stock"] or 0)
            df            = load_center_history(hospital_id)

            if df.empty:
                total_predicted = 0.0
            else:
                df          = complete_missing_dates(df)
                df          = build_features(df)
                forecast_df = recursive_forecast_with_meta(models, df, 30)
                total_predicted = (
                    0.0 if forecast_df.empty
                    else float(
                        forecast_df.groupby("date")["blood_requests"].sum().sum()
                    )
                )

            days_cover = compute_days_cover(current_stock, total_predicted, 30)
            risk_level = compute_risk_level(days_cover)

            results.append({
                "hospital_id":            int(hospital_id),
                "hospital_name":          h["full_name"],
                "latitude":               float(h["latitude"]),
                "longitude":              float(h["longitude"]),
                "current_stock":          current_stock,
                "total_predicted_demand": round(total_predicted, 2),
                "days_cover":             round(days_cover, 2) if days_cover is not None else None,
                "risk_level":             risk_level,
            })

        return results

    except Exception as e:
        print("FORECAST-MAP ERROR:", str(e))
        return {"error": str(e)}