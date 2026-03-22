import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-shell.html',
})
export class AuthShell {
  @Input() imageUrl: string = '/hero/hero-1.webp';
  @Input() quoteText: string = 'Cada puntada cuenta una historia.';
}
