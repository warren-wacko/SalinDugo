from fastapi import FastAPI
import joblib
import pandas as pd
import numpy as np
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from fastapi.middleware.cors import CORSMiddleware

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

# ✅ FIXED: Features now match training code exactly
FEATURES = [
    "lag_1", "lag_7", "lag_14",
    "roll_mean_7", "roll_std_7",
    "diff_1", "diff_7",
    "rolling_max_7", "rolling_min_7",
    "trend_7",
    "weekday", "month",
    "is_weekend",
    "sin_week", "cos_week"
]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ✅ FIXED: Load the dict of 8 per-blood-type models
models = joblib.load(os.path.join(BASE_DIR, "model/blood_models_per_type.pkl"))

engine = create_engine(os.getenv("DATABASE_URL"))


# =========================
# LOAD DATA
# =========================
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


# =========================
# COMPLETE MISSING DATES
# =========================
def complete_missing_dates(df):
    df["date"] = pd.to_datetime(df["date"])
    all_filled = []

    for bt in df["blood_type"].unique():
        sub = df[df["blood_type"] == bt].copy()

        full_range = pd.date_range(sub["date"].min(), sub["date"].max(), freq="D")

        sub = (
            sub.set_index("date")
            .reindex(full_range)
            .rename_axis("date")
            .reset_index()
        )

        sub["blood_type"] = bt
        sub["blood_requests"] = sub["blood_requests"].fillna(0)
        all_filled.append(sub)

    return pd.concat(all_filled, ignore_index=True)


# =========================
# FEATURE ENGINEERING
# ✅ FIXED: Matches training code exactly (no blood_type_enc, added all missing features)
# =========================
def build_features(df):
    df["blood_type"] = df["blood_type"].str.strip().str.upper()
    groups = []

    for bt, g in df.groupby("blood_type"):
        g = g.sort_values("date").copy()

        # Lag features
        g["lag_1"]  = g[TARGET].shift(1)
        g["lag_2"]  = g[TARGET].shift(2)   # needed for diff_1
        g["lag_7"]  = g[TARGET].shift(7)
        g["lag_14"] = g[TARGET].shift(14)

        # Rolling features
        g["roll_mean_7"]   = g[TARGET].shift(1).rolling(7).mean()
        g["roll_std_7"]    = g[TARGET].shift(1).rolling(7).std()
        g["rolling_max_7"] = g[TARGET].shift(1).rolling(7).max()
        g["rolling_min_7"] = g[TARGET].shift(1).rolling(7).min()

        # Diff features (leak-free)
        g["diff_1"] = g["lag_1"] - g["lag_2"]
        g["diff_7"] = g["lag_7"] - g["lag_14"]

        # Trend
        g["trend_7"] = (
            g[TARGET].shift(1).rolling(7).mean() -
            g[TARGET].shift(8).rolling(7).mean()
        )

        # Calendar features
        g["weekday"]    = g["date"].dt.weekday
        g["month"]      = g["date"].dt.month
        g["is_weekend"] = g["weekday"].isin([5, 6]).astype(int)
        g["sin_week"]   = np.sin(2 * np.pi * g["weekday"] / 7)
        g["cos_week"]   = np.cos(2 * np.pi * g["weekday"] / 7)

        groups.append(g)

    return pd.concat(groups, ignore_index=True).dropna().reset_index(drop=True)


