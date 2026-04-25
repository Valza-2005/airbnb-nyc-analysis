"""Utility functions for the NYC Airbnb analysis project.

The functions in this module keep the notebooks shorter and make the
analysis reproducible. They are intentionally simple so they can be
explained clearly during presentation.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


def load_airbnb_data(path):
    """Load an Airbnb CSV file and return a pandas DataFrame."""
    return pd.read_csv(path)


def clean_airbnb_data(df):
    """Apply the main cleaning rules used in the project."""
    cleaned = df.copy()

    cleaned = cleaned.drop_duplicates().reset_index(drop=True)
    cleaned = cleaned.dropna(subset=["name", "host_name"])

    if "reviews_per_month" in cleaned.columns:
        cleaned["reviews_per_month"] = cleaned["reviews_per_month"].fillna(0)

    if "last_review" in cleaned.columns:
        cleaned["last_review"] = pd.to_datetime(cleaned["last_review"], errors="coerce")
        reference_date = pd.Timestamp("2019-12-31")
        cleaned["days_since_last_review"] = (
            reference_date - cleaned["last_review"]
        ).dt.days
        max_days = cleaned["days_since_last_review"].max()
        cleaned["days_since_last_review"] = cleaned["days_since_last_review"].fillna(max_days)

    return cleaned


def remove_price_outliers(df, price_col="price"):
    """Remove price outliers using the IQR method and return cleaned data plus bounds."""
    q1 = df[price_col].quantile(0.25)
    q3 = df[price_col].quantile(0.75)
    iqr = q3 - q1
    lower_bound = max(0, q1 - 1.5 * iqr)
    upper_bound = q3 + 1.5 * iqr

    filtered = df[(df[price_col] >= lower_bound) & (df[price_col] <= upper_bound)].copy()
    return filtered.reset_index(drop=True), lower_bound, upper_bound


def add_analysis_features(df):
    """Create derived columns used in the analysis and model notebooks."""
    featured = df.copy()

    if "price" in featured.columns:
        max_price = featured["price"].max()
        featured["price_category"] = pd.cut(
            featured["price"],
            bins=[0, 50, 100, 200, max_price],
            labels=["Very Low", "Low", "Medium", "High"],
            include_lowest=True,
        )

    if "availability_365" in featured.columns:
        featured["availability_category"] = pd.cut(
            featured["availability_365"],
            bins=[-1, 90, 180, 365],
            labels=["Low availability", "Medium availability", "High availability"],
        )

    if "number_of_reviews" in featured.columns:
        featured["review_activity"] = pd.cut(
            featured["number_of_reviews"],
            bins=[-1, 0, 10, 50, featured["number_of_reviews"].max()],
            labels=["No reviews", "Low", "Medium", "High"],
            include_lowest=True,
        )

    return featured


def create_summary_tables(df):
    """Create the main summary tables for the written report."""
    tables = {}

    tables["price_by_area"] = (
        df.groupby("neighbourhood_group")["price"]
        .agg(["count", "mean", "median", "min", "max"])
        .round(2)
        .sort_values("median", ascending=False)
    )

    tables["price_by_room_type"] = (
        df.groupby("room_type")["price"]
        .agg(["count", "mean", "median", "min", "max"])
        .round(2)
        .sort_values("median", ascending=False)
    )

    tables["top_neighbourhoods"] = (
        df.groupby("neighbourhood")["price"]
        .agg(["count", "mean", "median"])
        .query("count >= 50")
        .round(2)
        .sort_values("median", ascending=False)
        .head(10)
    )

    tables["availability_by_area"] = (
        df.groupby("neighbourhood_group")["availability_365"]
        .agg(["mean", "median", "min", "max"])
        .round(2)
        .sort_values("median", ascending=False)
    )

    return tables


def save_summary_tables(tables, output_dir):
    """Save summary tables as CSV files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    for name, table in tables.items():
        table.to_csv(output_path / f"{name}.csv")


def plot_price_distribution(df, output_path=None):
    """Plot the price distribution."""
    fig, ax = plt.subplots(figsize=(10, 6))
    sns.histplot(df["price"], bins=50, kde=True, ax=ax, color="#2f6f9f")
    ax.set_title("Price Distribution of NYC Airbnb Listings")
    ax.set_xlabel("Price ($)")
    ax.set_ylabel("Number of listings")
    fig.tight_layout()
    if output_path:
        fig.savefig(output_path, dpi=150, bbox_inches="tight")
    return fig


def plot_price_by_area(df, output_path=None):
    """Plot price by borough/neighbourhood group."""
    fig, ax = plt.subplots(figsize=(11, 6))
    sns.boxplot(data=df, x="neighbourhood_group", y="price", ax=ax, palette="Set2")
    ax.set_title("Price Distribution by Borough")
    ax.set_xlabel("Borough")
    ax.set_ylabel("Price ($)")
    fig.tight_layout()
    if output_path:
        fig.savefig(output_path, dpi=150, bbox_inches="tight")
    return fig


def plot_correlation_heatmap(df, output_path=None):
    """Plot a correlation heatmap for the numerical analysis variables."""
    numeric_cols = [
        "price",
        "minimum_nights",
        "number_of_reviews",
        "reviews_per_month",
        "calculated_host_listings_count",
        "availability_365",
    ]
    available_cols = [col for col in numeric_cols if col in df.columns]
    corr = df[available_cols].corr()

    fig, ax = plt.subplots(figsize=(9, 7))
    sns.heatmap(corr, annot=True, cmap="coolwarm", center=0, fmt=".2f", ax=ax)
    ax.set_title("Correlation Matrix")
    fig.tight_layout()
    if output_path:
        fig.savefig(output_path, dpi=150, bbox_inches="tight")
    return fig


def calculate_model_metrics(y_true, y_pred):
    """Return common regression metrics without hiding formulas in the notebook."""
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1 - (ss_res / ss_tot)
    return {"MAE": mae, "RMSE": rmse, "R2": r2}
