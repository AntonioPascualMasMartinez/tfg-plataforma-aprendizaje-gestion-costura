/**
 * @file features.ts
 * @description Componente presentacional encargado de exponer las propuestas de valor (Value Propositions)
 * de la plataforma. Emplea un enfoque basado en datos (Data-driven UI) para renderizar de forma 
 * iterativa las tarjetas de características utilizando un contrato estricto de tipado y directivas de animación.
 */
import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';

/**
 * Modelo de datos para las tarjetas informativas. Incorpora la lógica de presentación
 * encapsulando los tokens semánticos y reglas de Tailwind CSS específicos para cada instancia.
 */
interface FeatureCard {
  title: string;
  description: string;
  image: string;
  alt: string;
  icon: 'planning' | 'community' | 'learning';
  containerClass: string;
  textContainerClass: string;
  imageContainerClass: string;
  gradientClass: string;
  iconBtnClass: string;
  iconColorClass: string;
  titleHoverClass: string;
  strokeWidth: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './features.html',
  styleUrl: './features.scss',
})
export class Features {
  /** Catálogo de funcionalidades expuestas en la vista pública. */
  features: FeatureCard[] = [
    {
      title: 'Planificación Integral',
      description:
        'Gestiona inventarios de telas, asigna patrones digitales y sigue el progreso de cada puntada en un solo lugar.',
      image: '/hero/hero-1.webp',
      alt: 'Máquina de coser sobre una mesa',
      icon: 'planning',
      containerClass:
        'md:row-span-2 flex-col hover:shadow-[0_32px_64px_-16px_rgba(255,89,0,0.3)] hover:-translate-y-1',
      textContainerClass: 'p-8 md:p-10 z-10',
      imageContainerClass:
        'relative flex-1 min-h-80 mx-4 mb-4 rounded-4xl overflow-hidden border border-border-main/10 shadow-[0_0_20px_rgba(0,0,0,0.05)_inset]',
      gradientClass: 'bg-linear-to-b from-primary/0 via-transparent to-primary/5',
      iconBtnClass:
        'group-hover:-rotate-3 group-hover:bg-primary group-hover:shadow-[0_6px_20px_rgba(255,89,0,0.4)]',
      iconColorClass: 'h-7 w-7 text-primary group-hover:text-white',
      titleHoverClass: 'group-hover:text-primary',
      strokeWidth: '1.8',
    },
    {
      title: 'Comunidad Vibrante',
      description:
        'Comparte tus proyectos terminados, recibe feedback constructivo y encuentra inspiración diaria.',
      image: '/hero/hero-4.webp',
      alt: 'Detalle de costura',
      icon: 'community',
      containerClass:
        'flex-col md:flex-row hover:shadow-[0_32px_64px_-16px_rgba(255,140,66,0.2)] hover:drop-shadow-[0_12px_12px_rgba(255,140,66,0.15)]',
      textContainerClass: 'p-8 md:p-10 flex-1 flex flex-col justify-center z-10',
      imageContainerClass:
        'relative md:w-64 w-full h-56 md:h-auto m-4 md:ml-0 rounded-4xl overflow-hidden border border-border-main/10 shadow-[0_0_20px_rgba(0,0,0,0.05)_inset]',
      gradientClass: 'bg-linear-to-r from-transparent to-[#FF8C42]/5',
      iconBtnClass:
        'group-hover:rotate-3 group-hover:bg-[#FF8C42] group-hover:shadow-[0_6px_20px_rgba(255,140,66,0.4)]',
      iconColorClass: 'h-6 w-6 text-[#FF8C42] group-hover:text-white',
      titleHoverClass: 'group-hover:text-[#FF8C42]',
      strokeWidth: '2',
    },
    {
      title: 'Aprendizaje Guiado',
      description:
        'Accede a tutoriales paso a paso adaptados a tu nivel, desde el primer dobladillo hasta la sastrería.',
      image: '/hero/hero-3.webp',
      alt: 'Sastre trabajando',
      icon: 'learning',
      containerClass:
        'flex-col md:flex-row hover:shadow-[0_32px_64px_-16px_rgba(14,165,233,0.2)] hover:drop-shadow-[0_12px_12px_rgba(14,165,233,0.15)]',
      textContainerClass: 'p-8 md:p-10 flex-1 flex flex-col justify-center order-1 md:order-2 z-10',
      imageContainerClass:
        'relative md:w-64 w-full h-56 md:h-auto m-4 md:mr-0 rounded-4xl overflow-hidden border border-border-main/10 shadow-[0_0_20px_rgba(0,0,0,0.05)_inset] order-2 md:order-1',
      gradientClass: 'bg-linear-to-l from-transparent to-info/5',
      iconBtnClass:
        'group-hover:-rotate-3 group-hover:bg-info group-hover:shadow-[0_6px_20px_rgba(14,165,233,0.4)]',
      iconColorClass: 'h-6 w-6 text-info group-hover:text-white',
      titleHoverClass: 'group-hover:text-info',
      strokeWidth: '2',
    },
  ];
}