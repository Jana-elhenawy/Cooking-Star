from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # FIX: added gender field that signup.js sends but was missing from model
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True, null=True)

    def __str__(self):
        return self.username


# FIX: replaces the in-memory `active_tokens = {}` dict in views.py.
# That dict is wiped on every server restart (every file-save in dev mode),
# logging out all users. This model persists tokens in the database.
class AuthToken(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tokens')
    token      = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — {self.token[:8]}…"
