import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

interface CashierPreview {
  readonly name: string;
  readonly email: string;
  readonly shift: string;
  readonly status: 'Activo' | 'Invitado';
}

@Component({
  selector: 'app-cashiers-management-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cashiers-management.page.html',
  styleUrl: './cashiers-management.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashiersManagementPageComponent {
  readonly cashiers: readonly CashierPreview[] = [
    {
      name: 'Ana Lira',
      email: 'ana.lira@trt.com',
      shift: 'Matutino',
      status: 'Activo',
    },
    {
      name: 'Roberto Solis',
      email: 'roberto.solis@trt.com',
      shift: 'Vespertino',
      status: 'Activo',
    },
    {
      name: 'Iris Molina',
      email: 'iris.molina@trt.com',
      shift: 'Mixto',
      status: 'Invitado',
    },
  ];
}
