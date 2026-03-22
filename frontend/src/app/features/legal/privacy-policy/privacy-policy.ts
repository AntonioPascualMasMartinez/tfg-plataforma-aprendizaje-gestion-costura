import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './privacy-policy.html',
})
export class PrivacyPolicy {}
