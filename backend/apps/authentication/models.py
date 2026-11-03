from django.db import models
from django.utils import timezone
from datetime import timedelta
import random


class PasswordResetCode(models.Model):
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='password_reset_codes'
    )
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password Reset Code'
        verbose_name_plural = 'Password Reset Codes'

    def is_valid(self):
        # Valid for 15 minutes and not already used
        return not self.is_used and (timezone.now() - self.created_at) < timedelta(minutes=15)

    @classmethod
    def generate_for_user(cls, user):
        # Invalidate previous unused codes for this user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        code = f"{random.randint(100000, 999999)}"
        return cls.objects.create(user=user, code=code)

    def __str__(self):
        return f"Reset code for {self.user.username} ({'Used' if self.is_used else 'Active'})"

