# backend/courses/admin.py
from django.contrib import admin
from .models import Course, Module, Lesson # Import Module and Lesson

admin.site.register(Course)
admin.site.register(Module)   # Add this line
admin.site.register(Lesson)   # Add this line