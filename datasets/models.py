from __future__ import unicode_literals

import collections
from django.db import models
from django.db.models import Count
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from django.conf import settings
import os
import markdown
import datetime
from django.utils import timezone
from django.core.validators import RegexValidator


class Taxonomy(models.Model):
    data = JSONField()

    @property
    def taxonomy(self):
        return self.data

    def get_parents(self, node_id):
        return [self.get_element_at_id(i) for i in self.taxonomy[node_id].get('parent_ids', [])]

    def get_children(self, node_id):
        return [self.get_element_at_id(i) for i in self.taxonomy[node_id].get('child_ids', [])]

    def get_element_at_id(self, node_id):
        return self.taxonomy.get(node_id)

    def get_all_nodes(self):
        return sorted(self.taxonomy.values(), key=lambda x: x['name'])

    def get_all_node_ids(self):
        return self.taxonomy.keys()

    def get_num_nodes(self):
        return len(self.data)

    def get_hierarchy_paths(self, node_id):

        def paths(node_id, cur=list()):
            parents = self.get_parents(node_id)
            if not parents:
                yield cur
            else:
                for node in parents:
                    for path in paths(node['id'], [node['id']] + cur):
                        yield path

        hierarchy_paths = list()
        for path in paths(node_id):
            # Add root and current category to path
            hierarchy_paths.append(path + [self.get_element_at_id(node_id)['id']])

        return hierarchy_paths

    def get_dict_tree(self):
        keys = [("name", "name"), ("mark", "restrictions")]
        def get_all_children(node_id):
            # recursive function for adding children in dict 
            children = self.get_children(node_id)
            children_names = []
            for child in children:
                child_name = {key[0]:child[key[1]] for key in keys}
                child_name["children"] = get_all_children(child["id"])
                children_names.append(child_name)
            if children_names: 
                return children_names
        
        taxonomy = self.taxonomy
        higher_categories = [node for node in taxonomy 
                             if "parent_ids" not in taxonomy[node]]
        output_dict = {}
        output_dict["name"] = "Ontology"
        output_dict["children"] = []
        for node_id in higher_categories:
            dict_level = {key[0]:taxonomy[node_id][key[1]] for key in keys}
            dict_level["children"] = get_all_children(node_id)
            output_dict["children"].append(dict_level)
            
        return output_dict


class Sound(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200)
    freesound_id = models.IntegerField(db_index=True)
    extra_data = JSONField(default={})

    def get_annotations(self, dataset):
        return Annotation.objects.filter(sound_dataset__in=self.sounddataset_set.filter(dataset=dataset))

    def __str__(self):
        return 'Sound {0} (freesound {1})'.format(self.id, self.freesound_id)


