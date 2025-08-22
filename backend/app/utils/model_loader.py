import os
from typing import Optional, Tuple, List
import sys
import pandas as pd
import numpy as np
import joblib

# Compatibility shim: some pickles were created in a notebook where a class
# named HabitabilityCalibrator was defined in __main__. When unpickling,
# joblib may look for that name in __main__. To handle this, inject a
# lightweight shim into __main__ so unpickling succeeds and the object
# exposes a predict(X) method delegating to the wrapped model.
class HabitabilityCalibrator:
    def __init__(self, model=None, scaler=None, *args, **kwargs):
        self.model = model
        self.scaler = scaler

    def predict(self, X):
        try:
            return self.model.predict(X)
        except Exception:
            # fallback if wrapped object already provides predictions
            return getattr(self.model, 'predict', lambda x: np.zeros(len(x)))(X)

# ensure shim available in __main__ for unpickling
try:
    import __main__ as _main_mod
    if not hasattr(_main_mod, 'HabitabilityCalibrator'):
        setattr(_main_mod, 'HabitabilityCalibrator', HabitabilityCalibrator)
except Exception:
    pass

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '..', 'data_science', 'models')
MODEL_DIR = os.path.normpath(MODEL_DIR)


class LoadedModels:
    def __init__(self):
        self.xgb_model = None
        self.calibrated_model = None
        self.scaler = None
        # default, will be overridden by model_metadata.json when available
        self.feature_columns: List[str] = ['pl_rade', 'pl_masse', 'pl_eqt', 'st_teff', 'pl_orbper', 'sy_dist']


MODELS = LoadedModels()


def _find_file_by_suffix(suffix: str) -> Optional[str]:
    if not os.path.isdir(MODEL_DIR):
        return None
    for fn in os.listdir(MODEL_DIR):
        if fn.lower().endswith(suffix.lower()):
            return os.path.join(MODEL_DIR, fn)
    return None


def load_models() -> dict:
    """Load scaler and models from data_science/models into memory."""
    # Try calibrated XGBoost first, then plain xgboost
    calibrated = _find_file_by_suffix('_calibrated_xgboost_habitability.pkl') or _find_file_by_suffix('calibrated_xgboost_habitability.pkl')
    xgb = _find_file_by_suffix('xgboost_habitability.pkl')
    scaler = _find_file_by_suffix('feature_scaler.pkl')

    result = {'loaded': []}
    # try to read model metadata for feature columns
    metadata_path = os.path.join(MODEL_DIR, 'model_metadata.json')
    if os.path.isfile(metadata_path):
        try:
            import json
            with open(metadata_path, 'r') as f:
                md = json.load(f)
                if 'feature_columns' in md and isinstance(md['feature_columns'], list):
                    MODELS.feature_columns = md['feature_columns']
                    result.setdefault('metadata', {})['feature_columns_count'] = len(MODELS.feature_columns)
        except Exception as e:
            result.setdefault('metadata', {})['error'] = str(e)

    if scaler:
        try:
            MODELS.scaler = joblib.load(scaler)
            result['loaded'].append(os.path.basename(scaler))
        except Exception as e:
            result['scaler_error'] = str(e)

    if calibrated:
        try:
            MODELS.calibrated_model = joblib.load(calibrated)
            result['loaded'].append(os.path.basename(calibrated))
        except Exception as e:
            result['calibrated_error'] = str(e)

    if xgb and MODELS.calibrated_model is None:
        try:
            MODELS.xgb_model = joblib.load(xgb)
            result['loaded'].append(os.path.basename(xgb))
        except Exception as e:
            result['xgb_error'] = str(e)

    return result


