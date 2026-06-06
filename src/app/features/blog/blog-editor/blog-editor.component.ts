import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-blog-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './blog-editor.component.html'
})
export class BlogEditorComponent implements OnInit {
  editorForm!: FormGroup;
  portadaFile: File | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.editorForm = this.fb.group({
      titulo: ['', Validators.required],
      categoria: ['', Validators.required],
      abstract: ['', Validators.required],
      bloques: this.fb.array([])
    });
  }

  get bloques(): FormArray {
    return this.editorForm.get('bloques') as FormArray;
  }

  addBlock(tipo: 'subtitulo' | 'parrafo' | 'imagen'): void {
    const bloqueGroup = this.fb.group({
      tipo: [tipo],
      contenido: [''],
      file: [null]
    });
    this.bloques.push(bloqueGroup);
  }

  removeBlock(index: number): void {
    this.bloques.removeAt(index);
  }

  onPortadaSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.portadaFile = file;
    }
  }

  onBlockFileSelected(event: any, index: number): void {
    const file = event.target.files?.[0];
    if (file) {
      const blockGroup = this.bloques.at(index) as FormGroup;
      blockGroup.patchValue({ file: file });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.editorForm.invalid || !this.portadaFile || this.isSubmitting) {
      alert('Por favor completa los campos requeridos y selecciona una portada.');
      return;
    }
    this.isSubmitting = true;

    try {
      const { titulo, categoria, abstract, bloques } = this.editorForm.value;
      const pubData = {
        titulo,
        categoria,
        abstract,
        fecha_publicacion: new Date().toISOString()
      };
      
      await this.supabaseService.createPublicacion(pubData, this.portadaFile, bloques);
      alert('Publicación guardada exitosamente.');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert('Error al guardar la publicación: ' + (error.message || JSON.stringify(error)));
    } finally {
      this.isSubmitting = false;
    }
  }
}
