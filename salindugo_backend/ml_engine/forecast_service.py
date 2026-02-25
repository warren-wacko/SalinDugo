from fastapi import FastAPI
import joblib
import pandas as pd

app = FastAPI()

model = joblib.load("blood_model.pkl")

@app.get("/forecast")
def forecast():
    # later: load postgres data
    # build features
    # run prediction

    return {"message": "model working"}