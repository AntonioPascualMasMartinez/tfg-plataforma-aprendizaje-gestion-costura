import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  templateUrl: './quick-actions.component.html',
})
export class QuickActionsComponent {
  // Emite el evento hacia el padre (Inicio)
  @Output() createClicked = new EventEmitter<void>();

  onCreateClick() {
    this.createClicked.emit();
  }
}