def prepare_features(df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
    df2 = df.copy()
    feat = MODELS.feature_columns
    # ensure columns exist
    for c in feat:
        if c not in df2.columns:
            # if mass missing and radius exists, estimate; else fill 0
            if c == 'pl_masse' and 'pl_rade' in df2.columns:
                df2[c] = df2['pl_rade'].apply(lambda r: (r ** 3) if pd.notnull(r) else 0.0)
            else:
                df2[c] = 0.0

    # crude mass estimate where missing
    if 'pl_masse' in df2.columns:
        df2['pl_masse'] = df2['pl_masse'].fillna(df2['pl_rade'] ** 3)

    # Derived features to better mirror training feature engineering
    # Units assumptions: pl_rade in Earth radii, pl_masse in Earth masses, st_rad in Solar radii, st_mass in Solar masses
    # Convert to SI where needed
    G = 6.67430e-11
    R_earth = 6.371e6
    M_earth = 5.97219e24
    R_sun = 6.957e8
    M_sun = 1.98847e30
    sigma = 5.670374419e-8

    # Ensure stellar radius/mass columns exist (try common names)
    if 'st_rad' not in df2.columns and 'st_rad' in df.columns:
        df2['st_rad'] = df['st_rad']
    if 'st_mass' not in df2.columns and 'st_mass' in df.columns:
        df2['st_mass'] = df['st_mass']

    # compute density (kg/m3), surface_gravity (m/s2), stellar_flux (relative units), orbital_velocity (km/s)
    try:
        # radius in meters
        df2['_r_m'] = df2['pl_rade'].apply(lambda v: v * R_earth if pd.notnull(v) else float('nan'))
        df2['_m_kg'] = df2['pl_masse'].apply(lambda v: v * M_earth if pd.notnull(v) else float('nan'))

        df2['density'] = df2.apply(lambda row: (row['_m_kg'] / ((4.0/3.0) * np.pi * (row['_r_m'] ** 3))) if pd.notnull(row['_m_kg']) and pd.notnull(row['_r_m']) and row['_r_m'] > 0 else 0.0, axis=1)
        df2['surface_gravity'] = df2.apply(lambda row: (G * row['_m_kg'] / (row['_r_m'] ** 2)) if pd.notnull(row['_m_kg']) and pd.notnull(row['_r_m']) and row['_r_m'] > 0 else 0.0, axis=1)
    except Exception:
        df2['density'] = 0.0
        df2['surface_gravity'] = 0.0

    # Stellar flux at planet: use Stefan-Boltzmann and inverse-square with estimated semi-major axis from orbital period if possible
    def compute_stellar_flux(row):
        try:
            Teff = float(row.get('st_teff', np.nan))
            Rstar = float(row.get('st_rad', np.nan)) if pd.notnull(row.get('st_rad', np.nan)) else np.nan
            P_days = float(row.get('pl_orbper', np.nan)) if pd.notnull(row.get('pl_orbper', np.nan)) else np.nan
            Mstar = float(row.get('st_mass', np.nan)) if pd.notnull(row.get('st_mass', np.nan)) else np.nan
            if pd.isna(Teff):
                return 0.0
            # Rstar in solar radii -> meters
            Rstar_m = Rstar * R_sun if not pd.isna(Rstar) else np.nan
            # estimate semi-major axis 'a' from orbital period (P) using Kepler's third law if stellar mass available
            if not pd.isna(P_days) and not pd.isna(Mstar) and P_days > 0:
                P_sec = P_days * 24 * 3600
                a_m = ((G * Mstar * M_sun * (P_sec ** 2)) / (4 * np.pi ** 2)) ** (1.0/3.0)
            else:
                a_m = np.nan
            if pd.isna(Rstar_m) or pd.isna(a_m) or a_m == 0:
                return 0.0
            # stellar luminosity per unit area at surface: sigma * Teff^4
            L_surface = sigma * (Teff ** 4)
            # flux at planet = L_surface * (Rstar_m^2 / a_m^2)
            flux = L_surface * (Rstar_m ** 2) / (a_m ** 2)
            return float(flux)
        except Exception:
            return 0.0

    df2['stellar_flux'] = df2.apply(compute_stellar_flux, axis=1)

    # orbital_velocity: v = 2*pi*a / P
    def compute_orbital_velocity(row):
        try:
            P_days = float(row.get('pl_orbper', np.nan)) if pd.notnull(row.get('pl_orbper', np.nan)) else np.nan
            Mstar = float(row.get('st_mass', np.nan)) if pd.notnull(row.get('st_mass', np.nan)) else np.nan
            if pd.isna(P_days) or pd.isna(Mstar) or P_days <= 0:
                return 0.0
            P_sec = P_days * 24 * 3600
            a_m = ((G * Mstar * M_sun * (P_sec ** 2)) / (4 * np.pi ** 2)) ** (1.0/3.0)
            v = 2 * np.pi * a_m / P_sec
            return float(v)
        except Exception:
            return 0.0

    df2['orbital_velocity'] = df2.apply(compute_orbital_velocity, axis=1)

    # final feature matrix
    X = df2[feat].fillna(0.0)
    if MODELS.scaler is not None:
        try:
            X_scaled = MODELS.scaler.transform(X)
        except Exception:
            # fallback: fit-transform
            X_scaled = MODELS.scaler.fit_transform(X)
    else:
        X_scaled = X.values

    return X_scaled, df2


def predict_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Run model predictions on the provided DataFrame and return results appended."""
    if MODELS.calibrated_model is None and MODELS.xgb_model is None:
        raise RuntimeError('No model loaded')

    X, df2 = prepare_features(df)

    # prefer calibrated model if available
    model = MODELS.calibrated_model or MODELS.xgb_model
    preds = model.predict(X)

    # if classifier/probabilities, try to map
    try:
        df2['predicted_sephi'] = preds
    except Exception:
        df2['predicted_sephi'] = np.asarray(preds).astype(float)

    return df2


def predict_full_dataset(path: Optional[str] = None) -> dict:
    """Load dataset (or default nasa_clean.csv) and run predictions, returning summary."""
    ds_dir = os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', '..', 'data_science', 'datasets'))
    ds_path = path or os.path.join(ds_dir, 'nasa_clean.csv')
    ds_path = os.path.normpath(ds_path)
    # If the cleaned dataset exists but is tiny, try merging kepler + confirmed to get the full ~14k set
    if os.path.isfile(ds_path):
        try:
            df = pd.read_csv(ds_path)
        except Exception:
            df = pd.DataFrame()
    else:
        df = pd.DataFrame()

    # fallback: merge kepler + confirmed if nasa_clean is too small
    if df is None or len(df) < 1000:
        kepler_path = os.path.join(ds_dir, 'kepler_planets.csv')
        confirmed_path = os.path.join(ds_dir, 'confirmed_planets.csv')
        parts = []
        if os.path.isfile(kepler_path):
            try:
                parts.append(pd.read_csv(kepler_path))
            except Exception:
                pass
        if os.path.isfile(confirmed_path):
            try:
                parts.append(pd.read_csv(confirmed_path))
            except Exception:
                pass
        if parts:
            try:
                df = pd.concat(parts, ignore_index=True)
            except Exception:
                df = parts[0] if parts else pd.DataFrame()

    if df is None or len(df) == 0:
        return {'error': f'no dataset found in {ds_dir}'}

    original_count = len(df)
    df_out = predict_dataframe(df)

    # write results to data_science/models/predictions_full.csv
    out_dir = os.path.join(os.path.dirname(MODEL_DIR), 'models') if False else MODEL_DIR
    out_file = os.path.join(MODEL_DIR, 'predictions_full.csv')
    try:
        df_out.to_csv(out_file, index=False)
    except Exception:
        # best effort; ignore
        pass

    top = df_out.sort_values('predicted_sephi', ascending=False).head(20)
    return {
        'original_count': original_count,
        'predictions_saved_to': out_file,
        'top_20': top[['pl_name'] + [c for c in df_out.columns if c in ['predicted_sephi']]].to_dict(orient='records')
    }
