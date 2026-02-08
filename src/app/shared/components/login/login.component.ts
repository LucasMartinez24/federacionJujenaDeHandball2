import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  error: string = '';
  loading: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.error = '';
    this.loading = true;

    const credentials: LoginCredentials = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
    };

    this.authService.login(credentials).subscribe({
      next: (user) => {
        this.loading = false;
        if (user) {
          // Redirigir según el rol del usuario
          if (user.role === 'admin') {
            this.router.navigate(['/clubes']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err;
        console.error('Error de login:', err);
      },
    });
  }
}
