import { Component, Inject, PLATFORM_ID, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';

export interface AboutData {
  nombre: string;
  titulo: string;
  fecha_nacimiento: string;
  correo: string;
  telefono: string;
  sobre_mi: string;
  idiomas: string | string[];
  nacionalidad: string;
  residencia: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  x_twitter?: string;
  foto_url?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  iconClass: string;
  iconSvg?: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit, OnDestroy {
  profile: any = null;
  age: number = 0;
  socialLinks: any[] = [];
  profileForm!: FormGroup;
  showAdminForm = false;
  isSubmitting = false;
  selectedFile: File | null = null;
  private sub!: Subscription;
  isAdmin = false;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      titulo: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      sobre_mi: ['', Validators.required],
      idiomas: [''],
      nacionalidad: [''],
      residencia: [''],
      linkedin: [''],
      github: [''],
      instagram: [''],
      facebook: [''],
      x_twitter: ['']
    });
  }

  ngOnInit(): void {
    this.supabaseService.session$.subscribe(s => {
      this.isAdmin = !!s;
      if (!this.isAdmin) {
        this.showAdminForm = false;
      }
    });
    if (isPlatformBrowser(this.platformId)) {
      this.supabaseService.loadProfile();
      this.sub = this.supabaseService.profile$.subscribe(data => {
        if (data) {
          this.profile = data;
          this.age = this.calculateAge(data.fecha_nacimiento);

          let languagesArray: string[] = [];
          if (data.idiomas) {
            if (Array.isArray(data.idiomas)) {
              languagesArray = data.idiomas;
            } else if (typeof data.idiomas === 'string') {
              languagesArray = data.idiomas
                .split(',')
                .map((l: string) => l.trim())
                .filter((l: string) => l.length > 0);
            }
          }
          this.profile.languages = languagesArray;

          const links = [];
          if (data.github) {
            links.push({
              platform: 'GitHub',
              url: data.github,
              iconSvg: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" clip-rule="evenodd"/></svg>`
            });
          }
          if (data.linkedin) {
            links.push({
              platform: 'LinkedIn',
              url: data.linkedin,
              iconSvg: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
            });
          }
          if (data.x_twitter) {
            links.push({
              platform: 'Twitter',
              url: data.x_twitter,
              iconSvg: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
            });
          }
          if (data.instagram) {
            links.push({
              platform: 'Instagram',
              url: data.instagram,
              iconSvg: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
            });
          }
          if (data.facebook) {
            links.push({
              platform: 'Facebook',
              url: data.facebook,
              iconSvg: `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`
            });
          }
          this.socialLinks = links;

          this.profileForm.patchValue(data);
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  calculateAge(birthDateString: string): number {
    if (!birthDateString) return 0;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    try {
      await this.supabaseService.updateProfile(this.profileForm.value, this.selectedFile);
      this.showAdminForm = false;
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  cancelEdit(): void {
    this.showAdminForm = false;
    this.selectedFile = null;
    if (this.profile) {
      this.profileForm.patchValue(this.profile);
    }
  }
}
