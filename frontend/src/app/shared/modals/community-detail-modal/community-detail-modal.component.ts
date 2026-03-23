import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunityService } from '../../../core/services/community.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommunityProject } from '../../components/community-card/community-card.component';
import { Comment, CreateReportPayload } from '../../../shared/models/community.model';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-community-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './community-detail-modal.component.html',
})
export class CommunityDetailModalComponent implements OnInit {
  @Input({ required: true }) project!: CommunityProject;
  @Output() close = new EventEmitter<void>();

  // Si el like cambia dentro del modal, avisamos al padre para que actualice la tarjeta
  @Output() projectUpdated = new EventEmitter<CommunityProject>();

  private communityService = inject(CommunityService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  comments: Comment[] = [];
  newComment = '';
  isLoadingComments = true;
  isSubmittingComment = false;
  isCloning = false;

  ngOnInit() {
    this.loadComments();
  }

  loadComments() {
    this.isLoadingComments = true;
    this.communityService.getProjectComments(this.project._id).subscribe({
      next: (res) => {
        this.comments = res.data.docs;
        this.isLoadingComments = false;
      },
      error: () => {
        this.isLoadingComments = false;
      },
    });
  }

  postComment() {
    if (!this.newComment.trim()) return;

    this.isSubmittingComment = true;
    this.communityService.addComment(this.project._id, { content: this.newComment }).subscribe({
      next: (res) => {
        this.comments.unshift(res.data);
        this.newComment = '';
        this.isSubmittingComment = false;
        this.toastService.success('Comentario publicado');
      },
      error: () => {
        this.isSubmittingComment = false;
        this.toastService.error('Error al publicar el comentario');
      },
    });
  }

  toggleLike() {
    // Lógica Toggle optimista
    const wasLiked = this.project.isLikedLocally;
    this.project.isLikedLocally = !wasLiked;
    this.project.likesCount = (this.project.likesCount || 0) + (wasLiked ? -1 : 1);

    // Emitimos el cambio inmediatamente para que la tarjeta del fondo se actualice
    this.projectUpdated.emit(this.project);

    this.communityService.likeProject(this.project._id).subscribe({
      next: (res) => {
        // Actualizamos con el dato real del servidor
        this.project.likesCount = res.data.likesCount;
        this.projectUpdated.emit(this.project);
      },
      error: () => {
        // Revertir si hay error
        this.project.isLikedLocally = wasLiked;
        this.project.likesCount = (this.project.likesCount || 0) + (wasLiked ? 1 : -1);
        this.projectUpdated.emit(this.project);
        this.toastService.error('Error al procesar el Me gusta');
      },
    });
  }

  reportProject() {
    const reason = prompt('Por favor, indica el motivo del reporte:');
    if (!reason) return;

    const payload: CreateReportPayload = {
      targetType: 'Project',
      targetId: this.project._id,
      reason: reason,
    };

    this.communityService.createReport(payload).subscribe({
      next: () =>
        this.toastService.success('Proyecto reportado correctamente. Nuestro equipo lo revisará.'),
      error: () => this.toastService.error('Hubo un error al enviar el reporte.'),
    });
  }

  startProject() {
    this.isCloning = true;
    // AQUÍ DEBERÍAS LLAMAR A TU PROJECT SERVICE PARA CLONAR EL PROYECTO
    // this.projectService.cloneProject(this.project._id).subscribe(...)
    this.toastService.success('Proyecto añadido a tu colección.');
    this.closeModal();
    // Redirigirías al proyecto clonado
    // this.router.navigate(['/home/proyectos', newId]);
  }

  closeModal() {
    this.close.emit();
  }

  getAuthorName(ownerId: string | Partial<User> | undefined): string {
    if (ownerId && typeof ownerId === 'object' && 'displayName' in ownerId) {
      return ownerId.displayName || 'Anónimo';
    }
    return 'Anónimo';
  }

  getAuthorAvatar(ownerId: string | Partial<User> | undefined): string {
    if (ownerId && typeof ownerId === 'object' && 'avatar' in ownerId && ownerId.avatar) {
      return ownerId.avatar;
    }
    return '/assets/default-avatar.png';
  }
}
