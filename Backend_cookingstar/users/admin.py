from django.contrib import admin
from .models import User, AuthToken

admin.site.register(User)
admin.site.register(AuthToken)