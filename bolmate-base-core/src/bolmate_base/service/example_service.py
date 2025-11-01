from pyramid.request import Request


def hello_world(_: Request):
    return {'message': 'Hello world!'}
