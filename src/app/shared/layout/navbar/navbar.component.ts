import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isScrolled = false;
  isMobileMenuOpen = false;
  activeSection = 'hero';

  session$: any;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.session$ = this.supabaseService.session$;
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.isScrolled = window.scrollY > 50;

      const sections = ['hero', 'about', 'experience', 'projects', 'academic'];
      let currentSection = 'hero';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            currentSection = section;
          }
        }
      }
      this.activeSection = currentSection;
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  scrollToSection(sectionId: string): void {
    if (typeof window !== 'undefined') {
      // If we are on login page, redirect to home page first
      if (this.isLoginRoute) {
        this.router.navigate(['/']).then(() => {
          setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
              this.activeSection = sectionId;
            }
          }, 100);
        });
      } else {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          this.activeSection = sectionId;
          this.isMobileMenuOpen = false;
        }
      }
    }
  }

  get isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  async onSignOut(): Promise<void> {
    try {
      await this.supabaseService.signOut();
      this.isMobileMenuOpen = false;
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  navigateToLogin(): void {
    this.isMobileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  navigateToHome(): void {
    this.isMobileMenuOpen = false;
    this.router.navigate(['/']);
  }
}
