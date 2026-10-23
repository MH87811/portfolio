from django.shortcuts import render
from .models import *

# Create your views here.

def _project_detail(project):
    """
    Normalize Project.detail for the Developer System frontend.
    """
    detail = project.detail
    if not isinstance(detail, dict):
        detail = {}

    overview = detail.get("overview", [])
    if not overview and project.description:
        overview = [project.description]

    return {
        "overview": overview,
        "arch": detail.get("arch", []),
        "extras": detail.get("extras", []),
        "decisions": detail.get("decisions", []),
        "challenges": detail.get("challenges", []),
        "problem": detail.get("problem", []),
        "outcome": detail.get("outcome", []),
        "limitations": detail.get("limitations", []),
        "body": detail.get("body", []),
        "updated": project.updated_at.date().isoformat() if project.updated_at else "",
    }

def serialize_projects(project_list):
    data = []

    for project in project_list:
        detail = _project_detail(project)

        data.append({
            "id": project.slug,
            "name": project.repo_name or project.title.upper(),
            "lang": project.language_stack,
            "kind": project.kind,
            "status": project.status,
            "desc": project.description,
            "uses": [
                technology.slug
                for technology in project.technologies.all()
                if technology.is_active
            ],
            "repo": project.github_url or "",
            **detail,
        })

    return data

def _build_developer_system_data():
    categories = list(
        Category.objects.filter(is_active=True).order_by("order")
    )

    technologies = list(
        Technology.objects.filter(
            is_active=True,
            category__is_active=True,
        )
        .select_related("category")
        .prefetch_related("dependents")
        .order_by("order", "name")
    )

    projects = list(
        Project.objects.filter(
            is_active=True,
        )
        .exclude(status=Project.ProjectStatus.ARCHIVED)
        .prefetch_related("technologies")
        .order_by("order")
    )

    # Only active, featured, non-archived projects for the homepage graph.
    featured_projects = [
        project
        for project in projects
        if project.featured
    ]

    learning_items = list(
        LearningItem.objects.filter(
            is_active=True,
        )
        .prefetch_related("technologies")
        .order_by("order")
    )

    lab_entries = list(
        LabEntry.objects.filter(
            is_active=True,
        )
        .prefetch_related("technologies")
        .order_by("order")
    )

    # --------------------------------------------------
    # Categories and graph domains
    # --------------------------------------------------

    domains = {
        category.slug: {
            "n": category.name.upper(),
            "r": category.description,
        }
        for category in categories
    }

    category_slugs = [category.slug for category in categories]

    graph_groups = []
    for technology in technologies:
        group = technology.graph_group

        if group and group not in graph_groups:
            graph_groups.append(group)

    # A graph group normally matches a Category slug.
    # Still provide a fallback to prevent missing-domain errors.
    for group in graph_groups:
        if group not in domains:
            domains[group] = {
                "n": group.replace("-", " ").upper(),
                "r": "",
            }

    # --------------------------------------------------
    # Technologies
    # --------------------------------------------------

    tech_data = {}

    for technology in technologies:
        tech_data[technology.slug] = {
            "n": technology.name,
            "d": technology.kind,
            "g": technology.graph_group or None,
            "r": technology.description,
            "needs": [
                dependency.slug
                for dependency in technology.dependencies.all()
                if dependency.is_active
            ],
        }

    # --------------------------------------------------
    # Projects and case studies
    # --------------------------------------------------

    project_data = serialize_projects(projects)
    featured_project_data = serialize_projects(featured_projects)

    # --------------------------------------------------
    # Learning
    # --------------------------------------------------

    learning_data = []

    for item in learning_items:
        learning_data.append({
            "id": item.slug,
            "n": item.title,
            "s": item.status,
            "note": item.description,
            "t": [
                technology.slug
                for technology in item.technologies.all()
                if technology.is_active
            ],
        })

    # --------------------------------------------------
    # Lab
    # --------------------------------------------------

    lab_data = []

    for entry in lab_entries:
        status = entry.status

        # app.js currently uses "in progress" and "published".
        # Keep the database values normalized.
        if status == LabEntry.EntryStatus.IN_PROGRESS:
            status = "in progress"
        elif status == LabEntry.EntryStatus.COMPLETED:
            status = "published"

        lab_data.append({
            "id": entry.slug,
            "kind": entry.kind,
            "s": status,
            "t": entry.title,
            "d": entry.description,
            "tags": [
                technology.slug
                for technology in entry.technologies.all()
                if technology.is_active
            ],
        })

    # --------------------------------------------------
    # Links used by the graph inspector
    # --------------------------------------------------

    learning_links = list(dict.fromkeys(
        technology_slug
        for item in learning_data
        for technology_slug in item["t"]
    ))

    lab_links = list(dict.fromkeys(
        technology_slug
        for entry in lab_data
        for technology_slug in entry["tags"]
    ))

    # Categories control Stack ordering.
    # Graph ordering only includes groups that actually have nodes.
    graph_order = [
        slug for slug in category_slugs
        if slug in graph_groups
    ]

    graph_order.extend(
        group for group in graph_groups
        if group not in graph_order
    )

    return {
        "DOMAINS": domains,
        "STACK_ORDER": category_slugs,
        "GRAPH_ORDER": graph_order,
        "TECH": tech_data,
        "PROJ": project_data,
        "FEATURED_PROJ": featured_project_data,
        "LEARN": learning_data,
        "LAB": lab_data,
        "LEARN_LINKS": learning_links,
        "LAB_LINKS": lab_links,
    }


def index(request):
    context = {
        "developer_system_data": _build_developer_system_data(),
    }

    return render(request, "index.html", context)