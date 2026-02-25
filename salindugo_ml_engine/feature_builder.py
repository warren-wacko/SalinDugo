def forecast_for_center(center_df, model, days_ahead=30):

    # build features
    center_df = build_features(center_df)

    # recursive forecasting
    forecast_df = recursive_forecast(
        model,
        center_df,
        days_ahead
    )

    return forecast_df