/**
 * @file dashboard.component.ts
 * @description Componente analítico principal del panel de administración (Dashboard).
 * Implementa la estrategia de detección de cambios `OnPush` para maximizar la eficiencia
 * del renderizado. Transforma los datos agregados del servidor (Pipeline de MongoDB)
 * en estructuras compatibles con `ng2-charts` (Chart.js) para la visualización de KPIs.
 */
import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { DashboardStats } from '../../../shared/models/user.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './dashboard.component.html',
  /* Optimización de rendimiento: La vista solo se reevalúa cuando cambian las referencias de los Inputs 
     o cuando se invoca explícitamente a ChangeDetectorRef. */
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  errorMessage = '';

  /* Métricas de nivel superior (KPIs) */
  totalUsers: number = 0;
  pendingReports: number = 0;
  totalTutorials: number = 0;

  /* ==========================================================================
     CONFIGURACIÓN DE MODELOS DE DATOS PARA CHART.JS
     ========================================================================== */

  /**
   * Configuración de la serie temporal para evaluar la adquisición de usuarios.
   * Gráfico de líneas con suavizado de tensión (`tension: 0.4`).
   */
  public growthChartType: ChartType = 'line';
  public growthChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Nuevos Usuarios',
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        borderColor: '#ea580c',
        pointBackgroundColor: '#ea580c',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ea580c',
        fill: 'origin',
        tension: 0.4,
      },
    ],
  };
  public growthChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  /**
   * Configuración de la distribución demográfica (Nivel de Costura).
   * Gráfico de tipo Anillo (Doughnut).
   */
  public demoChartType: ChartType = 'doughnut';
  public demoChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#ea580c', '#f97316', '#fdba74', '#cbd5e1'],
        hoverBackgroundColor: ['#c2410c', '#ea580c', '#f97316', '#94a3b8'],
        borderWidth: 0,
      },
    ],
  };
  public demoChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  /**
   * Configuración de las métricas de interacción en proyectos.
   * Gráfico de barras categorizado.
   */
  public engageChartType: ChartType = 'bar';
  public engageChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Proyectos',
        backgroundColor: ['#10b981', '#3b82f6'],
        borderRadius: 8,
      },
    ],
  };
  public engageChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Invoca al servicio REST para la extracción de telemetría y ejecuta la
   * transformación de datos relacionales en arreglos unidimensionales compatibles con Chart.js.
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.userService.getDashboardStats().subscribe({
      next: (res) => {
        const stats: DashboardStats = res.data;

        /* Inyección de contadores globales */
        this.totalUsers = stats.counts.totalUsers;
        this.totalTutorials = stats.counts.totalTutorials;
        this.pendingReports = stats.counts.pendingReports;

        /* Transformación del pipeline de fechas para el eje de abscisas (X) */
        const monthNames = [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ];
        this.growthChartData.labels = stats.charts.userGrowth.map(
          (item) => `${monthNames[item._id.month - 1]} ${item._id.year}`,
        );
        this.growthChartData.datasets[0].data = stats.charts.userGrowth.map((item) => item.count);

        /* Mapeo de la distribución categórica demográfica */
        this.demoChartData.labels = stats.charts.demographics.map((item) => item._id);
        this.demoChartData.datasets[0].data = stats.charts.demographics.map((item) => item.count);

        /* Mapeo de la distribución de estados de interacción */
        this.engageChartData.labels = stats.charts.engagement.map((item) => item._id);
        this.engageChartData.datasets[0].data = stats.charts.engagement.map((item) => item.count);

        this.isLoading = false;

        /* Ejecución explícita del ciclo de detección de cambios requerido por la estrategia OnPush */
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Fallo durante la recuperación de la telemetría del panel:', err);
        this.errorMessage = 'Hubo un problema al cargar las estadísticas integrales del sistema.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
