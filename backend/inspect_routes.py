import importlib, json
app = importlib.import_module('app.main').app
routes = []
for r in app.router.routes:
    routes.append({'path': getattr(r, 'path', str(r)), 'name': getattr(r, 'name', ''), 'methods': list(getattr(r, 'methods', []))})
print(json.dumps(routes, indent=2))
