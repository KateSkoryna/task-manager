import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('http://localhost:3333/api/users/:userId/todolists', () =>
    HttpResponse.json({ items: [], nextCursor: null })
  ),
  http.post('http://localhost:3333/api/auth/provision', () =>
    HttpResponse.json({ ok: true })
  ),
];
