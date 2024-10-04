export function vercelURL() {
  return process.env.FRAME_URL || "http://localhost:3000";
}

export function parseAddress(
  address: string,
  start: number = 4,
  end: number = -3,
) {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(end)}`;
}

export enum BetStatus {
  CREATED = 0,
  PAID = 1,
  PAUSED = 2,
  RESOLVED = 3,
}
