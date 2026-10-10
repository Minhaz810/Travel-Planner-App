// Minimal stroke icons (24x24 grid).
const PATHS = {
  compass: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M15.5 8.5l-2 5-5 2 2-5z'],
  sparkles: ['M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z', 'M19 17v4', 'M17 19h4'],
  mapPin: ['M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z', 'M14.5 10a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0'],
  wallet: ['M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', 'M3 7l2.5-3h11L18 7', 'M16.5 14h.01'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  user: ['M20 21a8 8 0 0 0-16 0', 'M16 8a4 4 0 1 1-8 0a4 4 0 1 1 8 0'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0'],
  eyeOff: [
    'M3 3l18 18',
    'M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2',
    'M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6',
    'M9.9 9.9a3 3 0 0 0 4.2 4.2',
  ],
  check: ['M5 12l5 5L20 7'],
  alert: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M12 8v4', 'M12 16h.01'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  globe: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18'],
  backpack: ['M5 10a7 7 0 0 1 14 0v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', 'M9 6V4a3 3 0 0 1 6 0v2', 'M8 14h8v4H8z'],
}

export default function Icon({ name, size = 20, strokeWidth = 1.8, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
