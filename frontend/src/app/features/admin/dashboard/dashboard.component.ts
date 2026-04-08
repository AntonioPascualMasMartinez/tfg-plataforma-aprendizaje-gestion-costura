import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { UserService} from '../../../core/services/user.service';
import { DashboardStats } from '../../../shared/models/user.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [BaseChartDirective], // <-- Importamos la directiva de gráficas
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush // Rendimiento optimizado
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  errorMessage = '';

  // Contadores de las tarjetas
  totalUsers: number = 0;
  pendingReports: number = 0;
  totalTutorials: number = 0;

  // ==========================================
  // CONFIGURACIÓN DE GRÁFICAS (Chart.js)
  // ==========================================

  // 1. Gráfica de Crecimiento (Líneas)
  public growthChartType: ChartType = 'line';
  public growthChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Nuevos Usuarios',
        backgroundColor: 'rgba(234, 88, 12, 0.2)', // Tu color primario (ej. Naranja) con opacidad
        borderColor: '#ea580c',
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ea580c',
        fill: 'origin',
        tension: 0.4 // Hace que la línea sea curva (suave)
      }
    ]
  };
  public growthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } // precision:0 evita decimales en usuarios
  };

  // 2. Gráfica de Demografía (Donut)
  public demoChartType: ChartType = 'doughnut';
  public demoChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#ea580c', '#f97316', '#fdba74', '#cbd5e1'],
        hoverBackgroundColor: ['#c2410c', '#ea580c', '#f97316', '#94a3b8'],
        borderWidth: 0
      }
    ]
  };
  public demoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // 3. Gráfica de Engagement (Barras)
  public engageChartType: ChartType = 'bar';
  public engageChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Proyectos',
        backgroundColor: ['#10b981', '#3b82f6'], // Verde para completado, Azul para en curso
        borderRadius: 8
      }
    ]
  };
  public engageChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.userService.getDashboardStats().subscribe({
      next: (res) => {
        const stats: DashboardStats = res.data;

        // 1. Asignar contadores
        this.totalUsers = stats.counts.totalUsers;
        this.totalTutorials = stats.counts.totalTutorials;
        this.pendingReports = stats.counts.pendingReports;

        // 2. Procesar Gráfica de Crecimiento
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        this.growthChartData.labels = stats.charts.userGrowth.map(
          item => `${monthNames[item._id.month - 1]} ${item._id.year}`
        );
        this.growthChartData.datasets[0].data = stats.charts.userGrowth.map(item => item.count);

        // 3. Procesar Gráfica de Demografía
        this.demoChartData.labels = stats.charts.demographics.map(item => item._id);
        this.demoChartData.datasets[0].data = stats.charts.demographics.map(item => item.count);

        // 4. Procesar Gráfica de Engagement
        this.engageChartData.labels = stats.charts.engagement.map(item => item._id);
        this.engageChartData.datasets[0].data = stats.charts.engagement.map(item => item.count);

        this.isLoading = false;
        this.cdr.detectChanges(); // <-- Actualizamos toda la vista a la vez
      },
      error: (err) => {
        console.error('Error al cargar el dashboard', err);
        this.errorMessage = 'Hubo un problema al cargar las estadísticas.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}