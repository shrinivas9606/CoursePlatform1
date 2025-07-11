# backend/courses/serializers.py
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework import serializers
from .models import Course, Module, Lesson, LessonCompletion, Enrollment

class LessonSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    instructor_id = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'order', 'video_url', 'content', 'is_completed', 'instructor_id']

    def get_is_completed(self, obj):
        # Check if a request object with a user is in the context
        user = self.context.get('request').user
        if user and user.is_authenticated:
            # Return True if a completion record exists for this user and lesson
            return LessonCompletion.objects.filter(lesson=obj, user=user).exists()
        return False
    
    def get_instructor_id(self, obj):
        return obj.module.course.instructor.id

class ModuleSerializer(serializers.ModelSerializer):
    # We need to pass the context to the nested LessonSerializer
    lessons = LessonSerializer(many=True, read_only=True)
    class Meta:
        model = Module
        fields = ['id', 'title', 'order', 'lessons']

class CourseListSerializer(serializers.ModelSerializer):
    """
    A simple serializer for the list view of courses.
    """
    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor']

class CourseDetailSerializer(serializers.ModelSerializer):
    """
    A detailed serializer for a single course, including all its modules and lessons.
    """
    # This nests the ModuleSerializer, showing all modules for this course
    modules = ModuleSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'instructor', 'price', 'modules', 'is_enrolled']
        read_only_fields = ['instructor']

    def get_is_enrolled(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return Enrollment.objects.filter(course=obj, user=user).exists()
        return False


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['course', 'title', 'order']

class LessonWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ['module', 'title', 'order', 'video_url', 'content']


class CustomUserDetailsSerializer(UserDetailsSerializer):
    # We add a new field called 'groups'
    groups = serializers.StringRelatedField(many=True)

    class Meta(UserDetailsSerializer.Meta):
        # We inherit the fields from the default serializer and add our new one
        fields = UserDetailsSerializer.Meta.fields + ('groups',)
