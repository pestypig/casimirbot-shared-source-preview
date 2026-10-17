// Protocol identifiers only. Gateway/provider imports must not load the room
// service graph while their own registries are still initializing.
export const ROOM_RESULT_TURN_PREFIX = "ask:room-result:";
export const ROOM_RESULT_READ_CAPABILITY = "room.mission_result.read_selected";
export const ROOM_RESULT_OBSERVATION_SCHEMA = "helix.room_mission_result_observation.v1";
