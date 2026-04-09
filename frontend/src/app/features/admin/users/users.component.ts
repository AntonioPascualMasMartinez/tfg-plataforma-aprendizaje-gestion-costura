/**
 * @file users.component.ts
 * @description Componente contenedor (Smart Component) para la administración del ciclo de vida de las cuentas de usuario.
 * Facilita operaciones críticas como la alteración de privilegios (RBAC) y la suspensión lógica (baneo).
 * Implementa estrategias de optimización de renderizado (OnPush) y flujos reactivos para la búsqueda en tiempo real.
 */
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

/**
 * Contrato estricto para la gestión de estados de la ventana modal de confirmación.
 */
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

  /** Sujeto emisor utilizado para la recolección de basura y cancelación de suscripciones activas. */
  private destroy$ = new Subject<void>();

  users: User[] = [];
  isLoading = false;
  errorMessage = '';

  /* Instancia reactiva para el control de la entrada de búsqueda */
  searchControl = new FormControl('');
  searchTerm = '';

  /* Atributos de metadatos de paginación */
  currentPage = 1;
  limit = 10;
  totalUsers = 0;
  totalPages = 0;

  /* Atributos de estado para el ordenamiento algorítmico algorítmico */
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

  /* Almacenes de memoria transaccional para la confirmación de acciones */
  selectedUser: User | null = null;
  pendingAction: 'role' | 'status' | null = null;
  pendingRole: Role | null = null;
  pendingStatus: boolean | null = null;

  ngOnInit(): void {
    this.setupSearch();
    this.loadUsers();
  }

  ngOnDestroy(): void {
    /* Emisión de señal de finalización para destruir las tuberías activas de RxJS */
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Suscribe el componente a las mutaciones del control de búsqueda.
   * Implementa una política de `debounceTime` para mitigar la saturación de
   * peticiones a la API durante la escritura activa del usuario.
   */
  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term || '';
        this.currentPage = 1;
        this.loadUsers();
      });
  }

  /**
   * Invoca el endpoint del catálogo global de usuarios y sincroniza la paginación.
   */
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.userService.getAllUsers(this.currentPage, this.limit).subscribe({
      next: (response) => {
        this.users = response.data.docs;
        this.totalUsers = response.data.totalDocs || this.users.length;
        this.totalPages = response.data.totalPages || 1;

        /* Estrategia de filtrado compuesto combinando búsuqeda remota y local temporal */
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          this.users = this.users.filter(
            (u) =>
              u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term),
          );
        }

        this.applySort();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Anomalía técnica en la extracción de la lista de usuarios:', err);
        this.errorMessage = 'No se pudieron cargar los usuarios.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Alterna la columna de evaluación para la función de ordenación.
   * @param {keyof User} column - Clave del modelo sobre la cual pivotar.
   */
  toggleSort(column: keyof User): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.cdr.detectChanges();
  }

  /**
   * Procesa la ordenación in-memory de la colección actual de usuarios.
   * La mutación se realiza clonando la matriz original `[...this.users]` para
   * satisfacer las exigencias de inmutabilidad del renderizador `OnPush`.
   */
  private applySort(): void {
    if (!this.sortColumn) return;

    this.users = [...this.users].sort((a, b) => {
      let valA = a[this.sortColumn as keyof User];
      let valB = b[this.sortColumn as keyof User];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Inicializa la fase transaccional para la modificación del rol de autorización.
   */
  requestToggleRole(user: User): void {
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

  /**
   * Inicializa la fase transaccional para la suspensión lógica o restitución de la cuenta.
   */
  requestToggleStatus(user: User): void {
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

  /**
   * Ejecuta la petición HTTP de mutación correspondiente a la acción administrativa en curso.
   */
  executeAction(): void {
    if (!this.selectedUser || !this.pendingAction) return;

    this.modalState.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.pendingAction === 'role' && this.pendingRole) {
      this.userService.changeRole(this.selectedUser._id, this.pendingRole).subscribe({
        next: (response) => {
          this.selectedUser!.role = response.data.role;
          this.closeModal();
          this.applySort();
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
          this.applySort();
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

  closeModal(): void {
    this.modalState.isOpen = false;
    this.modalState.isLoading = false;
    this.selectedUser = null;
    this.pendingAction = null;
    this.pendingRole = null;
    this.pendingStatus = null;
  }
}
