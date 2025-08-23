from app.utils import model_loader

print('MODEL_DIR =', model_loader.MODEL_DIR)
print('load ->', model_loader.load_models())
print('Running predict_full_dataset...')
res = model_loader.predict_full_dataset()
print('Result:')
print(res)



