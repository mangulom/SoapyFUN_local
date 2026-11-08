import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrudDataService } from '../../../core/services/crud-data.service';

@Component({
  selector: 'soapy-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      @for (toast of dataService.toasts(); track toast.id) {
        <div
          class="toast-item pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur transition-all duration-300 transform translate-y-0 opacity-100"
          [ngClass]="{
            'bg-emerald-50/95 border-emerald-200 text-emerald-900': toast.tipo === 'success',
            'bg-amber-50/95 border-amber-200 text-amber-900': toast.tipo === 'warn',
            'bg-blue-50/95 border-blue-200 text-blue-900': toast.tipo === 'info',
            'bg-rose-50/95 border-rose-200 text-rose-900': toast.tipo === 'error'
          }"
        >
          <span class="toast-icon text-lg select-none">
            @if (toast.tipo === 'success') { ✓ }
            @else if (toast.tipo === 'warn') { ⚠ }
            @else if (toast.tipo === 'info') { ✦ }
            @else { ✕ }
          </span>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold leading-tight">{{ toast.titulo }}</h4>
            <p class="text-[11px] mt-0.5 opacity-90 leading-snug">{{ toast.mensaje }}</p>
          </div>
          <button
            (click)="dataService.cerrarToast(toast.id)"
            class="text-xs opacity-50 hover:opacity-100 transition p-1 -mr-1 -mt-1 cursor-pointer"
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-item {
      animation: toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(12px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `],
})
export class ToastComponent {
  readonly dataService = inject(CrudDataService);
}
