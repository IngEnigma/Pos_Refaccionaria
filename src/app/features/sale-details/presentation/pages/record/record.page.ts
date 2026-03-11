import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

interface SaleRecordItem {
  id: string;
  fecha: string;
  metodoPago: string;
  total: number;
}

@Component({
  selector: 'app-record-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './record.page.html',
  styleUrl: './record.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordPageComponent {
  readonly sales: SaleRecordItem[] = [
    { id: 'VTA-1001', fecha: '2026-02-01', metodoPago: 'Efectivo', total: 1580 },
    { id: 'VTA-1002', fecha: '2026-02-03', metodoPago: 'Tarjeta', total: 970 },
    { id: 'VTA-1003', fecha: '2026-02-04', metodoPago: 'Efectivo', total: 3250 },
    { id: 'VTA-1004', fecha: '2026-02-05', metodoPago: 'Tarjeta', total: 820 },
  ];
}
