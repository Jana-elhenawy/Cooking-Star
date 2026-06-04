from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Rename 'title' to 'name'
        migrations.RenameField(
            model_name='recipe',
            old_name='title',
            new_name='name',
        ),
        # Add 'course' field
        migrations.AddField(
            model_name='recipe',
            name='course',
            field=models.CharField(
                choices=[
                    ('Appetizer', 'Appetizer'),
                    ('Main Course', 'Main Course'),
                    ('Dessert', 'Dessert'),
                ],
                default='Main Course',
                max_length=50,
            ),
        ),
        # Add 'time' field
        migrations.AddField(
            model_name='recipe',
            name='time',
            field=models.PositiveIntegerField(default=30, help_text='Cooking time in minutes'),
        ),
        # Add 'difficulty' field
        migrations.AddField(
            model_name='recipe',
            name='difficulty',
            field=models.PositiveSmallIntegerField(default=2, help_text='1=Easy ... 5=Expert'),
        ),
        # Add 'created_by' FK
        migrations.AddField(
            model_name='recipe',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='recipes',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Change ingredients from plain TextField to JSON text (default empty array)
        migrations.AlterField(
            model_name='recipe',
            name='ingredients',
            field=models.TextField(default='[]'),
        ),
    ]