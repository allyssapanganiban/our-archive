export function HeartIcon({ size = 14, fill = "currentColor" }: { size?: number | string; fill?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.6 3 5 6.4 5c2.1 0 3.6 1.2 4.6 2.7C12 6.2 13.5 5 15.6 5 19 5 21.1 8.6 19.6 11.9 17.5 16.4 12 21 12 21z" fill={fill} />
    </svg>
  );
}
