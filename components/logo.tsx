export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 375 375" width={size} height={size}>
      <rect width="375" height="375" rx="17.25" fill="currentColor" />
      <path
        transform="translate(84.108568, 302.248811)"
        fill="hsl(var(--background))"
        d="M 180.921875 -238.8125 L 180.921875 -197.46875 L 131.640625 -197.46875 L 131.640625 -41.53125 L 180.921875 -41.53125 L 180.921875 0 L 25.84375 0 L 25.84375 -41.53125 L 75.125 -41.53125 L 75.125 -197.46875 L 25.84375 -197.46875 L 25.84375 -238.8125 Z"
      />
    </svg>
  );
}
