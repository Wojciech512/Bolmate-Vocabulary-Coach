def includeme(config):
    config.add_route('api.example.hello_world', '/hello-world', request_method='GET')
