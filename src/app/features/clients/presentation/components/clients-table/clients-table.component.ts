import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Client } from '@features/clients/domain/entities/client.entity';
import { SkeletonComponent } from '@shared/ui/components/skeleton/skeleton.component';

@Component({
  selector: 'app-clients-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SkeletonComponent],
  templateUrl: './clients-table.component.html',
  styleUrls: ['./clients-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsTableComponent {
  readonly clients = input<readonly Client[]>([]);
  readonly loading = input(false);

  readonly edit = output<Client>();
  readonly delete = output<Client>();

  readonly skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  getFullName(client: Client): string {
    const parts = [client.nombre, client.apellidoPaterno];
    if (client.apellidoMaterno) {
      parts.push(client.apellidoMaterno);
    }
    return parts.join(' ');
  }
}
