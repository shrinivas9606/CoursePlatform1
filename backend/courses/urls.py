# backend/courses/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, EnrollCourseView, MyCoursesView, LessonCompleteView, ModuleViewSet, LessonViewSet, UserDetailView, CreateOrderView, VerifyPaymentView, FreeEnrollView

# This sets up the router
router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'modules', ModuleViewSet, basename='module') 
router.register(r'lessons', LessonViewSet, basename='lesson') 

# This creates the final URL patterns
urlpatterns = [
    path('', include(router.urls)),
    # URL for enrolling in a course
    path('courses/<int:course_id>/enroll/', EnrollCourseView.as_view(), name='enroll-course'),
    # URL for the user's dashboard
    path('my-courses/', MyCoursesView.as_view(), name='my-courses'),
    path('lessons/<int:lesson_id>/complete/', LessonCompleteView.as_view(), name='lesson-complete'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('courses/<int:course_id>/create-order/', CreateOrderView.as_view(), name='create-order'),
    path('courses/<int:course_id>/verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('courses/<int:course_id>/free-enroll/', FreeEnrollView.as_view(), name='free-enroll'),
]

urlpatterns += router.urls