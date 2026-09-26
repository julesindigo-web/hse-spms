import { describe, it, expect, vi, afterEach } from 'vitest';
import { toCSV, download, findingRegister, inspectionSummary } from './reporting';

afterEach(() => { vi.restoreAllMocks(); });

describe('toCSV', () => {
  it('string kosong untuk tanpa baris', () => {
    expect(toCSV([])).toBe('');
  });
  it('escape koma, kutip, dan null', () => {
    const out = toCSV([{ a: 'x,y', b: 'q"q', c: null, d: 5 }]);
    expect(out).toBe('a,b,c,d\n"x,y","q""q","","5"');
  });
});

describe('download', () => {
  function stubUrls() {
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:x'), configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  }
  it('membuat anchor, klik, dan revoke', () => {
    stubUrls();
    vi.useFakeTimers();
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    download('f.csv', 'a,b');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe('f.csv');
    expect(click).toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    vi.useRealTimers();
  });
  it('memakai mime text/csv default dan custom', () => {
    stubUrls();
    const blobs: Array<{ parts: BlobPart[]; opt?: BlobPropertyBag }> = [];
    vi.spyOn(document, 'createElement').mockReturnValue({ click() {}, href: '', download: '' } as unknown as HTMLAnchorElement);
    const Orig = globalThis.Blob;
    type BlobFn = (parts?: BlobPart[], opt?: BlobPropertyBag) => Blob;
    const blobSpy = vi.spyOn(globalThis, 'Blob') as unknown as { mockImplementation: (fn: BlobFn) => void };
    blobSpy.mockImplementation((parts, opt) => {
      blobs.push({ parts: parts ?? [], opt });
      return new Orig(parts, opt);
    });
    download('a', 'y');
    download('b', 'y', 'application/json');
    expect(blobs[0].opt).toEqual({ type: 'text/csv' });
    expect(blobs[1].opt).toEqual({ type: 'application/json' });
  });
});

describe('register & summary', () => {
  it('findingRegister memetakan kolom + null aman', () => {
    const csv = findingRegister([{ id: '1', area_id: 'A', title: 'T', risk_level: 'HIGH', risk_score: 12, state: 'OPEN' } as never]);
    expect(csv).toContain('HIGH');
  });
  it('inspectionSummary memakai angka respons', () => {
    const csv = inspectionSummary([{ id: 'i', date: 'd', shift: 'PAGI', area_id: 'A', state: 'SUBMITTED', overall_status: 'SAFE', stop_work_triggered: false, responses: [1, 2] } as never]);
    expect(csv).toContain('2');
  });
});
