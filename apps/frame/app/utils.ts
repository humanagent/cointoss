import { getUserInfo } from "../lib/resolver";
import type { UserInfo } from "../lib/resolver";

export function getFrameUrl() {
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
export const getProfileInfo = async (address: string) => {
  let profileInfo = await getUserInfo(address);
  return profileInfo as UserInfo;
};
export enum TossStatus {
  CREATED = 0,
  PAID = 1,
  PAUSED = 2,
  RESOLVED = 3,
}

const getImageAndENS = async (address: string) => {
  const url = `https://app.icebreaker.xyz/api/v1/eth/${address.toLowerCase()}`;
  const headers = { "Content-Type": "application/json" };

  const result = await fetch(url, { headers });
  const { profiles } = await result.json();

  if (profiles.length > 0) {
    const { channels, avatarUrl } = profiles[0];

    const ensChannel = channels.filter(
      (channel: any) => channel.type === "ens",
    )[0];

    return { avatarUrl, ens: ensChannel?.value };
  }

  return { avatarUrl: undefined, ens: undefined };
};
