from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Favorite
from recipes.models import Recipe
from recipes.serializers import RecipeSerializer
from users.models import AuthToken


def _get_user_from_token(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token_str = auth.split(' ', 1)[1].strip()
    try:
        return AuthToken.objects.select_related('user').get(token=token_str).user
    except AuthToken.DoesNotExist:
        return None


# ── GET  /api/favorites/         — list user's favorite recipes
# ── POST /api/favorites/         — add a recipe to favorites
#    Body: { recipe_id: <int> }

@api_view(['GET', 'POST'])
def favorite_list(request):
    user = _get_user_from_token(request)
    if user is None:
        return Response({'error': 'Authentication required'}, status=401)

    if request.method == 'GET':
        favs    = Favorite.objects.filter(user=user).select_related('recipe')
        recipes = [fav.recipe for fav in favs]
        serializer = RecipeSerializer(recipes, many=True, context={'request': request})
        return Response(serializer.data)

    # POST — add to favorites
    recipe_id = request.data.get('recipe_id')
    if not recipe_id:
        return Response({'error': 'recipe_id is required'}, status=400)

    recipe = get_object_or_404(Recipe, pk=recipe_id)
    fav, created = Favorite.objects.get_or_create(user=user, recipe=recipe)

    if created:
        return Response({'message': 'Added to favorites'}, status=201)
    return Response({'message': 'Already in favorites'}, status=200)


# ── DELETE /api/favorites/<recipe_id>/  — remove from favorites

@api_view(['DELETE'])
def favorite_detail(request, recipe_id):
    user = _get_user_from_token(request)
    if user is None:
        return Response({'error': 'Authentication required'}, status=401)

    deleted, _ = Favorite.objects.filter(user=user, recipe_id=recipe_id).delete()
    if deleted:
        return Response({'message': 'Removed from favorites'}, status=204)
    return Response({'error': 'Favorite not found'}, status=404)
