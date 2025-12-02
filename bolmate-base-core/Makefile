PY_SOURCES=app config wsgi.py

.PHONY: format lint typecheck

format:
black $(PY_SOURCES)
isort $(PY_SOURCES)

lint:
flake8 $(PY_SOURCES)
mypy $(PY_SOURCES)

typecheck:
mypy $(PY_SOURCES)
