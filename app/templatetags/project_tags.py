from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def render_svg(file):
    if not file:
        return ""

    try:
        content = file.read().decode("utf-8")
    except (OSError, UnicodeDecodeError):
        return ""

    return mark_safe(content)