import type { SVGProps } from 'react';

export type IconName =
  | 'home' | 'clipboard' | 'calendar' | 'alert' | 'radar' | 'database'
  | 'report' | 'gear' | 'camera' | 'pin' | 'check' | 'shield' | 'radio'
  | 'printer' | 'download' | 'user' | 'users' | 'key' | 'link' | 'lock'
  | 'wrench' | 'search' | 'refresh' | 'mark';

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10.5V20h12v-9.5" />,
  clipboard: <><rect x="5.5" y="4.5" width="13" height="16" rx="2.5" /><path d="M9 4.5V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 3.2v1.3M9 11h6M9 14.5h6" /></>,
  calendar: <><rect x="4.5" y="5.5" width="15" height="14" rx="2.5" /><path d="M4.5 10h15M8.5 3.5v3.5M15.5 3.5v3.5" /></>,
  alert: <><path d="M12 3.5 21.5 20h-19L12 3.5Z" /><path d="M12 10v4.5M12 17.2v.3" /></>,
  radar: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.8" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><path d="M12 12 17.5 6.5" /></>,
  database: <><ellipse cx="12" cy="5.5" rx="7" ry="2.8" /><path d="M5 5.5v13c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-13M5 12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8" /></>,
  report: <><path d="M6 3.5h8L19 8.5V20.5H6V3.5Z" /><path d="M13.5 3.5v5.5H19M9 13h6M9 16h6" /></>,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" /></>,
  camera: <><rect x="3.5" y="7" width="17" height="12.5" rx="2.5" /><circle cx="12" cy="13" r="3.6" /><path d="M8.5 7 10 4.5h4L15.5 7" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-10.5A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.5C18.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.5" r="2.2" /></>,
  check: <path d="M4.5 12.5 10 18 19.5 6.5" />,
  shield: <><path d="M12 2.8 19.5 6v6c0 5-3.2 8.3-7.5 9.2C7.7 20.3 4.5 17 4.5 12V6L12 2.8Z" /><path d="M8.8 12l2.3 2.3 4.2-4.6" /></>,
  radio: <><rect x="7" y="8.5" width="10" height="12" rx="2" /><path d="M12 8.5V3.5M10 13.5h4M9.5 3.5h5" /><circle cx="12" cy="16.5" r="1" fill="currentColor" /></>,
  printer: <><path d="M7 8V3.5h10V8" /><rect x="4" y="8" width="16" height="8.5" rx="2" /><rect x="7" y="13.5" width="10" height="7" rx="1" /></>,
  download: <><path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" /></>,
  user: <><circle cx="12" cy="8" r="3.8" /><path d="M5 20.5c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5" /></>,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 20c1-2.8 3.2-4.2 6-4.2s5 1.4 6 4.2M15.5 5.8a3.2 3.2 0 0 1 0 5.7M17.5 16c1.7.7 2.9 1.9 3.5 4" /></>,
  key: <><circle cx="8" cy="12" r="4.5" /><path d="M12.5 12H21M18 12v3.5M15 12v2.5" /></>,
  link: <><path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.6-5.6l-1.5 1.5M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.6 5.6l1.5-1.5" /></>,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0-5.6 4.9L4 16.3V20h3.7l4.9-4.9a4 4 0 0 0 4.9-5.6l-2.8 2.8-2.4-.7-.7-2.4 2.9-2.7Z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></>,
  mark: <><path d="M12 2.5 20 6v6.2c0 5.2-3.4 8.6-8 9.3-4.6-.7-8-4.1-8-9.3V6l8-3.5Z" /><path d="M12 7v5" /><circle cx="12" cy="15" r=".9" fill="currentColor" /></>
};

export function Icon({ name, size = 17, className }: { name: IconName; size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg className={`ic ${className ?? ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <span className="brandmark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path d="M20 3 33 9.5v10c0 8-5.4 13.4-13 15.5C12.4 32.9 7 27.5 7 19.5v-10L20 3Z" fill="#0f766e" />
        <path d="M20 3 33 9.5v10c0 8-5.4 13.4-13 15.5C12.4 32.9 7 27.5 7 19.5v-10L20 3Z" stroke="#d7f3ef" strokeOpacity=".45" />
        <path d="M14.5 19.5l4 4 7-7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
