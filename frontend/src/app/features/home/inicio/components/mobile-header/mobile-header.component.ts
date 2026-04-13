import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  templateUrl: './mobile-header.component.html',
})
export class MobileHeaderComponent {
  /** Emisor para iniciar un nuevo proyecto */
  @Output() openCreate = new EventEmitter<void>();

  /** Emisor para cerrar sesión */
  @Output() logoutRequest = new EventEmitter<void>();

  /** Emisor para compartir un proyecto */
  @Output() shareRequest = new EventEmitter<void>();

  onOpenCreate(): void {
    this.openCreate.emit();
  }

  onRequestLogout(): void {
    this.logoutRequest.emit();
  }

  onRequestShare(): void {
    this.shareRequest.emit();
  }
}
