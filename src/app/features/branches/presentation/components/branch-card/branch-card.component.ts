import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Branch } from '@features/branches/domain/entities/branch.entity';

@Component({
  selector: 'app-branch-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './branch-card.component.html',
  styleUrls: ['./branch-card.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchCardComponent {
  readonly branch = input.required<Branch>();

  readonly edit = output<Branch>();
  readonly delete = output<Branch>();
}
