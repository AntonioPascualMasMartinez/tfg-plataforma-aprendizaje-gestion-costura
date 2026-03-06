import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common'; // Importante para las clases dinámicas

import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

import { Tutorial } from '../../shared/models/tutorial.model';

import { TutorialCardComponent } from '../../shared/components/tutorial-card/tutorial-card';
import { CommunityCard } from '../../shared/components/community-card/community-card';

@Component({
  selector: 'app-landing',
  imports: [
    RouterLink,
    Navbar,
    Footer,
    NgClass,
    ScrollAnimateDirective,
    TutorialCardComponent,
    CommunityCard,
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  // Array con las rutas de tus imágenes (asegúrate de tenerlas en tu carpeta public/assets)
  heroImages: string[] = [
    '/hero/hero-1.jpg', // Reemplaza con tus imágenes reales
    '/hero/hero-2.jpg',
    '/hero/hero-3.jpg',
  ];

  tutorials: any[] = [
    // Tipado como 'any' o 'Partial<Tutorial>' para los datos mock de la landing
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

  communityPosts = [
    {
      imageUrl: '/hero/hero-1.jpg',
      authorInitials: 'MG',
      authorName: 'Mark G.',
      likes: 24,
    },
    {
      imageUrl: '/hero/hero-2.jpg',
      authorInitials: 'LC',
      authorName: 'Laura C.',
      likes: 156,
    },
    {
      imageUrl: '/hero/hero-3.jpg',
      authorInitials: 'AP',
      authorName: 'Ana P.',
      likes: 89,
    },
  ];

  currentImageIndex: number = 0;
  private imageInterval: any;

  ngOnInit() {
    this.startImageTransition();
  }

  ngOnDestroy() {
    // Limpiamos el intervalo si cambiamos de página para evitar fugas de memoria
    if (this.imageInterval) {
      clearInterval(this.imageInterval);
    }
  }

  startImageTransition() {
    // Cambia la imagen cada 5 segundos
    this.imageInterval = setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.heroImages.length;
    }, 5000);
  }

  // Permite al usuario cambiar la imagen manualmente al hacer clic en los puntos
  setCurrentImage(index: number) {
    this.currentImageIndex = index;
    // Reiniciamos el temporizador para que no cambie justo después de hacer clic
    clearInterval(this.imageInterval);
    this.startImageTransition();
  }

  // --- LÓGICA DEL CARRUSEL DE TUTORIALES ---
  activeTutorialIndex: number = 1; // Empezamos con el del medio enfocado

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

  scrollProgress: number = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Calculamos la posición actual
    const scrollPosition = window.scrollY || document.documentElement.scrollTop || 0;
    // Calculamos la altura total scrolleable
    const windowHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;

    // Evitamos división por cero y sacamos el porcentaje (0 a 100)
    if (windowHeight > 0) {
      this.scrollProgress = (scrollPosition / windowHeight) * 100;
    }
  }
}
