import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { BuildService } from '../../services/build.service';

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
  private buildService = inject(BuildService);
  private router = inject(Router);

  errorMessage: string | null = null;
  isLoading = signal<boolean>(false);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      this.errorMessage = null;

      const credentials = {
        username: this.loginForm.value.username!,
        password: this.loginForm.value.password!
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.authService.saveToken(response.token);
          localStorage.setItem('username', credentials.username);
          this.buildService.loadLastBuild(credentials.username);
          this.router.navigate(['/main']);
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error logging in:', err);
          this.errorMessage = err.error?.message || 'LOGIN_FAILED: INVALID_CREDENTIALS';
        }
      });
    }
  }
}