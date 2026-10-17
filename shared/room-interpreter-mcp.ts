export const ROOM_INTERPRETER_MCP_PATH = "/mcp/room-interpreter";
export const ROOM_INTERPRETER_STATUS_TOOL = "helix_room_interpreter_status";
// The room store creates shared_realtime_room:<UUID>; keep native admission on that identity.
export const ROOM_INTERPRETER_ROOM_ID_PATTERN = /^shared_realtime_room:[0-9a-f-]{36}$/iu;
