from django.test import TestCase
from apps.users.models import User


class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testdoctor',
            email='doctor@kss.com',
            password='securepassword123',
            role=User.Role.DOCTOR
        )

    def test_create_user_with_role(self):
        self.assertEqual(self.user.username, 'testdoctor')
        self.assertEqual(self.user.email, 'doctor@kss.com')
        self.assertEqual(self.user.role, User.Role.DOCTOR)
        self.assertTrue(self.user.is_doctor())
        self.assertFalse(self.user.is_patient())

    def test_str_representation(self):
        self.assertEqual(str(self.user), "testdoctor (Doctor)")

