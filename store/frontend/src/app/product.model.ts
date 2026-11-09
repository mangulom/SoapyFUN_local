export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  size: string;
  rating: number;
  reviews: number;
  badge: string | null;
  visual: string;
  description: string;
}

export interface ProductResponse {
  products: Product[];
  count: number;
  categories: string[];
}

export interface CartItem extends Product {
  quantity: number;
}
