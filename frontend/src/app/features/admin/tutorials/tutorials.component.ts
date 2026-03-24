import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-tutorials',
  standalone: true,
  templateUrl: './tutorials.component.html',
})
export class TutorialsComponent {
  // Datos estáticos (Mock)
  mockTutorials = [
    { id: '101', title: 'Patrón de Falda Circular', author: 'Ana García', status: 'Publicado', date: '2023-10-24' },
    { id: '102', title: 'Cómo enhebrar la máquina remalladora', author: 'Laura Costurera', status: 'Pendiente', date: '2023-10-25' },
    { id: '103', title: 'Técnica prohibida de costura', author: 'Spammer123', status: 'Rechazado', date: '2023-10-26' },
  ];
}