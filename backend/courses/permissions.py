# backend/courses/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import Enrollment

class IsInstructorOrReadOnly(BasePermission):
    """
    Allows read-only access to any user,
    but only allows write access to users in the 'Instructors' group.
    """
    def has_permission(self, request, view):
        # Allow all GET, HEAD, or OPTIONS requests.
        if request.method in SAFE_METHODS:
            return True

        # Deny write access if the user is not authenticated or not an instructor.
        if not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='Instructors').exists()
    

class IsEnrolled(BasePermission):
    """
    Allows access only to users who are enrolled in the course.
    """
    def has_object_permission(self, request, view, obj):
        # The 'obj' here is a Lesson instance.
        # We check if an enrollment exists for the current user and the lesson's course.
        course = obj.module.course

        # Allow the instructor of the course to always have access
        if course.instructor == request.user:
            return True

        # Check if the user is enrolled in the course
        return Enrollment.objects.filter(course=course, user=request.user).exists()