"""
Django settings for freesound_datasets project.

Generated by 'django-admin startproject' using Django 1.10.6.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""

import os
import errno
import dj_database_url
import raven

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'default_secret_key')

# Debug, allowed hosts and database
if os.getenv('DEPLOY_ENV', 'dev') == 'prod':
    if SECRET_KEY == 'default_secret_key':
        print("Please configure your secret key by setting DJANGO_SECRET_KEY environment variable")
    DEBUG = False
    ALLOWED_HOSTS = ['localhost', 'asplab-web1', 'asplab-web1.s.upf.edu', 'datasets.freesound.org']
else:
    DEBUG = True
    INTERNAL_IPS = ['127.0.0.1']

    def show_toolbar(request):
        #if request.is_ajax():
        #    return False
        #return True
        return False

    # Normally django debug toolbar uses `INTERNAL_IPS` to check if it should show, but in
    # docker request.META.REMOTE_ADDR is set to an internal docker IP instead of 127.0.0.1.
    # We hard-code it on for development.
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': 'freesound_datasets.settings.show_toolbar',
    }

DATABASE_URL_ENV_NAME = 'DJANGO_DATABASE_URL'
DATABASES = {'default': dj_database_url.config(
    DATABASE_URL_ENV_NAME, default='postgres://postgres:postgres@db/freesound_datasets')}


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'django_extensions',
    'debug_toolbar',
    'datasets',
    'monitor',
    'social_django',
    'raven.contrib.django.raven_compat',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

ROOT_URLCONF = 'freesound_datasets.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'freesound_datasets.wsgi.application'


# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Social auth settings
SOCIAL_AUTH_LOGIN_REDIRECT_URL = '/'
SOCIAL_AUTH_USER_MODEL = 'auth.User'
LOGIN_URL = '/login/'

AUTHENTICATION_BACKENDS = (
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
    'social_core.backends.github.GithubOAuth2',
    'freesound_datasets.freesound_auth_backend.FreesoundOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

# Googlebackend settings
SOCIAL_AUTH_GOOGLE_OAUTH2_IGNORE_DEFAULT_SCOPE = True
SOCIAL_AUTH_GOOGLE_OAUTH2_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
]

# Facebook backend settings
SOCIAL_AUTH_FACEBOOK_IGNORE_DEFAULT_SCOPE = True
SOCIAL_AUTH_FACEBOOK_SCOPE = ['email', ]
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {'fields': 'id, name, email'}

SOCIAL_AUTH_FIELDS_STORED_IN_SESSION = ['terms_accepted']

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'freesound_datasets.views.accept_terms',
    'social_core.pipeline.user.get_username',
    'social_core.pipeline.user.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
)

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Madrid'

USE_I18N = True

USE_L10N = True

USE_TZ = True


RAVEN_CONFIG = {
    'dsn': os.getenv('SENTRY_DSN'),
    # If you are using git, you can also automatically configure the
    # release based on the git info.
    'release': raven.fetch_git_sha(os.path.dirname(os.pardir)),
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, "static")]
STATIC_ROOT = '/static/'

# Site
BASE_URL = os.getenv('DJANGO_BASE_URL', 'http://example.com')

# Default dataset name
DEFAULT_DATASET_NAME = os.getenv('DEFAULT_DATASET_NAME', 'FreesoundDataset')

# Dataset release files folder
DATASET_RELEASE_FILES_FOLDER = os.getenv('DATASET_RELEASE_FILES_FOLDER', os.path.join(BASE_DIR, 'fsdatasets_releases'))
try:
    os.makedirs(DATASET_RELEASE_FILES_FOLDER)
except OSError as exc:
    if exc.errno == errno.EEXIST and os.path.isdir(DATASET_RELEASE_FILES_FOLDER):
        pass
    else:
        raise Exception('DATASET_RELEASE_FILES_FOLDER does not exist and could not be created (%s)' % str(exc))

# Celery
CELERY_BROKER_URL = "redis://redis"
CELERY_RESULT_BACKEND = "redis://redis"
CELERY_ACCEPT_CONTENT = ['json']

# Redis
REDIS_HOST = 'redis'  # Host where redis is running (we use docker alias here)
REDIS_PORT = 6379

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
    },
    'loggers': {
        'tasks': {
            'handlers': [],  # Just use default handlers, no file output for now
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Parameter strings
SKIP_TEMPO_PARAMETER = 'skt'

# Session cookie
SESSION_COOKIE_AGE = 24*60*60
SESSION_SAVE_EVERY_REQUEST = True

# Import local settings
from freesound_datasets.local_settings import *
