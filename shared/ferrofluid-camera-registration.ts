import {
  poseFromQuaternionTranslation,
  surfaceImageMapFromCamera,
  type Mat4,
  type SurfaceChart,
  type SurfaceImageMap,
} from './surface-registration';

export interface FerrofluidFrameSurfaceMap {
  image: string;
  timeS: number;
  sourceSampleTimelineFrame1Based: number;
  targetMotionStatus: string;
  map: SurfaceImageMap;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function number(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${label} must be a finite number.`);
  return value;
}

function tuple<T extends number[]>(value: unknown, length: number, label: string): T {
  if (!Array.isArray(value) || value.length !== length) throw new TypeError(`${label} must contain ${length} numbers.`);
  return value.map((item, index) => number(item, `${label}[${index}]`)) as T;
}

function matrix4(value: unknown, label: string): Mat4 {
  if (!Array.isArray(value) || value.length !== 4) throw new TypeError(`${label} must be a 4×4 matrix.`);
  return value.map((row, index) => tuple(row, 4, `${label}[${index}]`)) as unknown as Mat4;
}

/**
 * Adapt one frame from `codex.shared-surface-registration.v1` into the shared
 * sampler. It consumes per-frame camera and target poses independently and
 * supports the COLMAP SIMPLE_RADIAL model used by the current research pilot.
 */
export function surfaceMapFromFerrofluidManifestFrame(
  manifestValue: unknown,
  imageName: string,
  chart: SurfaceChart,
): FerrofluidFrameSurfaceMap {
  const manifest = record(manifestValue, 'manifest');
  if (manifest.schema !== 'codex.shared-surface-registration.v1') throw new TypeError('Unsupported surface registration manifest.');
  const source = record(manifest.source, 'manifest.source');
  const [imageWidth, imageHeight] = tuple(source.analysis_dimensions_px, 2, 'source.analysis_dimensions_px');
  if (!Number.isInteger(imageWidth) || !Number.isInteger(imageHeight)) throw new TypeError('Analysis image dimensions must be integers.');
  const reconstruction = record(manifest.camera_reconstruction, 'manifest.camera_reconstruction');
  const modelName = reconstruction.camera_model;
  if (modelName !== 'SIMPLE_RADIAL') throw new TypeError('Only the pilot SIMPLE_RADIAL camera model is supported.');
  const parameters = record(reconstruction.camera_model_parameters, 'camera_reconstruction.camera_model_parameters');
  const focal = number(parameters.f, 'camera focal length');
  const cx = number(parameters.cx, 'camera principal x');
  const cy = number(parameters.cy, 'camera principal y');
  const radial = number(parameters.k, 'camera radial coefficient');
  const frames = manifest.frames;
  if (!Array.isArray(frames)) throw new TypeError('manifest.frames must be an array.');
  const frameValue = frames.find(candidate => record(candidate, 'frame').image === imageName);
  if (!frameValue) throw new RangeError(`Frame ${imageName} is absent from the registration manifest.`);
  const frame = record(frameValue, `frame ${imageName}`);
  const cameraPose = record(frame.camera_to_world, `frame ${imageName}.camera_to_world`);
  const translation = tuple(cameraPose.translation_sfm_units, 3, 'camera_to_world.translation_sfm_units') as [number, number, number];
  const quaternion = tuple(cameraPose.quaternion_xyzw, 4, 'camera_to_world.quaternion_xyzw') as [number, number, number, number];
  const targetPose = record(frame.target_pose, `frame ${imageName}.target_pose`);
  const worldFromTarget = matrix4(targetPose.world_from_target_sfm, 'target_pose.world_from_target_sfm');
  const timeS = number(frame.time_s, `frame ${imageName}.time_s`);
  const timelineIndex = number(frame.source_sample_timeline_frame_1_based, `frame ${imageName}.source_sample_timeline_frame_1_based`);
  if (timeS < 0 || !Number.isInteger(timelineIndex) || timelineIndex < 1) throw new RangeError('Frame time or source timeline index is invalid.');
  if (typeof targetPose.motion_status !== 'string') throw new TypeError('Target pose must declare its motion status.');

  const map = surfaceImageMapFromCamera(chart, {
    imageWidth, imageHeight, fx: focal, fy: focal, cx, cy,
    distortion: [radial, 0, 0, 0, 0],
  }, poseFromQuaternionTranslation(translation, quaternion), worldFromTarget);
  return {image: imageName, timeS, sourceSampleTimelineFrame1Based: timelineIndex,
    targetMotionStatus: targetPose.motion_status, map};
}
