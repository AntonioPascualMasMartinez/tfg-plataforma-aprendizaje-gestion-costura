import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { CommunityService } from '../../../core/services/community.service';
import { TutorialService } from '../../../core/services/tutorial.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private communityService = inject(CommunityService);
  private tutorialService = inject(TutorialService);

  totalUsers: number = 0;
  pendingReports: number = 0;
  totalTutorials: number = 0; // Se actualizará con el TutorialService

  ngOnInit() {
    // Obtenemos el total de usuarios (limit 1 para ahorrar payload)
    this.userService.getAllUsers(1, 1).subscribe({
      next: (res) => this.totalUsers = res.data.totalDocs
    });

    // Obtenemos los reportes pendientes de moderación
    this.communityService.getModerationQueue(1, 1).subscribe({
      next: (res) => this.pendingReports = res.data.totalDocs
    });

    // Descomentar cuando el TutorialService esté inyectado

    this.tutorialService.getCatalog(1, 1).subscribe({
      next: (res) => this.totalTutorials = res.data.totalDocs
    });
 
  }
}