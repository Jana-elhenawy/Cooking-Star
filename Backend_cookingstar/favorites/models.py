from django.db import models
from django.conf import settings


# FIX: Favorite model was completely empty before.
# Favorites were stored only in localStorage — they didn't persist to the database
# and were invisible to other devices/browsers.
class Favorite(models.Model):
    user   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favorites'
    )
    recipe = models.ForeignKey(
        'recipes.Recipe',
        on_delete=models.CASCADE,
        related_name='favorited_by'
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent the same user favoriting the same recipe twice
        unique_together = ('user', 'recipe')

    def __str__(self):
        return f"{self.user.username} ♥ {self.recipe.title}"
