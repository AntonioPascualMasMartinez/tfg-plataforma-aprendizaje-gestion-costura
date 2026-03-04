import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
})
export class AuthShell {
  // Permite personalizar la columna de la imagen desde los componentes hijos
  @Input() imageUrl: string = '/hero/hero-1.jpg';
  @Input() badgeText: string = 'Tu espacio creativo';
  @Input() quoteText: string = 'Cada puntada cuenta una historia.';
}
