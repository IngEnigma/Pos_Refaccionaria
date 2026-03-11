import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

type ReportsFilter = 'day' | 'biweekly' | 'month';

interface ReportItem {
  fecha: string;
  fechaFin?: string;
  transactions: number;
  totalSales: number;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPageComponent {
  displayedReports: ReportItem[] = [];
  currentFilter: ReportsFilter = 'day';

  private readonly mockData: Record<ReportsFilter, ReportItem[]> = {
    day: [
      { fecha: '2025-01-21', transactions: 24, totalSales: 15450.5 },
      { fecha: '2025-01-20', transactions: 18, totalSales: 12300 },
      { fecha: '2025-01-19', transactions: 15, totalSales: 9850 },
      { fecha: '2025-01-18', transactions: 32, totalSales: 18900.2 },
    ],
    biweekly: [
      { fecha: '2025-01-15', fechaFin: '2025-01-31', transactions: 340, totalSales: 210500 },
      { fecha: '2024-12-30', fechaFin: '2025-01-14', transactions: 410, totalSales: 289000.5 },
      { fecha: '2024-12-15', fechaFin: '2024-12-29', transactions: 380, totalSales: 245000 },
    ],
    month: [
      { fecha: '2025-01-01', fechaFin: '2025-01-31', transactions: 680, totalSales: 450000 },
      { fecha: '2024-12-01', fechaFin: '2024-12-31', transactions: 890, totalSales: 560000 },
      { fecha: '2024-11-01', fechaFin: '2024-11-30', transactions: 750, totalSales: 480000 },
    ],
  };

  constructor() {
    this.setFilter('day');
  }

  setFilter(filter: ReportsFilter): void {
    this.currentFilter = filter;
    this.displayedReports = this.mockData[filter];
  }

  generatePdf(report: ReportItem): void {
    window.alert(
      `Vista previa de reporte (${this.currentFilter}): ${report.fecha}${report.fechaFin ? ` a ${report.fechaFin}` : ''}`,
    );
  }
}
