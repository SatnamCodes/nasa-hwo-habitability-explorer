import pandas as pd
import numpy as np

def clean_exoplanet_data():
    print("🧹 Cleaning NASA exoplanet data...")
    
    # Load raw data
    try:
<<<<<<< HEAD
        df = pd.read_csv('c:/Programming/hwo-habitability-explorer/data_science/datasets/nasa_exoplanets.csv',
=======
        df = pd.read_csv('data_science/datasets/nasa_exoplanets.csv',
>>>>>>> d0176bc6a6971fb31c22be7ed0295a59f9ac538f
                        on_bad_lines='skip',  # Skip problematic lines
                        encoding='utf-8',     # Specify encoding
                        low_memory=False,     # Avoid dtype issues
                        quoting=3)            # Disable quote character
        print(f"Original dataset: {len(df)} planets")
    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        print("Please check if the file exists and is properly formatted.")
        return None
    
    # Keep only planets with essential data for habitability
<<<<<<< HEAD
    essential_columns = [
        'pl_name', 'pl_rade', 'pl_masse', 'pl_eqt', 'st_teff', 'sy_dist',
        'pl_orbper', 'pl_orbsmax', 'st_mass', 'st_rad', 'st_age'
    ]
    df_clean = df[essential_columns].copy()
    
    # Remove rows with missing critical data
    critical_columns = ['pl_rade', 'pl_eqt', 'st_teff', 'pl_orbper', 'sy_dist']
    df_clean = df_clean.dropna(subset=critical_columns)
    
    # Apply more stringent filters for potentially habitable worlds
    df_clean = df_clean[
        # Rocky to mini-Neptune size (0.5 to 2.5 Earth radii)
        (df_clean['pl_rade'] >= 0.5) & (df_clean['pl_rade'] <= 2.5) &
        
        # Temperature range for potential life (150-400K)
        (df_clean['pl_eqt'] >= 150) & (df_clean['pl_eqt'] <= 400) &
        
        # Star temperature (2400K to 7500K - M, K, G, and F stars)
        (df_clean['st_teff'] >= 2400) & (df_clean['st_teff'] <= 7500) &
        
        # Orbital period (20-700 days)
        (df_clean['pl_orbper'] >= 20) & (df_clean['pl_orbper'] <= 700) &
        
        # Distance from Earth (within 150 parsecs)
        (df_clean['sy_dist'] <= 150)
    ]
    
    # Calculate habitability score (0-1)
    df_clean['habitability_score'] = (
        # Size similarity to Earth (1 = Earth-sized)
        (1 - abs(df_clean['pl_rade'] - 1) / 0.6) * 0.3 +
        
        # Temperature optimality (1 = Earth-like temperature of ~288K)
        (1 - abs(df_clean['pl_eqt'] - 288) / 62) * 0.3 +
        
        # Star suitability (1 = Sun-like temperature of ~5778K)
        (1 - abs(df_clean['st_teff'] - 5778) / 2578) * 0.2 +
        
        # Distance penalty (1 = closest, 0 = farthest)
        (1 - df_clean['sy_dist'] / 100) * 0.2
    )
    
    # Ensure scores are between 0 and 1
    df_clean['habitability_score'] = df_clean['habitability_score'].clip(0, 1)
    
    # Flag for highly promising candidates (score > 0.7)
    df_clean['high_interest_target'] = (df_clean['habitability_score'] > 0.7).astype(int)
    
    # Save cleaned data
    df_clean.to_csv('c:/Programming/hwo-habitability-explorer/data_science/datasets/nasa_clean.csv', index=False)
    
    print(f"Clean dataset: {len(df_clean)} planets")
    if len(df_clean) > 0:
        print(f"High interest targets: {df_clean['high_interest_target'].sum()}")
        print(f"Average habitability score: {df_clean['habitability_score'].mean():.2f}")
        print(f"Top candidates: {len(df_clean[df_clean['habitability_score'] > 0.8])}")
=======
    essential_columns = ['pl_name', 'pl_rade', 'pl_masse', 'pl_eqt', 'st_teff', 'sy_dist']
    df_clean = df[essential_columns].copy()
    
    # Remove rows with missing critical data
    df_clean = df_clean.dropna(subset=['pl_rade', 'pl_eqt', 'st_teff'])
    
    # Remove unrealistic values
    df_clean = df_clean[
        (df_clean['pl_rade'] > 0.1) & (df_clean['pl_rade'] < 20) &  # Reasonable planet sizes
        (df_clean['pl_eqt'] > 50) & (df_clean['pl_eqt'] < 3000) &   # Reasonable temperatures
        (df_clean['st_teff'] > 2000) & (df_clean['st_teff'] < 10000)  # Reasonable star temps
    ]
    
    # Add a simple habitability flag for training
    df_clean['potentially_habitable'] = (
        (df_clean['pl_rade'] >= 0.5) & (df_clean['pl_rade'] <= 2.5) &
        (df_clean['pl_eqt'] >= 180) & (df_clean['pl_eqt'] <= 320)
    ).astype(int)
    
    # Save cleaned data
    df_clean.to_csv('data_science/datasets/nasa_clean.csv', index=False)
    
    print(f"Clean dataset: {len(df_clean)} planets")
    print(f"Potentially habitable: {df_clean['potentially_habitable'].sum()}")
>>>>>>> d0176bc6a6971fb31c22be7ed0295a59f9ac538f
    print("✅ Cleaned data saved as 'nasa_clean.csv'")
    
    return df_clean

if __name__ == "__main__":
    clean_df = clean_exoplanet_data()
    if clean_df is None:
        exit(1)
