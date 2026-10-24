from django.contrib import admin
from .models import *

# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "name_fa", "slug", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name", "name_fa", "slug", "description", "description_fa")
    ordering = ("order",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "name_fa",
        "kind",
        "category",
        "order",
        "is_active",
    )
    list_filter = ("kind", "category", "is_active")
    search_fields = (
        "name",
        "name_fa",
        "slug",
        "description",
        "description_fa",
    )
    ordering = ("order", "name")
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ("dependencies",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "title_fa",
        "slug",
        "status",
        "featured",
        "is_active",
        "order",
    )
    list_filter = ("status", "featured", "is_active", "kind")
    search_fields = (
        "title",
        "title_fa",
        "slug",
        "repo_name",
        "description",
        "description_fa",
    )
    ordering = ("order",)
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("technologies",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "title",
                    "title_fa",
                    "slug",
                    "repo_name",
                )
            },
        ),
        (
            "Descriptions",
            {
                "fields": (
                    "description",
                    "description_fa",
                    "detail",
                )
            },
        ),
        (
            "Project metadata",
            {
                "fields": (
                    "language_stack",
                    "kind",
                    "status",
                    "technologies",
                )
            },
        ),
        (
            "Links and media",
            {
                "fields": (
                    "github_url",
                    "live_url",
                    "visual",
                )
            },
        ),
        (
            "Display",
            {
                "fields": (
                    "featured",
                    "is_active",
                    "order",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )


@admin.register(LearningItem)
class LearningItemAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "title_fa",
        "slug",
        "status",
        "order",
        "is_active",
    )
    list_filter = ("status", "is_active")
    search_fields = (
        "title",
        "title_fa",
        "slug",
        "description",
        "description_fa",
    )
    ordering = ("order",)
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("technologies",)


@admin.register(LabEntry)
class LabEntryAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "title_fa",
        "slug",
        "kind",
        "status",
        "order",
        "is_active",
    )
    list_filter = ("kind", "status", "is_active")
    search_fields = (
        "title",
        "title_fa",
        "slug",
        "description",
        "description_fa",
    )
    ordering = ("order",)
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("technologies",)