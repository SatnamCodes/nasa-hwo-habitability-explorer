import pandas as pd

# Load your datasets
nasa_df = pd.read_csv('data_science\datasets\nasa_exoplanets.csv')
sample_df = pd.read_csv('data_science/datasets/sample_planets.csv')

# Basic exploration
print("NASA Dataset Info:")
print(f"Total planets: {len(nasa_df)}")
print(f"Columns: {list(nasa_df.columns)}")
print(f"Missing data summary:")
print(nasa_df.isnull().sum())

print("\nSample Dataset:")
print(sample_df.head())
