from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0004_rename_name_recipe_title_remove_recipe_created_by_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='category',
            field=models.CharField(
                max_length=50,
                blank=True,
                default='',
                help_text='e.g. Egyptian, Italian, Dessert',
            ),
        ),
    ]
