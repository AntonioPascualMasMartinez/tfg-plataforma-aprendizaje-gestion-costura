import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Importar
import { UpperCasePipe } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User, Role } from '../../../shared/models/user.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [UpperCasePipe, ConfirmModalComponent],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef); // <-- 2. Inyectar

  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  // --- Estados del Modal ---
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalConfirmText = '';
  isModalDestructive = false;
  isModalLoading = false;

  // --- Variables para la acción pendiente ---
  selectedUser: User | null = null;
  pendingAction: 'role' | 'status' | null = null;
  pendingRole: Role | null = null;
  pendingStatus: boolean | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // <-- Notificar inicio de carga

    this.userService.getAllUsers(1, 50).subscribe({
      next: (response) => {
        this.users = response.data.docs;
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- 3. Refrescar lista de usuarios
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage = 'No se pudieron cargar los usuarios.';
        this.isLoading = false;
        this.cdr.detectChanges(); // <-- 3. Refrescar tras error
      },
    });
  }

  // 1. Prepara el modal para cambiar rol
  requestToggleRole(user: User) {
    this.selectedUser = user;
    this.pendingRole = user.role === 'Admin' ? 'User' : 'Admin';
    this.pendingAction = 'role';

    this.modalTitle = 'Cambiar Rol de Usuario';
    this.modalMessage = `¿Estás seguro de cambiar el rol de ${user.displayName} a ${this.pendingRole}?`;
    this.modalConfirmText = 'Sí, cambiar rol';
    this.isModalDestructive = false;
    this.isModalOpen = true;
  }

  // 2. Prepara el modal para banear/desbanear
  requestToggleStatus(user: User) {
    this.selectedUser = user;
    this.pendingStatus = !user.isActive;
    this.pendingAction = 'status';

    const actionText = this.pendingStatus ? 'desbanear' : 'banear';

    this.modalTitle = this.pendingStatus ? 'Desbanear Usuario' : 'Banear Usuario';
    this.modalMessage = `¿Estás seguro de que deseas ${actionText} a ${user.displayName}?`;
    this.modalConfirmText = this.pendingStatus ? 'Sí, desbanear' : 'Sí, banear';
    this.isModalDestructive = !this.pendingStatus;
    this.isModalOpen = true;
  }

  // 3. Ejecuta la acción confirmada desde el modal
  executeAction() {
    if (!this.selectedUser || !this.pendingAction) return;

    this.isModalLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges(); // <-- Actualiza estado del botón modal a "Cargando"

    if (this.pendingAction === 'role' && this.pendingRole) {
      this.userService.changeRole(this.selectedUser._id, this.pendingRole).subscribe({
        next: (response) => {
          this.selectedUser!.role = response.data.role;
          this.closeModal();
          this.cdr.detectChanges(); // <-- 3. Actualizar fila tras cambio de rol
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Hubo un error al cambiar el rol.';
          this.closeModal();
          this.cdr.detectChanges(); // <-- Notificar error
        },
      });
    } else if (this.pendingAction === 'status' && this.pendingStatus !== null) {
      this.userService.toggleUserStatus(this.selectedUser._id, this.pendingStatus).subscribe({
        next: (response) => {
          this.selectedUser!.isActive = response.data.isActive;
          this.closeModal();
          this.cdr.detectChanges(); // <-- 3. Actualizar fila tras banear/desbanear
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Hubo un error al cambiar el estado del usuario.';
          this.closeModal();
          this.cdr.detectChanges(); // <-- Notificar error
        },
      });
    }
  }

  // 4. Cierra el modal y limpia las variables
  closeModal() {
    this.isModalOpen = false;
    this.isModalLoading = false;
    this.selectedUser = null;
    this.pendingAction = null;
    this.pendingRole = null;
    this.pendingStatus = null;
  }
}
