// src/__tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ results: mockSearchResults })
    );
  }),
  rest.post('/api/upload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  })
];