import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItem, Product } from './product.model';
import { ProductService } from './product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly productService = inject(ProductService);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<string[]>(['Todo']);
  readonly selectedCategory = signal('Todo');
  readonly sort = signal('featured');
  readonly selectedProduct = signal<Product | null>(null);
  readonly cart = signal<CartItem[]>(this.restoreCart());
  readonly cartOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly searchTerm = signal('');
  readonly error = signal(false);
  readonly toast = signal('');
  readonly newsletterEmail = signal('');
  readonly newsletterMessage = signal('');

  readonly visibleProducts = computed(() => {
    const category = this.selectedCategory();
    const items = category === 'Todo'
      ? [...this.products()]
      : this.products().filter((product) => product.category === category);

    switch (this.sort()) {
      case 'low': return items.sort((a, b) => a.price - b.price);
      case 'high': return items.sort((a, b) => b.price - a.price);
      case 'rating': return items.sort((a, b) => b.rating - a.rating);
      default: return items;
    }
  });

  readonly searchResults = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) return [];
    return this.products().filter((product) =>
      `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)
    );
  });

  readonly cartCount = computed(() => this.cart().reduce((total, item) => total + item.quantity, 0));
  readonly cartTotal = computed(() => this.cart().reduce((total, item) => total + item.quantity * item.price, 0));

  constructor() {
    this.productService.getProducts().subscribe({
      next: (response) => {
        this.products.set(response.products);
        this.categories.set(response.categories);
      },
      error: () => this.error.set(true)
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  selectSort(value: string): void {
    this.sort.set(value);
  }

  visualClass(product: Product): string {
    const bottleClass = ['candle', 'set'].includes(product.visual) ? '' : ' visual-bottle';
    return `product-visual ${product.visual}${bottleClass}`;
  }

  addToCart(product: Product): void {
    this.cart.update((items) => {
      const present = items.find((item) => item.id === product.id);
      if (present) return items.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...items, { ...product, quantity: 1 }];
    });
    this.persistCart();
    this.showToast(`${product.name} se añadió a tu bolsa.`);
  }

  updateQuantity(id: string, delta: number): void {
    this.cart.update((items) => items
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
    this.persistCart();
  }

  removeFromCart(id: string): void {
    this.cart.update((items) => items.filter((item) => item.id !== id));
    this.persistCart();
  }

  openProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.searchOpen.set(false);
  }

  closeProduct(): void {
    this.selectedProduct.set(null);
  }

  completeNewsletter(): void {
    if (!this.newsletterEmail().trim()) return;
    this.newsletterMessage.set('Gracias, tu luz ya está en camino ✦');
    this.newsletterEmail.set('');
  }

  checkout(): void {
    this.showToast('El checkout estará disponible muy pronto.');
  }

  private restoreCart(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem('lumina-cart') ?? '[]') as CartItem[];
    } catch {
      return [];
    }
  }

  private persistCart(): void {
    localStorage.setItem('lumina-cart', JSON.stringify(this.cart()));
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => this.toast.set(''), 2600);
  }
}
