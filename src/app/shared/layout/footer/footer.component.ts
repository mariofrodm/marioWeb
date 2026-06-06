import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  profile$: Observable<any>;

  constructor(private supabaseService: SupabaseService) {
    this.profile$ = this.supabaseService.profile$;
  }
}
