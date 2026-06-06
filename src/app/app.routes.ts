import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'editor',
    loadComponent: () => import('./features/blog/blog-editor/blog-editor.component').then(m => m.BlogEditorComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
