import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  errorMessage: string | null = null;

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm.valid) {
      const credentials = {
        username: this.loginForm.value.username!,
        password: this.loginForm.value.password!
      };
      
      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.authService.saveToken(response.token);
          localStorage.setItem('username', credentials.username);
          this.router.navigate(['/main']);
        },
        error: (err) => {
          console.error('Error logging in:', err);
          this.errorMessage = err.error?.message || 'LOGIN_FAILED: INVALID_CREDENTIALS';
        }
      });
    }
  }
}
