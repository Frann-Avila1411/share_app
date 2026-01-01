#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Recolectar estáticos
python manage.py collectstatic --no-input

# Correr migraciones
python manage.py migrate