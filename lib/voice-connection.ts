import type { Room, RoomEvent } from "livekit-client";

/** A media connection alone does not mean the dispatched consultant is available. */
export function waitForVoiceAgent(room: Room, events: typeof RoomEvent, timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      room.off(events.ParticipantConnected, check);
      room.off(events.ParticipantAttributesChanged, check);
      room.off(events.Disconnected, disconnected);
    };
    const check = () => {
      if ([...room.remoteParticipants.values()].some(participant => participant.isAgent
        && participant.attributes["pinet.voice.ready"] === "true")) {
        cleanup(); resolve();
      }
    };
    const disconnected = () => {
      cleanup(); reject(new Error("Ryšys nutrūko jungiant konsultantą. Bandykite dar kartą."));
    };
    room.on(events.ParticipantConnected, check);
    room.on(events.ParticipantAttributesChanged, check);
    room.on(events.Disconnected, disconnected);
    const timer = setTimeout(() => {
      cleanup(); reject(new Error("Konsultantas šiuo metu nepasiekiamas. Bandykite dar kartą arba palikite užklausą."));
    }, timeoutMs);
    check();
  });
}
