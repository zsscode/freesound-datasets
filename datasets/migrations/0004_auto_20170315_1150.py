# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-03-15 10:50
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('datasets', '0003_auto_20170314_1633'),
    ]

    operations = [
        migrations.AlterField(
            model_name='annotation',
            name='value',
            field=models.CharField(db_index=True, max_length=200),
        ),
    ]
