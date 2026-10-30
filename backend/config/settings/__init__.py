import os

# Default to dev settings if not explicitly specified
env = os.getenv('DJANGO_ENV', 'dev')

if env == 'prod':
    from .prod import *
else:
    from .dev import *

