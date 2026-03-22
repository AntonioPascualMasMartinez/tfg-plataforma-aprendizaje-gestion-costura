import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../../../shared/models/project.model';

@Component({
  selector: 'app-recent-project',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recent-project.component.html'
})
export class RecentProjectComponent {
  // Recibe los datos del padre
  @Input() project: Project | null = null;
  
  // Emite eventos hacia el padre
  @Output() createClicked = new EventEmitter<void>();

  onCreateClick() {
    this.createClicked.emit();
  }
}