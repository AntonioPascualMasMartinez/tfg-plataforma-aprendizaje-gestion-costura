/**
 * @file works.ts
 * @description Componente presentacional interactivo que ilustra el flujo de trabajo de la plataforma ("Cómo Funciona").
 * Gestiona el estado de una interfaz por pasos (Stepper), apoyándose en directivas de animación
 * y arreglos estáticos para la disposición posicional de elementos decorativos en el DOM.
 */
import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';

/** Contrato estricto para los elementos vectoriales flotantes de ambientación. */
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
  /** Puntero al índice del paso actualmente expandido/activo en la interfaz. */
  activeStep: number = 1;

  /** Matriz de configuración posicional para las animaciones CSS flotantes. */
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
      type: 'pin',
    },
  ];
}
