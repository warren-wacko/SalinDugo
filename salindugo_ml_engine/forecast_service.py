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
BACKTEST_CUTOFF_DATE = pd.Timestamp("2025-09-30")
BACKTEST_START_DATE = pd.Timestamp("2025-10-01")
BACKTEST_END_DATE = pd.Timestamp("2025-10-31")

# FEATURES — must match training FEATURES list exactly
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


# LOAD DATA
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

# COMPLETE MISSING DATES
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

# FEATURE ENGINEERING — mirrors training exactly
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

# COMPUTE FEATURES FOR ONE FUTURE STEP
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


# SOFT PREDICTION
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

# RECURSIVE FORECAST
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

                # Get probability (demand likelihood)
                prob = float(clf.predict_proba(X_future)[0][1])

                # Get regression output (magnitude)
                reg_pred = float(reg.predict(X_future)[0])

                # Smooth gating (NO thresholds, NO hard cuts)
                raw_pred = prob * reg_pred

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

# HELPERS
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

# API ENDPOINTS
@app.get("/forecast/{hospital_id}")
def forecast(hospital_id, days: int = 30):
    try:
        df = load_center_history(hospital_id)
        if df.empty:
            return []

        df = complete_missing_dates(df)
        residual_sd_by_type = compute_residual_sd_by_blood_type(
            build_backtest_comparison(df)
        )
        df = build_features(df)
        forecast_df = recursive_forecast_with_meta(models, df, days)

        if forecast_df.empty:
            return []

        forecast_df["date"] = forecast_df["date"].astype(str)
        records = []
        for _, row in forecast_df.iterrows():
            predicted_demand = row["blood_requests"]
            interval = prediction_interval_payload(
                predicted_demand,
                row["blood_type"],
                residual_sd_by_type,
            )
            records.append({
                "date": row["date"],
                "blood_type": row["blood_type"],
                "predicted_demand": interval["prediction"],
                **interval,
            })

        return records

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

@app.get("/history/{hospital_id}")
def history_by_type(hospital_id):
    try:
        df = load_center_history(hospital_id)
        df = complete_missing_dates(df)

        if df.empty:
            return []

        df["date"] = df["date"].astype(str)

        return df.to_dict(orient="records")

    except Exception as e:
        print("HISTORY ERROR:", str(e))
        return {"error": str(e)}

def mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    if mask.sum() == 0:
        return float("nan")
    return float(
        np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100
    )

def clean_metric(value, decimals=3):
    if pd.isna(value) or np.isinf(value):
        return None
    return round(float(value), decimals)


def build_backtest_comparison(full_df):
    full_df = full_df.copy()
    full_df["date"] = pd.to_datetime(full_df["date"])

    train_df = full_df[full_df["date"] <= BACKTEST_CUTOFF_DATE].copy()
    test_df = full_df[
        (full_df["date"] >= BACKTEST_START_DATE) &
        (full_df["date"] <= BACKTEST_END_DATE)
    ].copy()

    if train_df.empty or test_df.empty:
        return pd.DataFrame()

    train_features = build_features(train_df)
    if train_features.empty:
        return pd.DataFrame()

    days = (BACKTEST_END_DATE - BACKTEST_CUTOFF_DATE).days
    forecast_df = recursive_forecast_with_meta(models, train_features, days)
    if forecast_df.empty:
        return pd.DataFrame()

    merged = pd.merge(
        forecast_df,
        test_df,
        on=["date", "blood_type"],
        how="inner",
        suffixes=("_pred", "_actual"),
    )

    merged = merged[
        (merged["date"] >= BACKTEST_START_DATE) &
        (merged["date"] <= BACKTEST_END_DATE)
    ].copy()

    if merged.empty:
        return pd.DataFrame()

    merged["blood_requests_actual"] = merged["blood_requests_actual"].fillna(0)
    merged["blood_requests_pred"] = merged["blood_requests_pred"].fillna(0)

    baseline = (
        train_features[["date", "blood_type", "blood_requests"]]
        .copy()
        .rename(columns={"blood_requests": "lag_1_pred"})
    )
    baseline["date"] = baseline["date"] + pd.Timedelta(days=1)

    merged = merged.merge(baseline, on=["date", "blood_type"], how="left")
    merged["lag_1_pred"] = merged["lag_1_pred"].fillna(0)

    return merged


