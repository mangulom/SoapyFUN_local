import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductResponse } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:9000/api/products';

  getProducts() {
    return this.http.get<ProductResponse>(this.apiUrl);
  }
}
