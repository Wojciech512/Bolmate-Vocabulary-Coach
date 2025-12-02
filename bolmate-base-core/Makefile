PY_SOURCES=app config wsgi.py

# Detect OS and set Python path accordingly
ifeq ($(OS),Windows_NT)
    PYTHON := ../.venv/Scripts/python.exe
else
    PYTHON := python
endif

.PHONY: format lint typecheck test

format:
	$(PYTHON) -m black $(PY_SOURCES)
	$(PYTHON) -m isort $(PY_SOURCES)

lint:
	$(PYTHON) -m flake8 $(PY_SOURCES)
	$(PYTHON) -m mypy $(PY_SOURCES)

typecheck:
	$(PYTHON) -m mypy $(PY_SOURCES)

test:
	$(PYTHON) -m pytest tests/ -v
