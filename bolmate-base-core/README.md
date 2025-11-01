# Bolmate Base core

## Getting started

- Setup a virtual env using Python >= 3.13

### Database

- Create the database in PostgreSQL, using database name `bolmate_base`
- Create config.ini in the root (bolmate-base-core) directory, refer to example.ini for the exact contents of this file.
    - Change the `database_url` to point towards the newly created database, using your local credentials

### Alembic

- Initialize Alembic: `alembic init alembic`
    - This requires an activated virtualenv
- Change `sqlalchemy.url` in `alembic.ini` to point towards the newly created database, using your local credentials
- Initialize the database using `alembic upgrade head`, this will build the database table `example`

### Running the app

Use `pserve --reload config.ini` to start the application server.