def compute_residual_sd_by_blood_type(merged):
    residual_sd = {}
    if merged.empty:
        return residual_sd

    for bt, group in merged.groupby("blood_type"):
        residuals = group["blood_requests_actual"] - group["blood_requests_pred"]
        sd = residuals.std(ddof=1)
        if len(residuals) >= 2 and not pd.isna(sd) and not np.isinf(sd):
            residual_sd[bt] = float(sd)

    return residual_sd


def interval_bounds(prediction, sd, multiplier):
    lower = max(0.0, prediction - multiplier * sd)
    upper = prediction + multiplier * sd
    return [round(lower, 2), round(upper, 2)]


def prediction_interval_payload(prediction, blood_type, residual_sd_by_type):
    prediction = float(prediction or 0)
    sd = residual_sd_by_type.get(blood_type)

    payload = {
        "prediction": round(prediction, 2),
        "ci_80": None,
        "ci_95": None,
        "residual_sd": None,
        "interval_status": "residual_sd_unavailable",
    }

    if sd is None:
        return payload

    payload["ci_80"] = interval_bounds(prediction, sd, 1.28)
    payload["ci_95"] = interval_bounds(prediction, sd, 1.96)
    payload["residual_sd"] = round(sd, 4)
    payload["interval_status"] = "available"
    return payload


def compute_backtest_metrics(group):
    y_true = group["blood_requests_actual"]
    y_pred = group["blood_requests_pred"]
    y_base = group["lag_1_pred"]

    total_actual = float(y_true.sum())
    total_pred = float(y_pred.sum())
    total_error = total_pred - total_actual
    total_error_pct = (total_error / total_actual) * 100 if total_actual > 0 else 0

    return {
        "RMSE_model": clean_metric(np.sqrt(mean_squared_error(y_true, y_pred))),
        "MAE_model": clean_metric(mean_absolute_error(y_true, y_pred)),
        "MAPE_model": clean_metric(mape(y_true, y_pred), 2),
        "RMSE_baseline": clean_metric(np.sqrt(mean_squared_error(y_true, y_base))),
        "MAE_baseline": clean_metric(mean_absolute_error(y_true, y_base)),
        "MAPE_baseline": clean_metric(mape(y_true, y_base), 2),
        "actual_total": clean_metric(total_actual, 2),
        "predicted_total": clean_metric(total_pred, 2),
        "difference": clean_metric(total_error, 2),
        "percentage_error": clean_metric(total_error_pct, 2),
        "records": int(len(group)),
    }

