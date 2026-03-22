import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive'; // Ajusta la ruta de importación si es necesario

interface SewingElement {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  color: string;
  rotation: string;
  animation: string;
  delay: string;
  type: 'scissor' | 'needle' | 'spool' | 'pin';
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, NgClass, ScrollAnimateDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero implements OnInit, OnDestroy {
  heroImages: string[] = ['/hero/hero-1.webp', '/hero/hero-2.webp', '/hero/hero-3.webp'];
  currentImageIndex: number = 0;
  private imageInterval: ReturnType<typeof setInterval> | null = null;

  floatingElements: SewingElement[] = [
  { top: '5%', left: '8%', size: 'w-24 h-24', color: 'text-rose-300/30', rotation: '-rotate-12', animation: 'float-element-slow', delay: '0s', type: 'scissor' },
  { top: '15%', right: '45%', size: 'w-16 h-16', color: 'text-pink-400/20', rotation: 'rotate-45', animation: 'float-element', delay: '1.5s', type: 'needle' },
  { top: '25%', right: '8%', size: 'w-20 h-20', color: 'text-primary/20', rotation: 'rotate-12', animation: 'float-element-slow', delay: '0.5s', type: 'spool' },
  { bottom: '35%', left: '45%', size: 'w-12 h-12', color: 'text-rose-400/25', rotation: '-rotate-45', animation: 'float-element', delay: '2s', type: 'pin' },
  { bottom: '15%', left: '12%', size: 'w-28 h-28', color: 'text-pink-300/20', rotation: 'rotate-180', animation: 'float-element-slow', delay: '1s', type: 'scissor' },
  { bottom: '20%', right: '15%', size: 'w-16 h-16', color: 'text-rose-300/30', rotation: 'rotate-90', animation: 'float-element', delay: '3s', type: 'spool' }
];

  ngOnInit() {
    this.startImageTransition();
  }

  ngOnDestroy() {
    this.stopImageTransition();
  }

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
}
