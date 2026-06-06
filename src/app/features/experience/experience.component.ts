import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

export interface ExperienceData {
  id?: number;
  cargo: string;
  empresa: string;
  anos_trabajados: number;
  descripcion: string;
  logo_url?: string;
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css'
})
export class ExperienceComponent implements OnInit {
  experiences: any[] = [];
  showAdminForm = false;
  isSubmitting = false;
  editingExpId: number | null = null;
  selectedFile: File | null = null;
  expForm!: FormGroup;
  isAdmin = false;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.expForm = this.fb.group({
      cargo: ['', Validators.required],
      empresa: ['', Validators.required],
      anos_trabajados: ['', [Validators.required, Validators.min(-1)]],
      descripcion: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.supabaseService.session$.subscribe(s => {
      this.isAdmin = !!s;
      if (!this.isAdmin) {
        this.showAdminForm = false;
      }
    });
    if (isPlatformBrowser(this.platformId)) {
      await this.loadExperiences();
    }
  }

  async loadExperiences(): Promise<void> {
    const { data } = await this.supabaseService.getExperiences();
    this.experiences = data || [];
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.expForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    try {
      if (this.editingExpId !== null) {
        await this.supabaseService.updateExperience(this.editingExpId, this.expForm.value, this.selectedFile);
      } else {
        await this.supabaseService.addExperience(this.expForm.value, this.selectedFile);
      }
      await this.loadExperiences();
      this.cancelEdit();
    } catch (error) {
      console.error('Error saving experience:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  cancelEdit(): void {
    this.expForm.reset();
    this.selectedFile = null;
    this.editingExpId = null;
    this.showAdminForm = false;
  }

  editExperience(exp: any): void {
    this.editingExpId = exp.id;
    this.expForm.patchValue({
      cargo: exp.cargo,
      empresa: exp.empresa,
      anos_trabajados: exp.anos_trabajados,
      descripcion: exp.descripcion
    });
    this.showAdminForm = true;
  }

  async deleteExperience(exp: any): Promise<void> {
    const confirmed = confirm('¿Estás seguro de eliminar esta experiencia laboral?');
    if (confirmed) {
      try {
        await this.supabaseService.deleteExperience(exp.id, exp.logo_url);
        await this.loadExperiences();
      } catch (error) {
        console.error('Error deleting experience:', error);
      }
    }
  }
}
