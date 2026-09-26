import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { clearAll } from './test/render';

beforeEach(async () => { await clearAll(); });

describe('main', () => {
  it('me-mount aplikasi ke #root', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main');
    expect(await screen.findByText(/memerlukan login|Selamat bertugas/)).not.toBeNull();
  });
});
