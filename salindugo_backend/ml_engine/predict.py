import sys
import json
import pandas as pd
import numpy as np
import joblib
from datetime import timedelta

# ===========================
# READ INPUT FROM NODEJS
# ===========================
raw = sys.stdin.read()
data = json.loads(raw)

region = data["region"]
days = data["days"]
history = data["history"]   # [{date, requests} list]


# ===========================
# LOAD MODEL + METADATA
# ===========================
metadata = joblib.load("ml_engine/exported_models/metadata.joblib")
feature_cols = metadata["feature_cols"]

model_path = f"ml_engine/exported_models/{region.replace(' ', '_')}.joblib"
model = joblib.load(model_path)


# ===========================
# PREPARE HISTORY DF
# ===========================
df = pd.DataFrame(history)
df["date"] = pd.to_datetime(df["date"])
df["requests"] = pd.to_numeric(df["requests"])
df = df.sort_values("date").reset_index(drop=True)


# ===========================
# FORECAST FUNCTION
# ===========================
def make_features(df, next_date):
    past = df["requests"]

    return {
        "lag_1": past.iloc[-1],
        "lag_7": past.iloc[-7] if len(past) >= 7 else past.iloc[-1],
        "lag_14": past.iloc[-14] if len(past) >= 14 else past.iloc[-1],
        "lag_30": past.iloc[-30] if len(past) >= 30 else past.iloc[-1],

        "rolling_mean_7": past.tail(7).mean(),
        "rolling_mean_14": past.tail(14).mean() if len(past) >= 14 else past.mean(),
        "rolling_mean_30": past.tail(30).mean() if len(past) >= 30 else past.mean(),
        "rolling_std_7": past.tail(7).std() if len(past) >= 7 else past.std(),

        "weekday": next_date.weekday(),
        "month": next_date.month,
        "day": next_date.day,
        "week": next_date.isocalendar().week,

        "ema_7": past.ewm(span=7).mean().iloc[-1],
        "ema_30": past.ewm(span=30).mean().iloc[-1],
    }


# ===========================
# RECURSIVE PREDICT LOOP
# ===========================
future = []

for _ in range(days):
    last_date = df["date"].iloc[-1]
    next_date = last_date + timedelta(days=1)

    feats = make_features(df, next_date)
    X = pd.DataFrame([feats])[feature_cols]

    pred_log = model.predict(X)[0]
    pred = float(np.expm1(pred_log))

    future.append({
        "date": str(next_date.date()),
        "forecast": pred
    })

    df = pd.concat([
        df,
        pd.DataFrame([{"date": next_date, "requests": pred}])
    ], ignore_index=True)


# ===========================
# OUTPUT JSON TO NODEJS
# ===========================
print(json.dumps({"forecast": future}, ensure_ascii=False))
