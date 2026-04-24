import pandas as pd
import numpy as np
import re
import datetime
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from scipy.stats import randint

def load_and_clean_data(filepath):
    df = pd.read_csv(filepath)
    price_col = next((col for col in df.columns if "price" in col.lower()), None)
    if not price_col: raise ValueError("No 'price' column found.")
    year_col = next((col for col in df.columns if "year" in col.lower()), None)
    
    subset_to_drop = [price_col]
    if year_col: subset_to_drop.append(year_col)
    df = df.dropna(subset=subset_to_drop).reset_index(drop=True)

    def clean_price(x):
        x = str(x)
        x = re.sub(r"[^\d.]", "", x)
        return float(x) if x != "" else np.nan

    df[price_col] = df[price_col].apply(clean_price)
    return df.dropna(subset=[price_col]), price_col, year_col

def feature_engineering(df, year_col):
    if year_col:
        current_year = datetime.datetime.now().year
        df[year_col] = pd.to_numeric(df[year_col], errors='coerce')
        df = df.dropna(subset=[year_col])
        df['car_age'] = current_year - df[year_col].astype(int)
        df = df.drop(year_col, axis=1)
    return df

def build_pipeline(numeric_features, categorical_features):
    numeric_transformer = Pipeline(steps=[('imputer', SimpleImputer(strategy='median'))])
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ], remainder='passthrough')
    return Pipeline(steps=[('preprocessor', preprocessor), ('regressor', RandomForestRegressor(random_state=42))])

def train_model(X, y, pipeline):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    param_dist = {
        'regressor__n_estimators': randint(100, 500),
        'regressor__max_depth': [None] + list(np.arange(10, 31, 5)),
        'regressor__min_samples_split': randint(2, 11),
        'regressor__min_samples_leaf': randint(1, 5)
    }
    search = RandomizedSearchCV(pipeline, param_distributions=param_dist, n_iter=10, cv=3, verbose=1, n_jobs=1, random_state=42)
    search.fit(X_train, y_train)
    return search.best_estimator_, X_train, X_test, y_train, y_test

def evaluate_predictions(model, X_test, y_test, X_original):
    predictions = model.predict(X_test)
    results = X_original.loc[X_test.index].copy()
    results["Actual Price"] = y_test
    results["Predicted Price"] = predictions
    results["Difference"] = results["Actual Price"] - results["Predicted Price"]
    
    results["Evaluation"] = results.apply(lambda row: "Good Deal 🔥" if (row["Actual Price"] - row["Predicted Price"]) / row["Actual Price"] > 0.15 else ("Overpriced ❌" if (row["Actual Price"] - row["Predicted Price"]) / row["Actual Price"] < -0.15 else "Fair Price 👍"), axis=1)
    
    best_deals = results[results['Evaluation'] == 'Good Deal 🔥'].sort_values(by="Difference", ascending=False).head(10)
    
    # Defensive Printing: Only print columns that exist in the dataframe
    cols_to_print = ["Actual Price", "Predicted Price", "Difference", "Evaluation", "brand", "model", "car_age"]
    available_cols = [c for c in cols_to_print if c in best_deals.columns]
    
    print("\n--- Top 10 Good Deals ---")
    print(best_deals[available_cols])
    return results

def predict_new_car(model, train_columns, car_details):
    new_car_df = pd.DataFrame([car_details]).reindex(columns=train_columns, fill_value=np.nan)
    predicted_price = model.predict(new_car_df)
    print(f"\n--- New Car Prediction ---\nPredicted Price: {predicted_price[0]:,.2f}")
    return predicted_price[0]

if __name__ == "__main__":
    df, target_col, year_col = load_and_clean_data("car_ads_details_kaggle.csv")
    df = feature_engineering(df.copy(), year_col)
    X, y = df.drop(columns=[target_col]), df[target_col]
    
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    numeric_cols = X.select_dtypes(include=['number']).columns.tolist()
    
    pipeline = build_pipeline(numeric_cols, categorical_cols)
    model, X_train, X_test, y_train, y_test = train_model(X, y, pipeline)
    
    results_df = evaluate_predictions(model, X_test, y_test, X)
    
    new_car = {'brand': 'Toyota', 'model': 'Corolla', 'mileage': 80000, 'fuel': 'Petrol', 'transmission': 'Automatic', 'car_age': 5}
    predict_new_car(model, X.columns, new_car)