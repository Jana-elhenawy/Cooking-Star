from django.urls import path
from . import views

urlpatterns = [
    path('',           views.recipe_list,   name='recipe_list'),    # GET all / POST new
    path('<int:pk>/',  views.recipe_detail, name='recipe_detail'),  # GET / PUT / DELETE one
    path('stats/',     views.recipe_stats,  name='recipe_stats'),   # GET admin counts
]
