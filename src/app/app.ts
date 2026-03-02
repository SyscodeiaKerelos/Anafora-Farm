import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { ThemeService } from './core/services/theme.service';
import { TranslationService } from './core/services/translation.service';
import { TranslatePipe } from '@ngx-translate/core';

interface City {
  name: string;
  code: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  status: string;
}

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    CommonModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TranslatePipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'Anafora-Farm';

  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);

  protected cities: City[] = [
    { name: 'New York', code: 'NY' },
    { name: 'Rome', code: 'RM' },
    { name: 'London', code: 'LDN' },
    { name: 'Paris', code: 'PRS' },
    { name: 'Tokyo', code: 'TYO' },
  ];

  protected selectedCity: City | null = null;

  protected products: Product[] = [
    { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1299, status: 'In Stock' },
    { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 49, status: 'Low Stock' },
    { id: 3, name: 'USB-C Hub', category: 'Accessories', price: 79, status: 'In Stock' },
    { id: 4, name: '4K Monitor', category: 'Electronics', price: 499, status: 'Out of Stock' },
    { id: 5, name: 'Mechanical Keyboard', category: 'Accessories', price: 159, status: 'In Stock' },
  ];

  protected getSeverity(
    status: string,
  ): 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'In Stock':
        return 'success';
      case 'Low Stock':
        return 'warn';
      case 'Out of Stock':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
