import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {
  projects: any[] = [];
  showAdminForm = false;
  projectForm!: FormGroup;
  selectedFile: File | null = null;
  isSubmitting = false;
  editingProjectId: string | null = null;
  isAdmin = false;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      year: ['', Validators.required],
      description: ['', Validators.required],
      projectUrl: ['']
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
      await this.loadProjects();
    }
  }

  async loadProjects(): Promise<void> {
    const { data } = await this.supabaseService.getProjects();
    this.projects = data || [];
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid || this.isSubmitting || (!this.editingProjectId && !this.selectedFile)) return;

    this.isSubmitting = true;
    try {
      if (this.editingProjectId) {
        await this.supabaseService.updateProject(this.editingProjectId, this.projectForm.value, this.selectedFile);
      } else {
        await this.supabaseService.addProject(this.projectForm.value, this.selectedFile!);
      }
      await this.loadProjects();
    } catch (error) {
      console.error('Error processing project:', error);
    } finally {
      this.isSubmitting = false;
      this.cancelEdit();
    }
  }

  cancelEdit(): void {
    this.projectForm.reset();
    this.selectedFile = null;
    this.editingProjectId = null;
    this.showAdminForm = false;
  }

  editProject(project: any): void {
    this.editingProjectId = project.id;
    this.projectForm.patchValue({
      title: project.title,
      year: project.year,
      description: project.description,
      projectUrl: project.project_url
    });
    this.showAdminForm = true;
  }

  async deleteProject(project: any): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;
    try {
      await this.supabaseService.deleteProject(project.id, project.image_url);
      await this.loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  getRowShift(index: number): string {
    if (Math.floor(index / 2) % 2 === 0) {
      return 'md:translate-x-[25px]';
    } else {
      return 'md:-translate-x-[25px]';
    }
  }
}