@app.get("/backtest/{hospital_id}")
def backtest(hospital_id):
    try:
        # LOAD DATA
        full_df = load_center_history(hospital_id)

        if full_df.empty:
            return {"error": "No data available"}

        full_df = complete_missing_dates(full_df)
        full_df["date"] = pd.to_datetime(full_df["date"])

        merged = build_backtest_comparison(full_df)
        if merged.empty:
            return {"error": "Not enough overlapping data for backtest period"}

        summary = compute_backtest_metrics(merged)
        residual_sd_by_type = compute_residual_sd_by_blood_type(merged)

        blood_type_summary = []
        for bt, group in merged.groupby("blood_type"):
            blood_type_summary.append({
                "blood_type": bt,
                "residual_sd": clean_metric(residual_sd_by_type.get(bt), 4),
                **compute_backtest_metrics(group),
            })

        blood_type_summary = sorted(
            blood_type_summary,
            key=lambda row: row["blood_type"],
        )

        merged["prediction"] = None
        merged["ci_80"] = None
        merged["ci_95"] = None
        merged["residual_sd"] = None
        merged["interval_status"] = None

        for index, row in merged.iterrows():
            interval = prediction_interval_payload(
                row["blood_requests_pred"],
                row["blood_type"],
                residual_sd_by_type,
            )
            merged.at[index, "prediction"] = interval["prediction"]
            merged.at[index, "ci_80"] = interval["ci_80"]
            merged.at[index, "ci_95"] = interval["ci_95"]
            merged.at[index, "residual_sd"] = interval["residual_sd"]
            merged.at[index, "interval_status"] = interval["interval_status"]

        merged["date"] = merged["date"].astype(str)

        return {
            "mode": "by_blood_type",
            "summary": {
                "RMSE_model": summary["RMSE_model"],
                "MAE_model": summary["MAE_model"],
                "MAPE_model": summary["MAPE_model"],

                "RMSE_baseline": summary["RMSE_baseline"],
                "MAE_baseline": summary["MAE_baseline"],
                "MAPE_baseline": summary["MAPE_baseline"],
            },
            "blood_type_summary": blood_type_summary,
            "data": merged.to_dict(orient="records"),
            "totals": {
                "actual_total": summary["actual_total"],
                "predicted_total": summary["predicted_total"],
                "difference": summary["difference"],
                "percentage_error": summary["percentage_error"],
            },
        }

        # DEFINE SPLIT (OCTOBER ONLY)
        cutoff_date = pd.Timestamp("2025-09-30")
        test_start  = pd.Timestamp("2025-10-01")
        test_end    = pd.Timestamp("2025-10-31")  # ONLY OCTOBER

        # SPLIT DATA
        train_df = full_df[full_df["date"] <= cutoff_date].copy()
        test_df  = full_df[
            (full_df["date"] >= test_start) &
            (full_df["date"] <= test_end)
        ].copy()

        if train_df.empty or test_df.empty:
            return {"error": "Not enough data for selected period"}

        # BUILD FEATURES (TRAIN ONLY)
        train_df = build_features(train_df)

        # FORECAST ONLY REQUIRED DAYS
        days = (test_end - cutoff_date).days  # ~31 days
        forecast_df = recursive_forecast_with_meta(models, train_df, days)

        # MERGE PREDICTION + ACTUAL
        merged = pd.merge(
            forecast_df,
            test_df,
            on=["date", "blood_type"],
            how="inner",  # IMPORTANT: no extra rows
            suffixes=("_pred", "_actual"),
        )

        # STRICT FILTER (SAFETY)
        merged = merged[
            (merged["date"] >= test_start) &
            (merged["date"] <= test_end)
        ].copy()

        if merged.empty:
            return {"error": "No overlapping prediction vs actual data"}

        # CLEAN VALUES
        merged["blood_requests_actual"] = merged["blood_requests_actual"].fillna(0)
        merged["blood_requests_pred"]   = merged["blood_requests_pred"].fillna(0)

        # BASELINE (LAG-1)
        baseline = (
            train_df[["date", "blood_type", "blood_requests"]]
            .copy()
            .rename(columns={"blood_requests": "lag_1_pred"})
        )
        baseline["date"] = baseline["date"] + pd.Timedelta(days=1)

        merged = merged.merge(baseline, on=["date", "blood_type"], how="left")
        merged["lag_1_pred"] = merged["lag_1_pred"].fillna(0)

        # METRICS
        summary = compute_backtest_metrics(merged)

        blood_type_summary = []
        for bt, group in merged.groupby("blood_type"):
            blood_type_summary.append({
                "blood_type": bt,
                **compute_backtest_metrics(group),
            })

        blood_type_summary = sorted(
            blood_type_summary,
            key=lambda row: row["blood_type"],
        )

        # FORMAT OUTPUT
        merged["date"] = merged["date"].astype(str)

        return {
            "mode": "by_blood_type",
            "summary": {
                "RMSE_model": summary["RMSE_model"],
                "MAE_model": summary["MAE_model"],
                "MAPE_model": summary["MAPE_model"],

                "RMSE_baseline": summary["RMSE_baseline"],
                "MAE_baseline": summary["MAE_baseline"],
                "MAPE_baseline": summary["MAPE_baseline"],
            },
            "blood_type_summary": blood_type_summary,
            "data": merged.to_dict(orient="records"),
            "totals": {
                "actual_total": summary["actual_total"],
                "predicted_total": summary["predicted_total"],
                "difference": summary["difference"],
                "percentage_error": summary["percentage_error"],
            },
        }

    except Exception as e:
        print("BACKTEST ERROR:", str(e))
        return {"error": str(e)}
