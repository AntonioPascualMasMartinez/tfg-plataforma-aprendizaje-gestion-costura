/**
 * @file footer.ts
 * @description Componente estructural estático correspondiente al pie de página global.
 * Centraliza la navegación secundaria y metadatos legales de la aplicación.
 */
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  /** Estado reactivo unidireccional que garantiza la vigencia temporal en el aviso de copyright. */
  currentYear = signal(new Date().getFullYear());
}
