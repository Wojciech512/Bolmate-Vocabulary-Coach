import os.path
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from logging.config import fileConfig
from uuid import UUID

from pyramid.config import Configurator
from pyramid.events import NewRequest
from pyramid.renderers import JSON
from pyramid.request import Request
from pyramid.response import Response

from bolmate_base.core.database import setup_database as _setup_database
from bolmate_base.core.database import DBSession as _DBSession
from bolmate_base.core.settings import get_settings as _get_settings


def main(_, **settings):
    _setup_database()
    _setup_logging()
    configurator = Configurator(settings=settings)
    configurator.include('.core.routes', route_prefix='/v1')
    config = _setup_renderers(configurator)

    config.scan()
    wsgi_app = config.make_wsgi_app()
    return wsgi_app


def _setup_logging():
    fileConfig(os.path.join(os.getcwd(), 'logging.ini'))


def _setup_renderers(configurator: Configurator):
    configurator.add_renderer('json', _get_json_renderer())
    configurator.add_subscriber(_add_response_callbacks, NewRequest)
    return configurator


def _get_json_renderer():
    json_renderer = JSON()

    def datetime_adapter(obj, _: Request):
        return obj.isoformat()

    def uuid_adapter(obj, _: Request):
        return str(obj)

    def decimal_adapter(obj: Decimal, _: Request):
        return float(obj)

    def enum_adapter(enum: Enum, _: Request):
        return enum.value

    json_renderer.add_adapter(datetime, datetime_adapter)
    json_renderer.add_adapter(date, datetime_adapter)
    json_renderer.add_adapter(UUID, uuid_adapter)
    json_renderer.add_adapter(Decimal, decimal_adapter)
    json_renderer.add_adapter(Enum, enum_adapter)
    return json_renderer


def _add_response_callbacks(event):
    event.request.add_response_callback(_cors_headers)
    event.request.add_finished_callback(_commit_session)


def _commit_session(request: Request):
    if request.exception is not None:
        _DBSession.rollback()
    else:
        _DBSession.commit()
        _DBSession.expire_all()
    _DBSession.remove()


def _cors_headers(request: Request, response: Response):
    settings = _get_settings()
    headers = {
        'Access-Control-Allow-Origin': settings.allow_origin,
        'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS, DELETE, PATCH',
        'Access-Control-Allow-Headers':
            'Authorization, Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'max-age=0, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 'Wed, 12 Jan 1980 05:00:00 GMT',
        'env': settings.env
    }
    response.headers.extend(headers)
    if request.method == 'OPTIONS':
        response.status_code = 200
    return response
