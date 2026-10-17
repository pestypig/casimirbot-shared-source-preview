import { z } from "zod";

const finiteAngle = z.number().finite().min(-1e9).max(1e9);

/** Caller-supplied angles in one calibrated image-plane frame; no video is read. */
export const ferrofluidRelativeAxisInputSchema = z.object({
  schemaVersion: z.literal("ferrofluid-relative-axis-input/1"),
  shapeAxisRad: finiteAngle,
  driveDirectionRad: finiteAngle,
  magnetAxisRad: finiteAngle.optional(),
}).strict();

export type FerrofluidRelativeAxisInput = z.infer<typeof ferrofluidRelativeAxisInputSchema>;

const axialOffset = (a: number, b: number) =>
  0.5 * Math.atan2(Math.sin(2 * (a - b)), Math.cos(2 * (a - b)));

export function evaluateFerrofluidRelativeAxis(raw: unknown) {
  const input = ferrofluidRelativeAxisInputSchema.parse(raw);
  const shapeDrive = axialOffset(input.shapeAxisRad, input.driveDirectionRad);
  const magnetDrive = input.magnetAxisRad === undefined ? null : axialOffset(input.magnetAxisRad, input.driveDirectionRad);
  const shapeMagnet = input.magnetAxisRad === undefined ? null : axialOffset(input.shapeAxisRad, input.magnetAxisRad);
  return {
    schemaVersion: "ferrofluid-relative-axis/1" as const,
    input,
    shapeDriveAxialOffsetRad: shapeDrive,
    shapeDriveCos2Offset: Math.cos(2 * shapeDrive),
    magnetDriveAxialOffsetRad: magnetDrive,
    shapeMagnetAxialOffsetRad: shapeMagnet,
    period: { shapeAxisRad: Math.PI, driveDirectionRad: 2 * Math.PI },
    provenance: "caller_supplied_same_frame_angles_only" as const,
    limits: [
      "The shape's principal axis is unoriented, so axial offsets repeat every pi radians.",
      "No frame registration, contour QA, physical magnet spin, drive phase or source bytes are authenticated.",
      "A finite offset alone does not identify torque, slip, precession or a thermal mechanism.",
    ],
  };
}
