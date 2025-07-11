# backend/courses/views.py
import razorpay
from django.conf import settings
from rest_framework.exceptions import ValidationError
from .permissions import IsEnrolled
from django.contrib.auth.models import User
from dj_rest_auth.serializers import UserDetailsSerializer
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404 # Import this
from rest_framework import generics # Import generics
from rest_framework import viewsets, views, status 
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .models import Course, Module, Lesson, Enrollment, LessonCompletion
from .serializers import CourseListSerializer, CourseDetailSerializer, LessonSerializer, ModuleSerializer, ModuleWriteSerializer, LessonWriteSerializer, CustomUserDetailsSerializer # Import LessonSerializer
from .permissions import IsInstructorOrReadOnly, IsEnrolled


razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class CreateOrderView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, format=None):
        try:
            course = Course.objects.get(pk=course_id)
            if course.price <= 0:
                raise ValidationError("This course is free and cannot be purchased.")

            # Razorpay expects the amount in the smallest currency unit (e.g., paise for INR)
            amount_in_paise = int(course.price * 100)

            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_course_{course.id}",
            }
            order = razorpay_client.order.create(data=order_data)
            return Response(order)

        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, format=None):
        try:
            params_dict = {
                'razorpay_order_id': request.data.get('razorpay_order_id'),
                'razorpay_payment_id': request.data.get('razorpay_payment_id'),
                'razorpay_signature': request.data.get('razorpay_signature')
            }

            # Verify the payment signature
            razorpay_client.utility.verify_payment_signature(params_dict)

            # If verification is successful, enroll the user
            course = Course.objects.get(pk=course_id)
            Enrollment.objects.get_or_create(user=request.user, course=course)

            return Response({'status': 'payment successful'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': 'Payment verification failed', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)



class CourseViewSet(viewsets.ModelViewSet):
    """
    A simple ViewSet for viewing courses.
    """
    queryset = Course.objects.all()
    serializer_class = CourseDetailSerializer
    authentication_classes = [TokenAuthentication] # Add authentication
    permission_classes = [IsInstructorOrReadOnly] # Use the new permission

    def get_serializer_context(self):
        return {'request': self.request}

    def get_serializer_class(self):
        # If the request is for a list of items, use the simple serializer
        if self.action == 'list':
            return CourseListSerializer
        return super().get_serializer_class()
    
    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the instructor
        serializer.save(instructor=self.request.user)
    
class EnrollCourseView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated] # Ensures only logged-in users can enroll

    def post(self, request, course_id, format=None):
        try:
            course = Course.objects.get(pk=course_id)
            # Create the enrollment, linking the current user to the course
            enrollment, created = Enrollment.objects.get_or_create(user=request.user, course=course)
            if created:
                return Response({'status': 'enrolled'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'status': 'already enrolled'}, status=status.HTTP_200_OK)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

class MyCoursesView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated] # Protect this view

    def get(self, request, format=None):
        # Get all enrollments for the current user
        enrollments = Enrollment.objects.filter(user=request.user)
        # Get the actual Course objects from the enrollments
        courses = [enrollment.course for enrollment in enrollments]
        # Serialize the course data to send back
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)
    

class LessonCompleteView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id, format=None):
        try:
            lesson = Lesson.objects.get(pk=lesson_id)
            completion, created = LessonCompletion.objects.get_or_create(user=request.user, lesson=lesson)
            if created:
                return Response({'status': 'completed'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'status': 'already completed'}, status=status.HTTP_200_OK)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated] # Only authenticated users can access

    def get_serializer_class(self):
        # Use the simple serializer for writing, and the detailed one for reading
        if self.action in ['create', 'update', 'partial_update']:
            return ModuleWriteSerializer
        return ModuleSerializer

    def perform_create(self, serializer):
        # Check if the user is the instructor of the course before creating a module
        course = get_object_or_404(Course, pk=self.request.data.get('course'))
        if course.instructor != self.request.user:
            raise PermissionDenied("You are not the instructor of this course.")
        serializer.save()

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    authentication_classes = [TokenAuthentication]
    # Note: We remove permission_classes from here

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LessonWriteSerializer
        return LessonSerializer
    
    # This new method applies the correct permission based on the action
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'retrieve': # 'retrieve' is the action for a detail view (e.g., /api/lessons/1/)
            self.permission_classes = [IsEnrolled]
        else: # For list, create, update, etc.
            self.permission_classes = [IsAuthenticated]
        return super(LessonViewSet, self).get_permissions()

    def perform_create(self, serializer):
        module = get_object_or_404(Module, pk=self.request.data.get('module'))
        if module.course.instructor != self.request.user:
            raise PermissionDenied("You are not the instructor of this course.")
        serializer.save()


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = CustomUserDetailsSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    

class FreeEnrollView(views.APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, course_id, format=None):
        try:
            course = Course.objects.get(pk=course_id)
            if course.price > 0:
                return Response({'error': 'This course is not free.'}, status=status.HTTP_400_BAD_REQUEST)

            # Create the enrollment for the free course
            Enrollment.objects.get_or_create(user=request.user, course=course)
            return Response({'status': 'enrolled for free'}, status=status.HTTP_200_OK)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)