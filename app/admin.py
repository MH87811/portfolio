from django.contrib import admin
from .models import *

# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    pass

@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    pass

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    pass

@admin.register(LearningItem)
class LearningItemAdmin(admin.ModelAdmin):
    pass

@admin.register(LabEntry)
class LabEntryAdmin(admin.ModelAdmin):
    pass