from django import template
from urllib.parse import quote


register = template.Library()


def calculate_taxonomy_node_stats(dataset, node, num_sounds, num_annotations, num_non_validated_annotations):
    # Calculate node hierarchy paths
    hierarchy_paths = dataset.taxonomy.get_hierarchy_paths(node['id'])

    # Calculate percentage of validated annotations
    if num_annotations != 0:
        percentage_validated_annotations = (num_annotations - num_non_validated_annotations) * 100.0 / num_annotations
    else:
        percentage_validated_annotations = 0.0

    return {
        'num_sounds': num_sounds,
        'num_annotations': num_annotations,
        'num_non_validated_annotations': num_non_validated_annotations,
        'percentage_validated_annotations': percentage_validated_annotations,
        'num_parents': len(node['parents']),
        'num_children': len(node['children']),
        'is_abstract': 'abstract' in node['restrictions'],
        'is_blacklisted': 'blacklist' in node['restrictions'],
        'url_id': quote(node['id'], safe=''),
        'hierarchy_paths': hierarchy_paths,
    }


@register.simple_tag(takes_context=False)
def taxonomy_node_stats(dataset, node_id):
    node = dataset.taxonomy.get_element_at_id(node_id)

    num_sounds = dataset.num_sounds_per_taxonomy_node(node_id)
    num_annotations = dataset.num_annotations_per_taxonomy_node(node_id)
    num_non_validated_annotations = dataset.num_non_validated_annotations_per_taxonomy_node(node_id)

    return calculate_taxonomy_node_stats(dataset, node, num_sounds, num_annotations, num_non_validated_annotations)


@register.simple_tag(takes_context=False)
def sounds_per_taxonomy_node(dataset, node_id, N):
    return dataset.sounds_per_taxonomy_node(node_id)[0:N]


@register.filter()
def fs_embed_small(value):
    embed_code = '<iframe frameborder="0" scrolling="no" src="https://www.freesound.org/embed/sound/iframe/{0}/simple/small/" width="375" height="30"></iframe>'
    return embed_code.format(str(value))

@register.filter()
def fs_embed(value):
    embed_code = '<iframe frameborder="0" scrolling="no" src="https://www.freesound.org/embed/sound/iframe/{0}/simple/medium_no_info/" width="130" height="80"></iframe>'
    return embed_code.format(str(value))
