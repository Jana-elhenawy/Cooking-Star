from rest_framework import serializers
from .models import Recipe
import json


class RecipeSerializer(serializers.ModelSerializer):
    image_url        = serializers.SerializerMethodField()
    author_name      = serializers.SerializerMethodField()
    ingredients_list = serializers.SerializerMethodField()

    class Meta:
        model  = Recipe
        fields = [
            'id', 'title', 'description', 'ingredients', 'ingredients_list',
            'instructions', 'course', 'category', 'difficulty', 'time_minutes',
            'image', 'image_url',
            'author', 'author_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at',
                            'image_url', 'author_name', 'ingredients_list']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.username
        return None

    def get_ingredients_list(self, obj):
        if not obj.ingredients:
            return []
        raw = obj.ingredients.strip()
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                result = []
                for item in parsed:
                    if isinstance(item, dict):
                        result.append(item)
                    else:
                        result.append({'name': str(item)})
                return result
        except (json.JSONDecodeError, ValueError):
            pass
        return [{'name': line.strip()} for line in raw.splitlines() if line.strip()]
