import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

export type AcademicCategory = 'Títulos' | 'Certificados' | 'Diplomados' | 'Estudios en la actualidad' | 'Todos';

export interface SkillData {
  id?: number;
  nombre: string;
  icon_class: string;
}

export interface AcademicData {
  id: number;
  titulo_estudio: string;
  categoria: AcademicCategory;
  anio_inicio: number;
  anio_fin?: number;
  en_curso: boolean;
  descripcion: string;
}

@Component({
  selector: 'app-academic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './academic.component.html',
  styleUrl: './academic.component.css'
})
export class AcademicComponent implements OnInit {
  activeFilter: AcademicCategory = 'Todos';
  
  categories: AcademicCategory[] = [
    'Todos', 
    'Títulos', 
    'Certificados', 
    'Diplomados', 
    'Estudios en la actualidad'
  ];

  skills: any[] = [];
  showSkillForm = false;
  skillForm!: FormGroup;
  editingSkillId: number | null = null;
  isSubmittingSkill = false;

  academics: any[] = [];
  showAcadForm = false;
  acadForm!: FormGroup;
  editingAcadId: number | null = null;
  isSubmittingAcad = false;
  selectedDoc: File | null = null;
  isAdmin = false;

  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.skillForm = this.fb.group({
      nombre: ['', Validators.required],
      icon_class: ['']
    });

    this.acadForm = this.fb.group({
      titulo_estudio: ['', Validators.required],
      categoria: ['', Validators.required],
      institucion: [''],
      anio_inicio: ['', [Validators.required, Validators.min(1900)]],
      anio_fin: [''],
      en_curso: [false],
      descripcion: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.supabaseService.session$.subscribe(s => {
      this.isAdmin = !!s;
      if (!this.isAdmin) {
        this.showSkillForm = false;
        this.showAcadForm = false;
      }
    });
    if (isPlatformBrowser(this.platformId)) {
      await this.loadSkills();
      await this.loadAcademic();
    }
  }

  async loadSkills(): Promise<void> {
    const { data } = await this.supabaseService.getSkills();
    this.skills = data || [];
  }

  async onSubmitSkill(): Promise<void> {
    if (this.skillForm.invalid || this.isSubmittingSkill) {
      return;
    }
    this.isSubmittingSkill = true;
    try {
      if (this.editingSkillId !== null) {
        await this.supabaseService.updateSkill(this.editingSkillId, this.skillForm.value);
      } else {
        await this.supabaseService.addSkill(this.skillForm.value);
      }
      await this.loadSkills();
      this.cancelSkillEdit();
    } catch (error) {
      console.error('Error saving skill:', error);
    } finally {
      this.isSubmittingSkill = false;
    }
  }

  editSkill(skill: any): void {
    this.editingSkillId = skill.id;
    this.skillForm.patchValue({
      nombre: skill.nombre,
      icon_class: skill.icon_class
    });
    this.showSkillForm = true;
  }

  async deleteSkill(skill: any): Promise<void> {
    const confirmed = confirm(`¿Estás seguro de eliminar la habilidad: ${skill.nombre}?`);
    if (confirmed) {
      try {
        await this.supabaseService.deleteSkill(skill.id);
        await this.loadSkills();
      } catch (error) {
        console.error('Error deleting skill:', error);
      }
    }
  }

  cancelSkillEdit(): void {
    this.skillForm.reset();
    this.editingSkillId = null;
    this.showSkillForm = false;
  }

  async loadAcademic(): Promise<void> {
    const { data } = await this.supabaseService.getAcademic();
    this.academics = data || [];
  }

  async onSubmitAcad(): Promise<void> {
    if (this.acadForm.invalid || this.isSubmittingAcad) return;
    this.isSubmittingAcad = true;
    try {
      const payload = { ...this.acadForm.value };
      if (payload.en_curso) payload.anio_fin = null;

      if (this.editingAcadId !== null) {
        await this.supabaseService.updateAcademic(this.editingAcadId, payload, this.selectedDoc);
      } else {
        await this.supabaseService.addAcademic(payload, this.selectedDoc);
      }
      await this.loadAcademic();
      this.cancelAcadEdit();
      alert('Registro guardado exitosamente.'); // Retroalimentación de éxito
    } catch (error: any) {
      console.error('Error saving academic record:', error);
      alert('Error transaccional: ' + (error.message || JSON.stringify(error))); // Retroalimentación de fallo
    } finally {
      this.isSubmittingAcad = false;
    }
  }

  editAcademic(acad: any): void {
    this.editingAcadId = acad.id;
    this.acadForm.patchValue({
      titulo_estudio: acad.titulo_estudio,
      categoria: acad.categoria,
      institucion: acad.institucion,
      anio_inicio: acad.anio_inicio,
      anio_fin: acad.anio_fin,
      en_curso: acad.en_curso,
      descripcion: acad.descripcion
    });
    this.selectedDoc = null;
    this.showAcadForm = true;
  }

  async deleteAcademic(acad: any): Promise<void> {
    const confirmed = confirm(`¿Estás seguro de eliminar el registro académico: ${acad.titulo_estudio}?`);
    if (confirmed) {
      try {
        await this.supabaseService.deleteAcademic(acad.id, acad.documento_url);
        await this.loadAcademic();
      } catch (error) {
        console.error('Error deleting academic record:', error);
      }
    }
  }

  cancelAcadEdit(): void {
    this.acadForm.reset({ en_curso: false });
    this.editingAcadId = null;
    this.showAcadForm = false;
    this.selectedDoc = null;
  }

  onDocSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedDoc = file;
    }
  }

  onFilterChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.activeFilter = selectElement.value as AcademicCategory;
  }

  get filteredAcademic(): any[] {
    if (this.activeFilter === 'Todos') {
      return this.academics;
    }
    return this.academics.filter(item => item.categoria === this.activeFilter);
  }

  formatDate(start: number, end?: number): string {
    if (end) {
      return end.toString();
    } else {
      return `${start} - Actualidad`;
    }
  }
}
