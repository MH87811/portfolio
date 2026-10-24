from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=128)
    name_fa = models.CharField(max_length=128, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)
    order = models.IntegerField()
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Technology(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='techs')
    name = models.CharField(max_length=128)
    name_fa = models.CharField(max_length=128, blank=True)

    class TechnologyKind(models.TextChoices):
        LANGUAGE = "language", "Language"
        FRAMEWORK = "framework", "Framework"
        DATABASE = "database", "Database"
        CACHE = "cache", "Cache"
        PROTOCOL = "protocol", "Protocol"
        TOOL = "tool", "Tool"
        PLATFORM = "platform", "Platform"
        OTHER = "other", "Other"

    kind = models.CharField(
        max_length=16,
        choices=TechnologyKind,
        default=TechnologyKind.OTHER,
    )

    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    graph_group = models.SlugField(blank=True)
    is_active = models.BooleanField(default=True)
    dependencies = models.ManyToManyField("self", symmetrical=False, blank=True, related_name='dependents')

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

class Project(models.Model):
    title = models.CharField(max_length=128)
    title_fa = models.CharField(max_length=128, blank=True)
    repo_name = models.CharField(max_length=128, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)
    language_stack = models.CharField(max_length=128)
    kind = models.CharField(max_length=128)
    kind_fa = models.CharField(max_length=128, blank=True)

    class ProjectStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        PROTOTYPE = "prototype", "Prototype"
        ARCHIVED = "archived", "Archived"

    status = models.CharField(choices=ProjectStatus, default=ProjectStatus.ACTIVE, max_length=10)

    detail = models.JSONField(blank=True, default=dict)
    detail_fa = models.JSONField(blank=True, default=dict)
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    technologies = models.ManyToManyField(Technology, related_name='projects', blank=True)
    featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    visual = models.FileField(upload_to='prj-visual/', blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class LearningItem(models.Model):
    title = models.CharField(max_length=150)
    title_fa = models.CharField(max_length=150, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)

    class LearningStatus(models.TextChoices):
        EXPLORING = ('exploring', 'Exploring')
        LEARNING = ('learning', 'Learning')
        STUDYING = ('studying', 'Studying')
        DEVELOPING = ('developing', 'Developing')
        QUEUED = ('queued', 'Queued')

    status = models.CharField(max_length=10, choices=LearningStatus, default=LearningStatus.EXPLORING)

    technologies = models.ManyToManyField(
        Technology,
        related_name="learning_items",
        blank=True,
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class LabEntry(models.Model):
    title = models.CharField(max_length=128)
    title_fa = models.CharField(max_length=128, blank=True)
    slug = models.SlugField(unique=True)

    class EntryKind(models.TextChoices):
        EXPERIMENT = ('experiment', 'Experiment')
        PROTOTYPE = ('prototype', 'Prototype')
        NOTE = ('note', 'Note')

    kind = models.CharField(max_length=10, choices=EntryKind, default=EntryKind.NOTE)

    class EntryStatus(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        QUEUED = "queued", "Queued"
        COMPLETED = "completed", "Completed"

    status = models.CharField(max_length=16, choices=EntryStatus, default=EntryStatus.QUEUED)
    description = models.TextField(blank=True)
    description_fa = models.TextField(blank=True)
    technologies = models.ManyToManyField(Technology, related_name='entries', blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