class Dataset(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    taxonomy = models.ForeignKey(Taxonomy, null=True, blank=True, on_delete=models.SET_NULL)
    sounds = models.ManyToManyField(Sound, related_name='datasets', through='datasets.SoundDataset')
    maintainers = models.ManyToManyField(User, related_name='maintained_datasets')

    def __str__(self):
        return 'Dataset {0}'.format(self.name)

    @property
    def description_html(self):
        return markdown.markdown(self.description)

    @property
    def annotations(self):
        return Annotation.objects.filter(sound_dataset__dataset=self)

    @property
    def num_sounds(self):
        return self.sounds.all().count()

    @property
    def num_annotations(self):
        return self.annotations.count()

    @property
    def avg_annotations_per_sound(self):
        if self.num_sounds == 0:
            return 0  # Avoid potential division by 0 error
        return self.num_annotations * 1.0 / self.num_sounds

    @property
    def num_validated_annotations(self):
        # This is the number of annotations that have at least one vote
        return self.annotations.annotate(num_votes=Count('votes')).filter(num_votes__gt=0).count()

    @property
    def percentage_validated_annotations(self):
        if self.num_annotations == 0:
            return 0  # Avoid potential division by 0 error
        return self.num_validated_annotations * 100.0 / self.num_annotations

    @property
    def releases(self):
        return self.datasetrelease_set.all().order_by('-release_date')

    def sounds_per_taxonomy_node(self, node_id):
        return Sound.objects.filter(datasets=self, sounddataset__annotations__value=node_id)

    def num_sounds_per_taxonomy_node(self, node_id):
        return self.sounds_per_taxonomy_node(node_id=node_id).count()

    def annotations_per_taxonomy_node(self, node_id):
        return self.annotations.filter(value=node_id)

    def num_annotations_per_taxonomy_node(self, node_id):
        return self.annotations_per_taxonomy_node(node_id=node_id).count()

    def non_validated_annotations_per_taxonomy_node(self, node_id):
        return self.annotations_per_taxonomy_node(node_id).annotate(num_votes=Count('votes')).filter(num_votes__lte=0)

    def num_non_validated_annotations_per_taxonomy_node(self, node_id):
        return self.non_validated_annotations_per_taxonomy_node(node_id).count()

    def num_votes_with_value(self, node_id, vote_value):
        return Vote.objects.filter(
            annotation__sound_dataset__dataset=self, annotation__value=node_id, vote=vote_value).count()

    def get_comments_per_taxonomy_node(self, node_id):
        return CategoryComment.objects.filter(dataset=self, category_id=node_id)

    def user_is_maintainer(self, user):
        return user in self.maintainers.all()

    @property
    def last_release_tag(self):
        if not self.releases.all():
            return None
        return self.releases.all().order_by('-release_date')[0].release_tag


class DatasetRelease(models.Model):
    dataset = models.ForeignKey(Dataset)
    num_sounds = models.IntegerField(default=0)
    num_nodes = models.IntegerField(default=0)
    num_annotations = models.IntegerField(default=0)
    num_validated_annotations = models.IntegerField(default=0)
    # TODO: add total length in seconds
    # TODO: add total size in bytes
    release_date = models.DateTimeField(auto_now_add=True)
    release_tag = models.CharField(max_length=25, validators=[
            RegexValidator(
                regex=r'^[\.a-zA-Z0-9_-]{1,25}$',
                message='Please enter a valid release tag',
            ),
        ])
    is_processed = models.BooleanField(default=False)
    processing_progress = models.IntegerField(default=0)
    processing_last_updated = models.DateTimeField(auto_now_add=True)
    TYPE_CHOICES = (
        ('IN', 'Internal release only'),
        ('PU', 'Public release'),
    )
    type = models.CharField(max_length=2, choices=TYPE_CHOICES, default='IN')

    @property
    def avg_annotations_per_sound(self):
        if self.num_sounds == 0:
            return 0  # Avoid potential division by 0 error
        return self.num_annotations * 1.0 / self.num_sounds

    @property
    def percentage_validated_annotations(self):
        if self.num_annotations == 0:
            return 0  # Avoid potential division by 0 error
        return self.num_validated_annotations * 100.0 / self.num_annotations

    @property
    def index_file_path(self):
        return os.path.join(settings.DATASET_RELEASE_FILES_FOLDER, '{0}.json'.format(self.id))

    @property
    def last_processing_progress_is_old(self):
        # Check processing_last_updated and if it is older than 5 minutes, that probably means there
        # have been errors with the computation and we can show it on screen
        return self.processing_last_updated < (timezone.now() - datetime.timedelta(minutes=2))


class SoundDataset(models.Model):
    sound = models.ForeignKey(Sound)
    dataset = models.ForeignKey(Dataset)


class Annotation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='annotations', null=True, on_delete=models.SET_NULL)
    sound_dataset = models.ForeignKey(SoundDataset, related_name='annotations')
    TYPE_CHOICES = (
        ('MA', 'Manual'),
        ('AU', 'Automatic'),
        ('UK', 'Unknown'),
    )
    type = models.CharField(max_length=2, choices=TYPE_CHOICES, default='UK')
    algorithm = models.CharField(max_length=200, blank=True, null=True)
    value = models.CharField(max_length=200, db_index=True)
    start_time = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)
    end_time = models.DecimalField(max_digits=6, decimal_places=3, blank=True, null=True)

    def __str__(self):
        return 'Annotation for sound {0}'.format(self.sound_dataset.sound.id)


class Vote(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='votes', null=True, on_delete=models.SET_NULL)
    vote = models.FloatField()
    annotation = models.ForeignKey(Annotation, related_name='votes')
    visited_sound = models.NullBooleanField(null=True, blank=True, default=None)
    # 'visited_sound' is to store whether the user needed to open the sound in Freesound to perform this vote

    def __str__(self):
        return 'Vote for annotation {0}'.format(self.annotation.id)


class CategoryComment(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='comments', null=True, on_delete=models.SET_NULL)
    dataset = models.ForeignKey(Dataset)
    comment = models.TextField(blank=True)
    category_id = models.CharField(max_length=200)
    # NOTE: currently categories are not stored as db objects, therefore we store a reference to the category (node) id
    # as used in other parts of the application. At some point categories should be stored as db objects and this
    # should refer to the db object id.

