import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  id?: number;
  title: string;
  author: string;
  price: number;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private apiUrl = 'https://localhost:5145/api/books'; // change if needed

  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }
}