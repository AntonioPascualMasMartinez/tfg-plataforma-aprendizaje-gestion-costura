import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { TutorialCardComponent } from '../../shared/components/tutorial-card/tutorial-card';
import {
  CommunityCardComponent,
  CommunityProject,
} from '../../shared/components/community-card/community-card.component';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    Navbar,
    Footer,
    NgClass,
    ScrollAnimateDirective,
    TutorialCardComponent,
    CommunityCardComponent,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  // ─── Hero Carousel ────────────────────────────────────────
  heroImages: string[] = ['/hero/hero-1.jpg', '/hero/hero-2.jpg', '/hero/hero-3.jpg'];
  currentImageIndex: number = 0;
  private imageInterval: ReturnType<typeof setInterval> | null = null;

  // ─── Tutorials ────────────────────────────────────────────
  tutorials: any[] = [
    {
      _id: 'mock-1',
      title: 'Zipper Pouch',
      description: 'El proyecto perfecto para iniciarte en la costura de accesorios.',
      category: 'Monederos',
      difficultyLevel: 'Principiante',
      estimatedTime: 45,
      steps: [{ order: 1, title: 'Inicio', description: '', mediaUrl: '/hero/hero-1.jpg' }],
    },
    {
      _id: 'mock-2',
      title: 'Tote Bag Reversible',
      description: 'Aprende a combinar telas y crear asas resistentes desde cero.',
      category: 'Bolsos',
      difficultyLevel: 'Principiante',
      estimatedTime: 120,
      steps: [
        { order: 1, title: 'Inicio', description: '', mediaUrl: '/hero/hero-2.jpg' },
        { order: 2, title: 'Paso 2', description: '', mediaUrl: null },
      ],
    },
    {
      _id: 'mock-3',
      title: 'Falda Midi',
      description: 'Conceptos básicos de patronaje y colocación de cremalleras invisibles.',
      category: 'Ropa',
      difficultyLevel: 'Intermedio',
      estimatedTime: 180,
      steps: [
        { order: 1, title: 'Inicio', description: '', mediaUrl: '/hero/hero-3.jpg' },
        { order: 2, title: 'Medidas', description: '', mediaUrl: null },
        { order: 3, title: 'Corte', description: '', mediaUrl: null },
      ],
    },
  ];

  activeTutorialIndex: number = 1;

  // ─── Community ────────────────────────────────────────────
  communityPosts: CommunityProject[] = [
    {
      _id: 'landing-post-1',
      title: 'Chaqueta Denim Vintage',
      inspirationImageUrl: '/hero/hero-1.jpg',
      category: 'Ropa',
      difficulty: 'Intermedio',
      status: 'Finalizado',
      likesCount: 24,
      isLikedLocally: false,
      ownerId: { displayName: 'Mark G.', avatar: '' } as any,
    } as CommunityProject,
    {
      _id: 'landing-post-2',
      title: 'Bolso de Lino Natural',
      inspirationImageUrl: '/hero/hero-2.jpg',
      category: 'Accesorios',
      difficulty: 'Fácil',
      status: 'Finalizado',
      likesCount: 156,
      isLikedLocally: false,
      ownerId: { displayName: 'Laura C.', avatar: '' } as any,
    } as CommunityProject,
    {
      _id: 'landing-post-3',
      title: 'Vestido Floral de Verano',
      inspirationImageUrl: '/hero/hero-3.jpg',
      category: 'Ropa',
      difficulty: 'Avanzado',
      status: 'Finalizado',
      likesCount: 89,
      isLikedLocally: false,
      ownerId: { displayName: 'Ana P.', avatar: '' } as any,
    } as CommunityProject,
  ];

  // ─── Scroll ───────────────────────────────────────────────
  scrollProgress: number = 0;
  private ticking = false;

  // ─── Touch/Swipe ──────────────────────────────────────────
  private touchStartX = 0;
  private touchStartY = 0;
  private readonly SWIPE_THRESHOLD = 50;

  constructor(private el: ElementRef) {}

  // ═══ Lifecycle ═══════════════════════════════════════════

  ngOnInit() {
    this.startImageTransition();
  }

  ngOnDestroy() {
    this.stopImageTransition();
  }

  // ═══ Hero Carousel ═══════════════════════════════════════

  startImageTransition() {
    this.stopImageTransition();
    this.imageInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.heroImages.length;
    }, 5000);
  }

  private stopImageTransition() {
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
      this.imageInterval = null;
    }
  }

  setCurrentImage(index: number) {
    this.currentImageIndex = index;
    this.startImageTransition();
  }

  // ═══ Tutorial Carousel ═══════════════════════════════════

  setActiveTutorial(index: number) {
    this.activeTutorialIndex = index;
  }

  nextTutorial() {
    this.activeTutorialIndex = (this.activeTutorialIndex + 1) % this.tutorials.length;
  }

  prevTutorial() {
    this.activeTutorialIndex =
      (this.activeTutorialIndex - 1 + this.tutorials.length) % this.tutorials.length;
  }

  // ═══ Scroll Progress (rAF-throttled) ═════════════════════

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
        const windowHeight =
          document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (windowHeight > 0) {
          this.scrollProgress = (scrollPosition / windowHeight) * 100;
        }
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  // ═══ Keyboard navigation ═════════════════════════════════

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.prevTutorial();
    } else if (event.key === 'ArrowRight') {
      this.nextTutorial();
    }
  }

  // ═══ Touch / Swipe ═══════════════════════════════════════

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const deltaY = event.changedTouches[0].clientY - this.touchStartY;

    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.nextTutorial();
      } else {
        this.prevTutorial();
      }
    }
  }

  // ═══ Community Like ══════════════════════════════════════

  handleMockLike(payload: { project: CommunityProject; event: Event }) {
    payload.event.preventDefault();
    payload.event.stopPropagation();

    const project = payload.project;
    project.isLikedLocally = !project.isLikedLocally;
    project.likesCount = (project.likesCount || 0) + (project.isLikedLocally ? 1 : -1);
  }
}
