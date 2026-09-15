import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { GetReportUseCase } from '@features/reports/application/usecase/get-report.usecase';
import { ReportType, ReportParams } from '@features/reports/domain/entities/report-params.model';
import { NotificationPort } from '@shell/application/ports/notification.port';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent {
  private readonly getReportUseCase = inject(GetReportUseCase);
  private readonly notificationPort = inject(NotificationPort);

  readonly loading = signal(false);
  readonly selectedType = signal<ReportType>('day');
  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly selectedQuincena = signal<1 | 2>(1);

  readonly years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1];
  });

  readonly months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  readonly quincenas = [
    { value: 1 as 1 | 2, label: 'Primera Quincena' },
    { value: 2 as 1 | 2, label: 'Segunda Quincena' },
  ];

  generateReport(): void {
    const tipo = this.selectedType();
    const params: ReportParams = { tipo };

    if (tipo === 'month' || tipo === 'quincena') {
      params.year = this.selectedYear();
      params.month = this.selectedMonth();
    }

    if (tipo === 'quincena') {
      params.quincena = this.selectedQuincena();
    }

    if (tipo === 'year') {
      params.year = this.selectedYear();
    }

    this.loading.set(true);
    this.getReportUseCase.execute(params).subscribe({
      next: (blob) => {
        this.loading.set(false);
        this.openPdf(blob);
      },
      error: (error: Error) => {
        this.loading.set(false);
        this.notificationPort.add({
          id: Date.now(),
          title: 'Error al generar reporte',
          description: error.message,
          type: 'error',
        });
      },
    });
  }

  private openPdf(blob: Blob): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
