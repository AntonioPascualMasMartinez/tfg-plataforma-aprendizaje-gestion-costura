import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

import { Hero } from './hero/hero';
import { Features } from './features/features';
import { Works } from './works/works';
import { Tutorials } from './tutorials/tutorials';
import { Community } from './community/community';

@Component({
  selector: 'app-landing',
  imports: [Navbar, Footer, Hero, Features, Works, Tutorials, Community],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  // ─── Scroll ───────────────────────────────────────────────
  scrollProgress: number = 0;
  private ticking = false;

  constructor(private el: ElementRef) {}

  // ═══ Lifecycle ═══════════════════════════════════════════

  ngOnInit() {}

  ngOnDestroy() {}

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
}
