/**
 * @file auth-shell.ts
 * @description Componente presentacional (Dumb Component) que actúa como envoltura (Wrapper/Layout)
 * para todas las vistas del módulo de autenticación. Centraliza el diseño base (Layout dividido)
 * y expone propiedades de entrada para personalizar el contenido multimedia y textual por vista.
 */
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
})
export class AuthShell {
  /** Enlace absoluto o relativo al activo multimedia de fondo. */
  @Input() imageUrl: string = '/hero/hero-1.webp';

  /** Cita o mensaje inspiracional a mostrar en la sección gráfica del layout. */
  @Input() quoteText: string = 'Cada puntada cuenta una historia.';
}
