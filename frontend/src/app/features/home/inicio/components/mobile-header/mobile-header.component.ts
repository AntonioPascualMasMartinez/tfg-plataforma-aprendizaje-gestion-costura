import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  templateUrl: './mobile-header.component.html',
})
export class MobileHeaderComponent {
  @Output() openCreate = new EventEmitter<void>();

  onOpenCreate() {
    this.openCreate.emit();
  }
}
