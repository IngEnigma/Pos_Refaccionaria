import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

type AdminRole = 'Administrador' | 'Gerente' | 'Cajero';

interface BranchPreview {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly managers: readonly string[];
  readonly cashiers: number;
  readonly status: 'Activa' | 'Pendiente';
}

interface UserPreview {
  readonly name: string;
  readonly role: AdminRole;
  readonly branch: string;
  readonly status: 'Activo' | 'Invitado';
}

@Component({
  selector: 'app-admin-management-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './admin-management.page.html',
  styleUrl: './admin-management.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminManagementPageComponent {
  readonly branches: readonly BranchPreview[] = [
    {
      id: 'SUC-001',
      name: 'Matriz Centro',
      address: 'Av. Universidad 420, Centro',
      managers: ['Mariana Ruiz', 'Carlos Meza'],
      cashiers: 6,
      status: 'Activa',
    },
    {
      id: 'SUC-002',
      name: 'Norte Refacciones',
      address: 'Blvd. Industrias 1180, Norte',
      managers: ['Daniel Ortega'],
      cashiers: 4,
      status: 'Activa',
    },
    {
      id: 'SUC-003',
      name: 'Sucursal Oriente',
      address: 'Carretera Nacional 83, Oriente',
      managers: [],
      cashiers: 0,
      status: 'Pendiente',
    },
  ];

  readonly users: readonly UserPreview[] = [
    {
      name: 'Mariana Ruiz',
      role: 'Gerente',
      branch: 'Matriz Centro',
      status: 'Activo',
    },
    {
      name: 'Carlos Meza',
      role: 'Gerente',
      branch: 'Matriz Centro',
      status: 'Activo',
    },
    {
      name: 'Daniel Ortega',
      role: 'Gerente',
      branch: 'Norte Refacciones',
      status: 'Activo',
    },
    {
      name: 'Ana Lira',
      role: 'Cajero',
      branch: 'Matriz Centro',
      status: 'Invitado',
    },
  ];

  readonly managerOptions = ['Mariana Ruiz', 'Carlos Meza', 'Daniel Ortega', 'Sofia Ramos'];
}
