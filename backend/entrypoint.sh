#!/bin/sh
# Prepare the database, then hand off to the container's CMD.
# Both steps are idempotent, so this is safe on every container start.
set -e

python manage.py migrate --noinput
python manage.py seed_bd

exec "$@"
