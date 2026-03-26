import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- 1. Importar ChangeDetectorRef
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
  private cdr = inject(ChangeDetectorRef); // <-- 2. Inyectar el detector

  totalUsers: number = 0;
  pendingReports: number = 0;
  totalTutorials: number = 0;

  ngOnInit() {
    // Obtenemos el total de usuarios
    this.userService.getAllUsers(1, 1).subscribe({
      next: (res) => {
        this.totalUsers = res.data.totalDocs;
        this.cdr.detectChanges(); // <-- Actualiza la tarjeta de usuarios
      },
    });

    // Obtenemos los reportes pendientes de moderación
    this.communityService.getModerationQueue(1, 1).subscribe({
      next: (res) => {
        this.pendingReports = res.data.totalDocs;
        this.cdr.detectChanges(); // <-- Actualiza la tarjeta de moderación
      },
    });

    // Obtenemos los tutoriales activos
    this.tutorialService.getCatalog(1, 1).subscribe({
      next: (res) => {
        this.totalTutorials = res.data.totalDocs;
        this.cdr.detectChanges(); // <-- Actualiza la tarjeta de tutoriales
      },
    });
  }
}
