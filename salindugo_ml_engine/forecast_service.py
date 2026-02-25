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
        "http://localhost:5173",  # React dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TARGET = "blood_requests"

blood_map = {
    "A+":0,"A-":1,
    "AB+":2,"AB-":3,
    "B+":4,"B-":5,
    "O+":6,"O-":7
}

FEATURES = [
    "blood_type_enc",
    "lag_1","lag_7","lag_14",
    "roll_mean_7","roll_std_7",
    "weekday","month","week"
]

model = joblib.load("model/blood_demand_model1.pkl")

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

    blood_types = df["blood_type"].unique()

    for bt in blood_types:

        sub = df[df["blood_type"] == bt].copy()

        full_range = pd.date_range(
            sub["date"].min(),
            sub["date"].max(),
            freq="D"
        )

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
# =========================
def build_features(df):

    df["blood_type"] = df["blood_type"].str.strip().str.upper()
    df["blood_type_enc"] = df["blood_type"].map(blood_map)

    def _build(g):
        g = g.sort_values("date").copy()

        g["lag_1"] = g[TARGET].shift(1)
        g["lag_7"] = g[TARGET].shift(7)
        g["lag_14"] = g[TARGET].shift(14)

        g["roll_mean_7"] = g[TARGET].shift(1).rolling(7).mean()
        g["roll_std_7"] = g[TARGET].shift(1).rolling(7).std()

        g["weekday"] = g["date"].dt.weekday
        g["month"] = g["date"].dt.month
        g["week"] = g["date"].dt.isocalendar().week.astype(int)

        return g

    df = df.groupby("blood_type", group_keys=False).apply(_build)
    print("Rows after feature build:", len(df))
    print(df.columns)
    print(
    df.groupby("blood_type")["blood_requests"]
    .count()
    .sort_values(ascending=False)
)
    return df.dropna().reset_index(drop=True)


# =========================
# RECURSIVE FORECAST
# =========================
def recursive_forecast(model, df, days_ahead=30):

    future_predictions = []
    working_df = df.copy()

    last_date = working_df["date"].max()

    blood_types = (
        working_df.groupby("blood_type")
        .size()
        .loc[lambda x: x >= 14]
        .index
    )

    for step in range(1, days_ahead + 1):

        new_date = last_date + pd.Timedelta(days=step)

        for bt in blood_types:

            sub = working_df[
                working_df["blood_type"] == bt
            ].copy()

            last_row = sub.iloc[-1]

            row = {
                "date": new_date,
                "blood_type": bt,
                "blood_type_enc": last_row["blood_type_enc"],
                "lag_1": last_row[TARGET],
                "lag_7": sub[TARGET].iloc[-7],
                "lag_14": sub[TARGET].iloc[-14],
                "roll_mean_7": sub[TARGET].tail(7).mean(),
                "roll_std_7": sub[TARGET].tail(7).std(),
                "weekday": new_date.weekday(),
                "month": new_date.month,
                "week": new_date.isocalendar().week
            }

            X_future = pd.DataFrame([row])[FEATURES]

            pred = np.expm1(model.predict(X_future))[0]

            # ⭐ STABILITY GUARD
            recent_mean = sub[TARGET].tail(14).mean()
            recent_std = sub[TARGET].tail(14).std()

            upper_limit = recent_mean + 2 * recent_std
            lower_limit = max(0, recent_mean - 2 * recent_std)

            pred = np.clip(pred, lower_limit, upper_limit)

            row[TARGET] = round(float(pred), 2)

            future_predictions.append(row)

            working_df = pd.concat(
                [working_df, pd.DataFrame([row])],
                ignore_index=True
            )

    return pd.DataFrame(future_predictions)


# =========================
# API ENDPOINT
# =========================
@app.get("/forecast/{hospital_id}")
def forecast(hospital_id, days:int = 30):

    df = load_center_history(hospital_id)

    if df.empty:
        return {
            "message": "Not enough historical data",
            "forecast": []
        }

    df = complete_missing_dates(df)
    df = build_features(df)

    forecast = recursive_forecast(model, df, days)

    # ⭐ SAFETY CHECK
    if forecast.empty:
        return {
            "message": "Not enough history for forecasting (need ~14+ days)",
            "forecast": []
        }

    forecast["date"] = forecast["date"].astype(str)

    # dashboard-safe output
    response = forecast[[
        "date",
        "blood_type",
        "blood_requests"
    ]].copy()

    response = response.rename(columns={
        "blood_requests": "predicted_demand"
    })

    return response.to_dict(orient="records")

@app.get("/forecast-total/{hospital_id}")
def forecast_total(hospital_id, days: int = 30):

    df = load_center_history(hospital_id)

    if df.empty:
        return {
            "message": "Not enough historical data",
            "forecast": []
        }

    df = complete_missing_dates(df)
    df = build_features(df)

    forecast = recursive_forecast(model, df, days)

    if forecast.empty:
        return {
            "message": "Not enough history for forecasting",
            "forecast": []
        }

    # aggregate ALL blood types per day
    total = (
        forecast.groupby("date")["blood_requests"]
        .sum()
        .reset_index()
    )

    total["date"] = total["date"].astype(str)

    total = total.rename(columns={
        "blood_requests": "total_predicted_demand"
    })

    return total.to_dict(orient="records")