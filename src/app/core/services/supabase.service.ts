import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private profileSubject = new BehaviorSubject<any>(null);
  profile$ = this.profileSubject.asObservable();

  private sessionSubject = new BehaviorSubject<Session | null>(null);
  session$ = this.sessionSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.sessionSubject.next(session);
    });
  }

  // Inicio sesión en Supabase enviando correo y contraseña para obtener un token JWT válido y proteger las rutas de administración.
  async signIn(email: string, password: string) {
    // Inicio sesión con credenciales llamando al método signInWithPassword
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // Cierra la sesión del usuario actual en Supabase para invalidar su sesión y restringir el acceso administrativo.
  async signOut() {
    // Cierra sesión llamando al método signOut
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getProjects(): Promise<any> {
    return this.supabase
      .from('proyectos')
      // Consultamos los registros utilizando select.
      .select('*')
      .order('id', { ascending: false });
  }

  async addProject(project: any, file: File): Promise<void> {
    // Sube el archivo de imagen de proyecto al bucket 'imagenes' en Supabase storage usando el método upload.
    const { data, error } = await this.supabase.storage
      .from('imagenes')
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('imagenes')
      .getPublicUrl(data!.path);

    // Inserta un nuevo registro de proyecto en la tabla 'proyectos' usando el método insert.
    await this.supabase.from('proyectos').insert([
      {
        title: project.title,
        year: project.year,
        description: project.description,
        project_url: project.projectUrl,
        image_url: publicUrlData.publicUrl
      }
    ]);
  }

  async deleteProject(id: string, imageUrl?: string): Promise<void> {
    if (imageUrl) {
      const filename = imageUrl.split('/').pop();
      if (filename) {
        await this.supabase.storage.from('imagenes').remove([filename]);
      }
    }
    // Elimina el registro del proyecto coincidente en la tabla 'proyectos' usando el método delete.
    await this.supabase.from('proyectos').delete().eq('id', id);
  }

  async updateProject(id: string, project: any, file?: File | null): Promise<void> {
    const payload: any = {
      title: project.title,
      year: project.year,
      description: project.description,
      project_url: project.projectUrl
    };

    if (file) {
      // Sube el nuevo archivo de imagen al bucket 'imagenes' en Supabase storage usando el método upload.
      const { data, error } = await this.supabase.storage
        .from('imagenes')
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(data!.path);

      payload['image_url'] = publicUrlData.publicUrl;
    }

    // Actualiza el registro del proyecto correspondiente usando el método update.
    await this.supabase.from('proyectos').update(payload).eq('id', id);
  }

  async loadProfile(): Promise<void> {
    const { data, error } = await this.supabase
      .from('perfil_personal')
      // Consulta los datos del perfil utilizando select en la tabla 'perfil_personal'.
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      this.profileSubject.next(data);
    }
  }

  async updateProfile(profileData: any, file?: File | null): Promise<void> {
    if (file) {
      // Sube la foto del perfil al bucket 'imagenes' usando el método upload.
      const { data, error } = await this.supabase.storage
        .from('imagenes')
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(data!.path);

      profileData['foto_url'] = publicUrlData.publicUrl;
    }

    const { error } = await this.supabase
      .from('perfil_personal')
      .upsert({ id: 1, ...profileData });

    if (error) {
      throw error;
    }

    await this.loadProfile();
  }

  async getExperiences(): Promise<any> {
    return this.supabase
      .from('experiencia')
      // Consultamos los registros utilizando select.
      .select('*')
      .order('id', { ascending: false });
  }

  async addExperience(exp: any, file?: File | null): Promise<void> {
    const payload: any = {
      cargo: exp.cargo,
      empresa: exp.empresa,
      anos_trabajados: exp.anos_trabajados,
      descripcion: exp.descripcion
    };

    if (file) {
      // Sube el logo al bucket 'imagenes' usando el método upload.
      const { data, error } = await this.supabase.storage
        .from('imagenes')
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(data!.path);

      payload['logo_url'] = publicUrlData.publicUrl;
    }

    // Inserta una nueva experiencia en la tabla utilizando el método insert.
    const { error } = await this.supabase.from('experiencia').insert([payload]);

    if (error) {
      throw error;
    }
  }

  async updateExperience(id: number, exp: any, file?: File | null): Promise<void> {
    const payload: any = {
      cargo: exp.cargo,
      empresa: exp.empresa,
      anos_trabajados: exp.anos_trabajados,
      descripcion: exp.descripcion
    };

    if (file) {
      // Sube el logo actualizado al bucket 'imagenes' usando el método upload.
      const { data, error } = await this.supabase.storage
        .from('imagenes')
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('imagenes')
        .getPublicUrl(data!.path);

      payload['logo_url'] = publicUrlData.publicUrl;
    }

    // Actualiza los datos de la experiencia laboral en la tabla utilizando el método update.
    const { error } = await this.supabase.from('experiencia').update(payload).eq('id', id);

    if (error) {
      throw error;
    }
  }

  async deleteExperience(id: number, logoUrl?: string): Promise<void> {
    if (logoUrl) {
      const filename = logoUrl.split('/').pop();
      if (filename) {
        await this.supabase.storage.from('imagenes').remove([filename]);
      }
    }
    // Elimina la experiencia por ID de la base de datos utilizando el método delete.
    const { error } = await this.supabase.from('experiencia').delete().eq('id', id);

    if (error) {
      throw error;
    }
  }

  async getSkills(): Promise<any> {
    // Consulta todas las habilidades utilizando el método select.
    return this.supabase.from('habilidades').select('*').order('id', { ascending: true });
  }

  async addSkill(skill: any): Promise<any> {
    // Inserta una nueva habilidad de programación en la tabla utilizando el método insert.
    return this.supabase.from('habilidades').insert([skill]);
  }

  async updateSkill(id: number, skill: any): Promise<any> {
    // Actualiza los datos de una habilidad específica utilizando el método update.
    return this.supabase.from('habilidades').update(skill).eq('id', id);
  }

  async deleteSkill(id: number): Promise<any> {
    // Elimina la habilidad correspondiente de la tabla utilizando el método delete.
    return this.supabase.from('habilidades').delete().eq('id', id);
  }

  async getAcademic(): Promise<any> {
    // Consulta todos los registros académicos utilizando el método select.
    return this.supabase.from('academico').select('*').order('anio_inicio', { ascending: false });
  }

  async addAcademic(acad: any, file?: File | null): Promise<any> {
    if (file) {
      // Sanitización RegEx: Elimina acentos y caracteres especiales
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      // Sube el archivo PDF al bucket 'documentos' usando el método upload.
      const { data, error: uploadError } = await this.supabase.storage
        .from('documentos')
        .upload(`${Date.now()}_${sanitizedName}`, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = this.supabase.storage.from('documentos').getPublicUrl(data!.path);
      acad['documento_url'] = publicUrlData.publicUrl;
    }

    // Inserta el registro académico en la tabla utilizando el método insert.
    const { data, error: dbError } = await this.supabase.from('academico').insert([acad]);
    if (dbError) throw dbError;
    return data;
  }

  async updateAcademic(id: number, acad: any, file?: File | null): Promise<any> {
    if (file) {
      // Sanitización RegEx: Elimina acentos y caracteres especiales
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      // Sube el nuevo archivo PDF al bucket 'documentos' usando el método upload.
      const { data, error: uploadError } = await this.supabase.storage
        .from('documentos')
        .upload(`${Date.now()}_${sanitizedName}`, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = this.supabase.storage.from('documentos').getPublicUrl(data!.path);
      acad['documento_url'] = publicUrlData.publicUrl;
    }

    // Actualiza el registro académico correspondiente utilizando el método update.
    const { data, error: dbError } = await this.supabase.from('academico').update(acad).eq('id', id);
    if (dbError) throw dbError;
    return data;
  }

  async deleteAcademic(id: number, docUrl?: string): Promise<any> {
    if (docUrl) {
      const filename = docUrl.split('/').pop();
      if (filename) {
        await this.supabase.storage.from('documentos').remove([filename]);
      }
    }
    // Elimina el registro académico correspondiente utilizando el método delete.
    return this.supabase.from('academico').delete().eq('id', id);
  }
}
