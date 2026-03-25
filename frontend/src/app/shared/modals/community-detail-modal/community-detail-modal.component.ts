import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommunityService } from '../../../core/services/community.service';
import { ToastService } from '../../../core/services/toast.service';
import { CommunityProject } from '../../components/community-card/community-card.component';
import {
  Comment,
  CreateReportPayload,
  ReportTargetType,
} from '../../../shared/models/community.model';
import { User } from '../../../shared/models/user.model';

import { ReportModalComponent } from '../report-modal/report-modal.component'; // Importar

@Component({
  selector: 'app-community-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportModalComponent],
  templateUrl: './community-detail-modal.component.html',
})
export class CommunityDetailModalComponent implements OnInit {
  @Input({ required: true }) project!: CommunityProject;
  @Output() close = new EventEmitter<void>();
  @Output() projectUpdated = new EventEmitter<CommunityProject>();

  private communityService = inject(CommunityService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  comments: Comment[] = [];
  newComment = '';

  // Variables para la paginación de comentarios
  commentPage = 1;
  hasMoreComments = false;
  isLoadingComments = true;
  isLoadingMoreComments = false;

  isSubmittingComment = false;
  isCloning = false;

  reportingData: { type: ReportTargetType; id: string; title?: string } | null = null;

  ngOnInit() {
    this.loadComments(true);
  }

  loadComments(reset = false) {
    if (reset) {
      this.commentPage = 1;
      this.isLoadingComments = true;
    } else {
      this.isLoadingMoreComments = true;
    }

    this.communityService.getProjectComments(this.project._id, this.commentPage).subscribe({
      next: (res) => {
        if (reset) {
          this.comments = res.data.docs;
        } else {
          this.comments = [...this.comments, ...res.data.docs];
        }

        // Verificamos si hay más páginas según tu paginated result
        this.hasMoreComments = res.data.hasNextPage;
        this.isLoadingComments = false;
        this.isLoadingMoreComments = false;
      },
      error: () => {
        this.isLoadingComments = false;
        this.isLoadingMoreComments = false;
        this.toastService.error('Error al cargar los comentarios');
      },
    });
  }

  loadMoreComments() {
    if (this.hasMoreComments && !this.isLoadingMoreComments) {
      this.commentPage++;
      this.loadComments(false);
    }
  }

  postComment() {
    if (!this.newComment.trim()) return;

    this.isSubmittingComment = true;
    this.communityService.addComment(this.project._id, { content: this.newComment }).subscribe({
      next: (res) => {
        // Añadimos el comentario nuevo al principio de la lista
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
    const wasLiked = this.project.isLikedLocally;
    this.project.isLikedLocally = !wasLiked;
    this.project.likesCount = (this.project.likesCount || 0) + (wasLiked ? -1 : 1);
    this.projectUpdated.emit(this.project);

    this.communityService.likeProject(this.project._id).subscribe({
      next: (res) => {
        this.project.likesCount = res.data.likesCount;
        this.projectUpdated.emit(this.project);
      },
      error: () => {
        this.project.isLikedLocally = wasLiked;
        this.project.likesCount = (this.project.likesCount || 0) + (wasLiked ? 1 : -1);
        this.projectUpdated.emit(this.project);
        this.toastService.error('Error al procesar el Me gusta');
      },
    });
  }

  reportProject() {
    this.reportingData = {
      type: 'Project',
      id: this.project._id,
      title: this.project.title,
    };
  }

  // NUEVO: Método para reportar un comentario individual
  reportComment(comment: Comment) {
    this.reportingData = {
      type: 'Comment',
      id: comment._id,
      title: `Comentario de ${this.getAuthorName(comment.authorId)}`,
    };
  }
  startProject() {
    this.isCloning = true;
    this.toastService.success('Proyecto añadido a tu colección.');
    this.closeModal();
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
    const name = this.getAuthorName(ownerId);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffedd5&color=ea580c&rounded=true&bold=true`;
  }

  onReportSubmitted(payload: CreateReportPayload) {
    this.communityService.createReport(payload).subscribe({
      next: () => {
        this.toastService.success('Reporte enviado correctamente.');
        this.reportingData = null; // Cerramos el modal de reporte
      },
      error: () => {
        this.toastService.error('Error al enviar el reporte.');
      },
    });
  }
}
