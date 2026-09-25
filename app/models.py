from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=128)
    slug = models.SlugField(unique=True)
    order = models.IntegerField()
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Skill(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=128)
    slug = models.SlugField(unique=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f'{self.category} - {self.name}'

class Project(models.Model):
    title = models.CharField(max_length=128)
    repo_name = models.CharField(max_length=128, blank=True)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    # detail = models.TextField(blank=True)
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    skills = models.ManyToManyField(Skill, related_name='projects', blank=True)
    featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class LearningItem(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    technologies = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title