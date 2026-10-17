export type SolarObservationSaveResult =
  | { status: "saved"; fileName: string; bytes: number }
  | { status: "cancelled" }
  | { status: "failed"; reason: string };
