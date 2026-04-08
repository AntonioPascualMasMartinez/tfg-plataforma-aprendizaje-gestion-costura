import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { User, Role } from '../../../shared/models/user.model';
import { ConfirmModalComponent } from '../../../shared/modals/confirm-modal/confirm-modal.component';

interface ModalState {
  isOpen: boolean;
  isLoading: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [UpperCasePipe, ConfirmModalComponent, ReactiveFormsModule],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  searchControl = new FormControl('');
  searchTerm = '';

  currentPage = 1;
  limit = 10;
  totalUsers = 0;
  totalPages = 0;

  // --- NUEVO: Estado de Ordenación ---
  sortColumn: keyof User | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  modalState: ModalState = {
    isOpen: false,
    isLoading: false,
    title: '',
    message: '',
    confirmText: '',
    isDestructive: false,
  };

  selectedUser: User | null = null;
  pendingAction: 'role' | 'status' | null = null;
  pendingRole: Role | null = null;
  pendingStatus: boolean | null = null;

  ngOnInit() {
    this.setupSearch();
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term || '';
        this.currentPage = 1;
        this.loadUsers();
      });
  }

  loadUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.userService.getAllUsers(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.users = response.data.docs;
        this.totalUsers = response.data.totalDocs || this.users.length;
        this.totalPages = response.data.totalPages || 1;

        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          this.users = this.users.filter(
            (u) =>
              u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
          );
        }

        // Aplicar ordenación actual a los nuevos datos cargados
        this.applySort();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.errorMessage = 'No se pudieron cargar los usuarios.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // --- NUEVO: Métodos de Ordenación ---
  toggleSort(column: keyof User) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.cdr.detectChanges();
  }

  private applySort() {
    if (!this.sortColumn) return;

    // Clonamos el array para forzar la detección de cambios (OnPush)
    this.users = [...this.users].sort((a, b) => {
      let valA = a[this.sortColumn as keyof User];
      let valB = b[this.sortColumn as keyof User];

      // Manejo de nulos o indefinidos (ej: sewingLevel opcional)
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      // Comparación normalizada para textos
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  requestToggleRole(user: User) {
    this.selectedUser = user;
    this.pendingRole = user.role === 'Admin' ? 'User' : 'Admin';
    this.pendingAction = 'role';

    this.modalState = {
      isOpen: true,
      isLoading: false,
      title: 'Cambiar Rol de Usuario',
      message: `¿Estás seguro de cambiar el rol de ${user.displayName} a ${this.pendingRole}?`,
      confirmText: 'Sí, cambiar rol',
      isDestructive: false,
    };
  }

  requestToggleStatus(user: User) {
    this.selectedUser = user;
    this.pendingStatus = !user.isActive;
    this.pendingAction = 'status';

    const actionText = this.pendingStatus ? 'desbanear' : 'banear';

    this.modalState = {
      isOpen: true,
      isLoading: false,
      title: this.pendingStatus ? 'Desbanear Usuario' : 'Banear Usuario',
      message: `¿Estás seguro de que deseas ${actionText} a ${user.displayName}?`,
      confirmText: this.pendingStatus ? 'Sí, desbanear' : 'Sí, banear',
      isDestructive: !this.pendingStatus,
    };
  }

  executeAction() {
    if (!this.selectedUser || !this.pendingAction) return;

    this.modalState.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.pendingAction === 'role' && this.pendingRole) {
      this.userService.changeRole(this.selectedUser._id, this.pendingRole).subscribe({
        next: (response) => {
          this.selectedUser!.role = response.data.role;
          this.closeModal();
          this.applySort(); // Reordenar si el cambio afecta a la tabla
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Hubo un error al cambiar el rol.';
          this.closeModal();
          this.cdr.detectChanges();
        },
      });
    } else if (this.pendingAction === 'status' && this.pendingStatus !== null) {
      this.userService.toggleUserStatus(this.selectedUser._id, this.pendingStatus).subscribe({
        next: (response) => {
          this.selectedUser!.isActive = response.data.isActive;
          this.closeModal();
          this.applySort(); // Reordenar si el cambio afecta a la tabla
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage =
            err.error?.message || 'Hubo un error al cambiar el estado del usuario.';
          this.closeModal();
          this.cdr.detectChanges();
        },
      });
    }
  }

  closeModal() {
    this.modalState.isOpen = false;
    this.modalState.isLoading = false;
    this.selectedUser = null;
    this.pendingAction = null;
    this.pendingRole = null;
    this.pendingStatus = null;
  }
}
