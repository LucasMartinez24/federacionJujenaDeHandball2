import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginCredentials } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
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
    this.userRole = this.authService.getCurrentUser()?.role ?? null;
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
  userRole: string | null = null;
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
        // 'user' ahora es directamente el objeto con el role
        this.loading = false;
        if (user) {
          console.log('Usuario procesado:', user);
          if (user.role === 'admin') {
            this.router.navigate(['/clubes']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Credenciales incorrectas';
      },
    });
  }
}
