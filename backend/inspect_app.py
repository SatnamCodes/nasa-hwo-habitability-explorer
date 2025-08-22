from app import main
print('Imported app:', hasattr(main, 'app'))
print('Routes:')
for r in main.app.router.routes:
    print(r.path)
