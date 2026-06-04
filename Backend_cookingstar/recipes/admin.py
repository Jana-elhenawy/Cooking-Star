from django.contrib import admin
from .models import Recipe


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display  = ('title', 'course', 'time_minutes', 'difficulty', 'author', 'created_at')
    list_filter   = ('course', 'difficulty')
    search_fields = ('title', 'description', 'ingredients')