import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';

interface SewingDecoration {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  color: string;
  rotation: string;
  animation: string;
  delay: string;
  type: 'button' | 'pin' | 'needle';
}

@Component({
  selector: 'app-works',
  standalone: true,
  imports: [NgClass, ScrollAnimateDirective],
  templateUrl: './works.html',
  styleUrl: './works.scss',
})
export class Works {
  activeStep: number = 1;

  // Adornos flotantes para el fondo cálido
  backgroundDecorations: SewingDecoration[] = [
    {
      top: '10%',
      left: '5%',
      size: 'w-24 h-24',
      color: 'text-rose-300/20',
      rotation: '-rotate-12',
      animation: 'float-element-slow',
      delay: '0s',
      type: 'button',
    },
    {
      top: '40%',
      right: '3%',
      size: 'w-16 h-16',
      color: 'text-primary/15',
      rotation: 'rotate-45',
      animation: 'float-element',
      delay: '1s',
      type: 'needle',
    },
    {
      bottom: '15%',
      left: '8%',
      size: 'w-12 h-12',
      color: 'text-pink-400/20',
      rotation: '-rotate-45',
      animation: 'float-element-slow',
      delay: '2s',
      type: 'pin',
    },
    {
      bottom: '5%',
      right: '10%',
      size: 'w-28 h-28',
      color: 'text-rose-400/15',
      rotation: 'rotate-12',
      animation: 'float-element',
      delay: '0.5s',
      type: 'button',
    },
  ];
}
