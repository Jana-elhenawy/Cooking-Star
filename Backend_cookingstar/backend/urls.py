from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ── Django built-in admin ─────────────────────────────────────────────────
    path('admin/', admin.site.urls),

    # ── REST API ──────────────────────────────────────────────────────────────
    # FIX: users.urls was included TWICE (under both "api/" and "users/").
    #      Only "api/" is needed — that is where the JS fetch() calls point.
    path('api/', include('users.urls')),
    path('api/recipes/', include('recipes.urls')),   # recipe CRUD API
    path('api/favorites/', include('favorites.urls')),  # favorites API

    # ── HTML page routes (served by Django TemplateView) ──────────────────────
    path('',                TemplateView.as_view(template_name='index.html')),
    path('login/',          TemplateView.as_view(template_name='login.html')),
    path('signup/',         TemplateView.as_view(template_name='signup.html')),
    path('user-dashboard/', TemplateView.as_view(template_name='user-dashboard.html')),
    path('admin-dashboard/', TemplateView.as_view(template_name='admin.html')),
    path('recipes/',   TemplateView.as_view(template_name='recipes-list.html')),
    # FIX: was "templpate_name" (typo with extra 'p') — fixed to template_name
    path('favorites/',      TemplateView.as_view(template_name='favorites.html')),
    path('search/',         TemplateView.as_view(template_name='search-results.html')),
    path('add-recipe/',     TemplateView.as_view(template_name='add_recipe.html')),
    path('manage-recipes/', TemplateView.as_view(template_name='manage-recipes.html')),
    path('recipe-detail/',  TemplateView.as_view(template_name='recipe-detail.html')),
    path('profile/',        TemplateView.as_view(template_name='profile.html')),
]

# ── Serve media uploads in development ────────────────────────────────────────
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    