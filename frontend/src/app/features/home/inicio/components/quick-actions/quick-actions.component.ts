import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  templateUrl: './quick-actions.component.html',
})
export class QuickActionsComponent {
  @Output() createClicked = new EventEmitter<void>();

  @Output() shareClicked = new EventEmitter<void>();

  onCreateClick() {
    this.createClicked.emit();
  }

  onShareClick() {
    this.shareClicked.emit();
  }
}
