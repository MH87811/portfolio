from django.shortcuts import render
from .models import *

# Create your views here.

def index(request):
    categories = Category.objects.filter(is_active=True)

    projects = Project.objects.filter(
        is_active=True,
        # featured=True,
    ).prefetch_related(
        'skills',
    )

    learning_items = LearningItem.objects.filter(
        is_active=True,
    )

    context = {
        'categories': categories,
        'projects': projects,
        'learning_items': learning_items,
    }
    return render(request, 'index.html', context)