# =========================
# RECURSIVE FORECAST
# ✅ FIXED: Uses per-blood-type model lookup
# =========================
def recursive_forecast(models, df, days_ahead=30):
    future_predictions = []
    working_df = df.copy()
    last_date = working_df["date"].max()

    for step in range(1, days_ahead + 1):
        new_date = last_date + pd.Timedelta(days=step)

        for bt in working_df["blood_type"].unique():

            # ✅ FIXED: Pick the correct model for this blood type
            if bt not in models:
                print(f"⚠️ No model found for blood type: {bt}, skipping.")
                continue

            model = models[bt]

            sub  = working_df[working_df["blood_type"] == bt].copy()
            hist = sub[TARGET]

            lag_1  = hist.iloc[-1]
            lag_2  = hist.iloc[-2]  if len(hist) >= 2  else hist.iloc[0]
            lag_7  = hist.iloc[-7]  if len(hist) >= 7  else hist.iloc[0]
            lag_14 = hist.iloc[-14] if len(hist) >= 14 else hist.iloc[0]

            shifted = hist.shift(1) if len(hist) > 1 else hist
            roll_mean_7   = shifted.tail(7).mean()
            roll_std_7    = shifted.tail(7).std() or 0
            rolling_max_7 = shifted.tail(7).max()
            rolling_min_7 = shifted.tail(7).min()

            diff_1  = lag_1 - lag_2
            diff_7  = lag_7 - lag_14
            trend_7 = (
                shifted.tail(7).mean() -
                (hist.shift(8).tail(7).mean() if len(hist) >= 8 else 0)
            )

            weekday    = new_date.weekday()
            is_weekend = int(weekday in [5, 6])
            sin_week   = np.sin(2 * np.pi * weekday / 7)
            cos_week   = np.cos(2 * np.pi * weekday / 7)

            row = {
                "date":           new_date,
                "blood_type":     bt,
                "lag_1":          lag_1,
                "lag_7":          lag_7,
                "lag_14":         lag_14,
                "roll_mean_7":    roll_mean_7,
                "roll_std_7":     roll_std_7,
                "diff_1":         diff_1,
                "diff_7":         diff_7,
                "rolling_max_7":  rolling_max_7,
                "rolling_min_7":  rolling_min_7,
                "trend_7":        trend_7,
                "weekday":        weekday,
                "month":          new_date.month,
                "is_weekend":     is_weekend,
                "sin_week":       sin_week,
                "cos_week":       cos_week,
            }

            X_future = pd.DataFrame([row])[FEATURES]

            if X_future.isnull().any().any():
                raise ValueError(f"Invalid features detected for {bt}: {row}")

            pred = np.expm1(model.predict(X_future))[0]

            # Stability guard
            window      = min(len(sub), 14)
            recent_mean = sub[TARGET].tail(window).mean()
            recent_std  = sub[TARGET].tail(window).std() or 0
            upper_limit = recent_mean + 2 * recent_std
            lower_limit = max(0, recent_mean - 2 * recent_std)
            pred        = np.clip(pred, lower_limit, upper_limit)

            row[TARGET] = round(float(pred), 2)
            future_predictions.append(row)

            working_df = pd.concat(
                [working_df, pd.DataFrame([row])],
                ignore_index=True
            )

    return pd.DataFrame(future_predictions)


# =========================
# API ENDPOINTS
# ✅ FIXED: Pass `models` dict instead of single `model`
# =========================
@app.get("/forecast/{hospital_id}")
def forecast(hospital_id, days: int = 30):
    try:
        df = load_center_history(hospital_id)

        if df.empty:
            return {"message": "Not enough historical data", "forecast": []}

        df       = complete_missing_dates(df)
        df       = build_features(df)
        forecast = recursive_forecast(models, df, days)  # ✅ pass models dict

        if forecast.empty:
            return {
                "message": "Not enough history for forecasting (need ~14+ days)",
                "forecast": []
            }

        forecast["date"] = forecast["date"].astype(str)
        response = (
            forecast[["date", "blood_type", "blood_requests"]]
            .copy()
            .rename(columns={"blood_requests": "predicted_demand"})
        )

        return response.to_dict(orient="records")

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}


@app.get("/forecast-total/{hospital_id}")
def forecast_total(hospital_id, days: int = 30):
    df = load_center_history(hospital_id)

    if df.empty:
        return {"message": "Not enough historical data", "forecast": []}

    df       = complete_missing_dates(df)
    df       = build_features(df)
    forecast = recursive_forecast(models, df, days)  # ✅ pass models dict

    if forecast.empty:
        return {"message": "Not enough history for forecasting", "forecast": []}

    total = (
        forecast.groupby("date")["blood_requests"]
        .sum()
        .reset_index()
    )
    total["date"] = total["date"].astype(str)
    total = total.rename(columns={"blood_requests": "total_predicted_demand"})

    return total.to_dict(orient="records")


@app.get("/history-total/{hospital_id}")
def history_total(hospital_id):
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


@app.get("/forecast-map")
def forecast_map():
    hospitals = pd.read_sql("""
        SELECT user_id, full_name, latitude, longitude
        FROM users
        WHERE role = 'hospital'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
    """, engine)

    results = []

    for _, h in hospitals.iterrows():
        hospital_id = h["user_id"]

        stock_df = pd.read_sql("""
            SELECT COALESCE(SUM(units_available),0) AS stock
            FROM blood_stocks
            WHERE hospital_id = %s
        """, engine, params=(hospital_id,))

        current_stock = float(stock_df.iloc[0]["stock"] or 0)

        df = load_center_history(hospital_id)

        if df.empty:
            total_predicted = 0
        else:
            df       = complete_missing_dates(df)
            df       = build_features(df)
            forecast = recursive_forecast(models, df, 30)  # ✅ pass models dict

            total_predicted = (
                0 if forecast.empty
                else float(forecast.groupby("date")["blood_requests"].sum().sum())
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