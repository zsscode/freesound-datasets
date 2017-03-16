from django.contrib import admin
from datasets.models import Dataset, Sound, Annotation, Vote, Taxonomy

admin.site.register(Dataset)
admin.site.register(Sound)
admin.site.register(Annotation)
admin.site.register(Vote)
admin.site.register(Taxonomy)