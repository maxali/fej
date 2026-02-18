import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockFetch } from '../utils/test-helpers';
import { createFej } from '../../src/index';

describe('Query parameter building via convenience methods', () => {
  let originalFetch: typeof globalThis.fetch;
  let mock: ReturnType<typeof createMockFetch>['mock'];
  let calls: ReturnType<typeof createMockFetch>['calls'];
  let api: ReturnType<typeof createFej>;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    const mockFetch = createMockFetch();
    mock = mockFetch.mock;
    calls = mockFetch.calls;
    globalThis.fetch = mock;
    api = createFej();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('appends basic string params to the URL', async () => {
    await api.get('/api/items', { params: { page: '1', limit: '10' } });

    const url = calls[0].input as string;
    expect(url).toContain('?');
    expect(url).toContain('page=1');
    expect(url).toContain('limit=10');
  });

  it('coerces number values to strings', async () => {
    await api.get('/api/items', { params: { page: 1 } });

    const url = calls[0].input as string;
    expect(url).toContain('page=1');
  });

  it('coerces boolean values to strings', async () => {
    await api.get('/api/items', { params: { active: true } });

    const url = calls[0].input as string;
    expect(url).toContain('active=true');
  });

  it('uses & separator when URL already has a query string', async () => {
    await api.get('/api?existing=yes', { params: { extra: 'val' } });

    const url = calls[0].input as string;
    expect(url).toContain('existing=yes');
    expect(url).toContain('extra=val');
    expect(url).toMatch(/existing=yes.*&.*extra=val/);
  });

  it('encodes special characters in param values', async () => {
    await api.get('/api/search', { params: { q: 'hello world' } });

    const url = calls[0].input as string;
    // URLSearchParams encodes spaces as '+' by default
    expect(url).toMatch(/q=hello[+ ]world|q=hello%20world/);
  });

  it('does not append a query string when params is empty', async () => {
    await api.get('/api/items', { params: {} });

    const url = calls[0].input as string;
    expect(url).toBe('/api/items');
  });

  it('does not alter the URL when no options are provided', async () => {
    await api.get('/api/items');

    const url = calls[0].input as string;
    expect(url).toBe('/api/items');
  });
});
