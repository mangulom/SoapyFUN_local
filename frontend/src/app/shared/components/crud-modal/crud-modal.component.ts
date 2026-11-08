import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'soapy-crud-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
           (click)="onBackdropClick($event)">
        <div class="modal-container w-full max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up"
             [ngClass]="sizeClass">
          <!-- Modal Header -->
          <header class="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div>
              @if (eyebrow) {
                <span class="text-[9px] font-extrabold tracking-wider text-purple-700 uppercase">{{ eyebrow }}</span>
              }
              <h3 class="text-lg font-bold text-slate-850 mt-0.5 leading-tight">{{ title }}</h3>
              @if (subtitle) {
                <p class="text-xs text-slate-500 mt-1">{{ subtitle }}</p>
              }
            </div>
            <button
              type="button"
              (click)="close.emit()"
              class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </header>

          <!-- Modal Body (Scrollable) -->
          <div class="modal-body flex-1 overflow-y-auto p-5 sm:p-6 text-sm text-slate-700">
            <ng-content></ng-content>
          </div>

          <!-- Modal Footer (Optional ng-content projection) -->
          @if (showFooter) {
            <footer class="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
              <ng-content select="[modal-footer]"></ng-content>
            </footer>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.18s ease-out forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class CrudModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showFooter = false;

  @Output() close = new EventEmitter<void>();

  get sizeClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-md';
      case 'lg': return 'max-w-3xl';
      case 'xl': return 'max-w-5xl';
      case 'md':
      default: return 'max-w-xl';
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }
}
