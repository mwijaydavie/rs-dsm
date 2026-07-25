"""
Migration to add reporter fields and photo support to Accident model.
Preserves all existing data - only adds new columns.
"""
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accidents", "0014_accident_ward_and_location_id"),
    ]

    operations = [
        # Add new reporter fields
        migrations.AddField(
            model_name="accident",
            name="reporter_name",
            field=models.CharField(
                max_length=100,
                default="Unknown",
                help_text="Jina la muripoti (Reporter's full name)",
            ),
        ),
        migrations.AddField(
            model_name="accident",
            name="reporter_phone",
            field=models.CharField(
                max_length=20,
                default="0000000000",
                help_text="Namba ya simu ya muripoti (Reporter's phone number)",
            ),
        ),
        migrations.AddField(
            model_name="accident",
            name="photo_path",
            field=models.CharField(
                max_length=255,
                default="/uploads/no-photo.jpg",
                help_text="Njia ya picha ya ajali (Path to accident photo)",
            ),
        ),
    ]