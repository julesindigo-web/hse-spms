import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import { clearAll, renderWith } from '../test/render';

beforeEach(async () => { await clearAll(); });

describe('Login', () => {
  it('sukses → navigasi home; gagal → errbox; toggle sandi', async () => {
    const u = userEvent.setup();
    const r = renderWith('/login', <Routes><Route path="/login" element={<Login />} /><Route path="/" element={<Home />} /></Routes>);
    expect(await r.findByText('Masuk ke Patrol')).not.toBeNull();
    await u.click(r.getByText('Lihat'));
    await u.click(r.getByText('Sembunyi'));
    await u.type(r.getByPlaceholderText('nama@sifang.co.id'), 'patrol-sifang@gmail.com');
    await u.type(r.getByLabelText('Kata sandi'), 'salah');
    await u.click(r.getByText('Masuk ke Patrol'));
    expect(await r.findByText(/Kata sandi salah/)).not.toBeNull();
    await u.clear(r.getByLabelText('Kata sandi'));
    await u.type(r.getByLabelText('Kata sandi'), '12345');
    await u.click(r.getByText('Masuk ke Patrol'));
    expect(await screen.findByText(/Selamat bertugas/)).not.toBeNull();
  });
  it('busy state + daftar akun terlihat', async () => {
    renderWith('/login', <Login />);
    expect(await screen.findByText(/patrol-sifang@gmail.com/)).not.toBeNull();
    expect(screen.getByText(/Akun terdaftar/)).not.toBeNull();
    expect(screen.getByAltText(/Priastama Adiyoga/)).toHaveAttribute('src', '/brand/pa-logo-768.png');
  });
});
