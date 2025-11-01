from pyramid.request import Request
from pyramid.view import view_config

from bolmate_base.service import example_service as service


@view_config(route_name='api.example.hello_world', request_method='GET', renderer='json')
def hello_world(request: Request):
    return service.hello_world(request)
