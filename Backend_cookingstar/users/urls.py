from django.urls import path
from .views import signup, login, logout, me, user_list, profile, change_password

urlpatterns = [
    path('signup/',          signup),
    path('login/',           login),
    path('logout/',          logout),
    path('me/',              me),
    path('users/',           user_list),
    path('profile/',         profile),           # GET / PATCH user profile
    path('change-password/', change_password),   # POST change password
]