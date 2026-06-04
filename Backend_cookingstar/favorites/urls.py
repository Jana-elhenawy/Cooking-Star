from django.urls import path
from . import views

urlpatterns = [
    path('',             views.favorite_list,   name='favorite_list'),
    path('<int:recipe_id>/', views.favorite_detail, name='favorite_detail'),
]
