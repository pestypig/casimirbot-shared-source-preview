import { z } from "zod";
import { helixSharedLiveRoomIdSchema } from "./contracts/helix-shared-live-room-agent.v1";

export const ROOM_SERVICE_QUERY = "service_room";
export const roomServiceNavigationRequestSchema = z.object({
  authority: z.string().url(),
  room_id: helixSharedLiveRoomIdSchema,
}).strict();

export function roomServiceReturnPath(roomId: string): string {
  const id = helixSharedLiveRoomIdSchema.parse(roomId);
  return `/desktop?${ROOM_SERVICE_QUERY}=${encodeURIComponent(id)}`;
}

// The renderer selects a room, never a destination URL or credential. The host
// binds navigation to the same configured HTTPS authority as its room client.
export function roomServiceNavigationUrl(input: unknown, configuredAuthority: unknown): string {
  const request = roomServiceNavigationRequestSchema.parse(input);
  if (typeof configuredAuthority !== "string") throw new Error("room_service_unconfigured");
  const authority = new URL(configuredAuthority.trim());
  if (authority.protocol !== "https:" || authority.username || authority.password ||
      authority.pathname !== "/" || authority.search || authority.hash ||
      request.authority !== authority.origin) throw new Error("room_service_authority_mismatch");
  return new URL(roomServiceReturnPath(request.room_id), authority.origin).toString();
}

export function readRoomServiceTarget(search: string): string | null {
  const params = new URLSearchParams(search);
  if (params.getAll(ROOM_SERVICE_QUERY).length !== 1) return null;
  const parsed = helixSharedLiveRoomIdSchema.safeParse(params.get(ROOM_SERVICE_QUERY));
  return parsed.success ? parsed.data : null;
}
