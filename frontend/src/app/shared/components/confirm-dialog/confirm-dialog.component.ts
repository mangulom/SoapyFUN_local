import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'soapy-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
           (click)="onBackdrop($event)">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 animate-scale-up">
          <div class="flex items-center gap-4">
            <div class="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-rose-100 text-rose-600 text-xl font-bold">
              ⚠
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-800 leading-tight">{{ title }}</h3>
              <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ message }}</p>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              (click)="cancel.emit()"
              class="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              class="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition cursor-pointer"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.16s ease-out forwards; }
    .animate-scale-up { animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = '¿Estás segura?';
  @Input() message = 'Esta acción no se puede deshacer.';
  @Input() confirmText = 'Eliminar';
  @Input() cancelText = 'Cancelar';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('fixed')) {
      this.cancel.emit();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.cancel.emit();
    }
  }
}
