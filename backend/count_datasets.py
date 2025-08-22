import os
import pandas as pd
base = os.path.normpath(r'c:/Programming/hwo-habitability-explorer/data_science/datasets')
for fn in os.listdir(base):
    if fn.lower().endswith('.csv'):
        path = os.path.join(base, fn)
        try:
            df = pd.read_csv(path)
            print(fn, len(df))
        except Exception as e:
            print(fn, 'error', e)
