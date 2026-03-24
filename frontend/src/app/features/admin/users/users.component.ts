import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  templateUrl: './users.component.html',
})
export class UsersComponent {
  // Datos estáticos (Mock)
  mockUsers = [
    { id: '1', name: 'Ana García', email: 'ana@ejemplo.com', role: 'User', level: 'Intermedio', isActive: true },
    { id: '2', name: 'Carlos Admin', email: 'carlos@needly.com', role: 'Admin', level: 'Experto', isActive: true },
    { id: '3', name: 'Laura Costurera', email: 'laura@ejemplo.com', role: 'User', level: 'Principiante', isActive: false },
  ];
}