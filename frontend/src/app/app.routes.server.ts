import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. Definimos las rutas dinámicas para que NO intenten prerrenderizarse.
  // Al usar RenderMode.Server, Angular las renderizará en el servidor cuando el usuario las pida.
  {
    path: 'home/proyectos/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'home/proyectos/:id/edit',
    renderMode: RenderMode.Server,
  },

  // 2. Para el resto de rutas (Landing, Login, etc.), mantenemos el Prerender
  // para que la carga inicial sea instantánea y mejore el SEO.
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
