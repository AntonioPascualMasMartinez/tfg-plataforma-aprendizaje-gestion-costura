import { Component, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';
import { TutorialCardComponent } from '../../../shared/components/tutorial-card/tutorial-card';

interface FloatingButton {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string; // ej: 'w-64 h-64'
  color: string; // ej: 'text-primary/15' o 'text-rose-400/20'
  delay: string;
  rotation: string;
  animation: string;
  threadType: 'cross' | 'horizontal' | 'vertical' | 'empty';
}

@Component({
  selector: 'app-tutorials',
  standalone: true,
  imports: [NgClass, ScrollAnimateDirective, TutorialCardComponent],
  templateUrl: './tutorials.html',
  styleUrl: './tutorials.scss',
})
export class Tutorials {
  tutorials: any[] = [
    {
      _id: 'mock-1',
      title: 'Cremallera Invisible',
      description:
        'Domina la técnica para coser cremalleras invisibles perfectas aplicándolo a un pequeño neceser.',
      category: 'Técnicas Base',
      difficultyLevel: 'Principiante',
      estimatedTime: 45,
      steps: [
        { order: 1, title: 'Preparación', description: '', mediaUrl: '/hero/tutorial-1.webp' },
      ],
    },
    {
      _id: 'mock-2',
      title: 'Costura Francesa',
      description:
        'Aprende a realizar acabados limpios y profesionales sin remalladora, ideal para prendas delicadas.',
      category: 'Acabados',
      difficultyLevel: 'Intermedio',
      estimatedTime: 60,
      steps: [
        { order: 1, title: 'Primera puntada', description: '', mediaUrl: '/hero/tutorial-2.webp' },
        { order: 2, title: 'Planchado y cierre', description: '', mediaUrl: null },
      ],
    },
    {
      _id: 'mock-3',
      title: 'Acolchado Básico',
      description:
        'Descubre cómo unir capas de tela y guata creando patrones geométricos en un salvamanteles.',
      category: 'Acolchado',
      difficultyLevel: 'Intermedio',
      estimatedTime: 90,
      steps: [
        { order: 1, title: 'Marcado', description: '', mediaUrl: '/hero/tutorial-3.webp' },
        { order: 2, title: 'Hilvanado', description: '', mediaUrl: null },
        { order: 3, title: 'Acolchado a máquina', description: '', mediaUrl: null },
      ],
    },
  ];

  floatingButtons: FloatingButton[] = [
    {
      top: '-5%',
      left: '-5%',
      size: 'w-64 h-64',
      color: 'text-primary/15',
      rotation: '-rotate-12',
      animation: 'float-element-slow',
      delay: '0s',
      threadType: 'cross',
    },
    {
      top: '10%',
      right: '5%',
      size: 'w-44 h-44',
      color: 'text-rose-400/20',
      rotation: 'rotate-45',
      animation: 'float-element',
      delay: '1s',
      threadType: 'horizontal',
    },
    {
      top: '45%',
      left: '-2%',
      size: 'w-32 h-32',
      color: 'text-pink-500/15',
      rotation: 'rotate-12',
      animation: 'float-element-slow',
      delay: '2s',
      threadType: 'vertical',
    },
    {
      top: '35%',
      left: '40%',
      size: 'w-24 h-24',
      color: 'text-info/20',
      rotation: '-rotate-45',
      animation: 'float-element',
      delay: '0.5s',
      threadType: 'empty',
    },
    {
      bottom: '-10%',
      right: '-5%',
      size: 'w-56 h-56',
      color: 'text-primary/10',
      rotation: 'rotate-90',
      animation: 'float-element-slow',
      delay: '3s',
      threadType: 'cross',
    },
    {
      bottom: '5%',
      left: '10%',
      size: 'w-48 h-48',
      color: 'text-rose-300/15',
      rotation: 'rotate-180',
      animation: 'float-element',
      delay: '4s',
      threadType: 'cross',
    },
    {
      bottom: '10%',
      left: '50%',
      size: 'w-20 h-20',
      color: 'text-pink-400/25',
      rotation: '-rotate-12',
      animation: 'float-element-slow',
      delay: '0s',
      threadType: 'horizontal',
    },
  ];

  activeTutorialIndex: number = 1;

  // ─── Touch/Swipe variables ───
  private touchStartX = 0;
  private touchStartY = 0;
  private readonly SWIPE_THRESHOLD = 50;

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

  // Navegación con teclado (Flechas)
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Para no interferir si el usuario está escribiendo en un input en el futuro
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;

    if (event.key === 'ArrowLeft') {
      this.prevTutorial();
    } else if (event.key === 'ArrowRight') {
      this.nextTutorial();
    }
  }

  // Gestos táctiles en dispositivos móviles
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const deltaY = event.changedTouches[0].clientY - this.touchStartY;

    // Detectar un swipe horizontal (X > Y y superior al umbral)
    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.nextTutorial(); // Deslizar izquierda = siguiente
      } else {
        this.prevTutorial(); // Deslizar derecha = anterior
      }
    }
  }
}
