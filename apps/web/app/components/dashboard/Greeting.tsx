// Greeting.tsx
// Time-based greeting: Good morning / afternoon / evening

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Greeting() {
  return getGreeting();
}
