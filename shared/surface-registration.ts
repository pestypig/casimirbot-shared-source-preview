/**
 * Shared surface-to-frame projection and image resampling primitives.
 *
 * Pose convention: `worldFromCamera` and `worldFromTarget` map local points to
 * the same world frame. This module removes camera motion while preserving
 * target motion because both poses are supplied independently for each frame.
 * Pose estimation, occluder detection, refraction and scientific admission are
 * intentionally outside this geometry layer.
 */

export type Vec3 = readonly [number, number, number];
export type Vec4 = readonly [number, number, number, number];
export type Mat4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
];

export interface SurfaceChart {
  width: number;
  height: number;
  /** Row-major XYZ triples in target-local coordinates. */
  points: Float32Array | Float64Array;
  /** Row-major outward-normal triples in target-local coordinates. */
  normals: Float32Array | Float64Array;
}

export interface ProjectedSurfacePoints {
  pixelX: ArrayLike<number>;
  pixelY: ArrayLike<number>;
  /** Nonzero means the point passes projector-specific visibility checks. */
  visible: ArrayLike<number | boolean>;
}

export interface SurfaceProjector {
  (targetLocalPoints: Float64Array): ProjectedSurfacePoints;
}

export interface SurfaceImageMap {
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  sourceX: Float32Array;
  sourceY: Float32Array;
  /** One byte per chart pixel: 1 when the source coordinate is sampleable. */
  valid: Uint8Array;
}

export interface PinholeCameraModel {
  imageWidth: number;
  imageHeight: number;
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  skew?: number;
  /** OpenCV order: k1, k2, p1, p2, k3. */
  distortion?: readonly [number, number, number, number, number];
}

const MAX_CHART_PIXELS = 16 * 1024 * 1024;

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
}

function validateChart(chart: SurfaceChart): number {
  if (!Number.isInteger(chart.width) || chart.width < 1 ||
      !Number.isInteger(chart.height) || chart.height < 1) {
    throw new RangeError('Chart width and height must be positive integers.');
  }
  const count = chart.width * chart.height;
  if (count > MAX_CHART_PIXELS) throw new RangeError('Surface chart exceeds the 16-megapixel limit.');
  if (chart.points.length !== count * 3 || chart.normals.length !== count * 3) {
    throw new RangeError('Chart points and normals must each contain one XYZ triple per pixel.');
  }
  for (let index = 0; index < count * 3; index++) {
    finite(chart.points[index], 'chart point');
    finite(chart.normals[index], 'chart normal');
  }
  return count;
}

/** Create a center-sampled equirectangular sphere chart, top row at north. */
export function sphereEquirectangularChart(
  radius: number,
  width: number,
  height: number,
  longitudeRange: readonly [number, number] = [-Math.PI, Math.PI],
  latitudeRange: readonly [number, number] = [Math.PI / 2, -Math.PI / 2],
): SurfaceChart {
  finite(radius, 'radius');
  if (radius <= 0 || !Number.isInteger(width) || width < 1 ||
      !Number.isInteger(height) || height < 1 || width * height > MAX_CHART_PIXELS) {
    throw new RangeError('Sphere radius and chart dimensions are invalid.');
  }
  const [longitude0, longitude1] = longitudeRange;
  const [latitude0, latitude1] = latitudeRange;
  finite(longitude0, 'longitude start');
  finite(longitude1, 'longitude end');
  finite(latitude0, 'latitude start');
  finite(latitude1, 'latitude end');
  if (longitude1 <= longitude0 || latitude0 > Math.PI / 2 || latitude0 < -Math.PI / 2 ||
      latitude1 > Math.PI / 2 || latitude1 < -Math.PI / 2 || latitude1 >= latitude0) {
    throw new RangeError('Sphere chart coordinate ranges are invalid.');
  }

  const points = new Float64Array(width * height * 3);
  const normals = new Float64Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    const latitude = latitude0 + ((y + 0.5) / height) * (latitude1 - latitude0);
    const cosLatitude = Math.cos(latitude);
    for (let x = 0; x < width; x++) {
      const longitude = longitude0 + ((x + 0.5) / width) * (longitude1 - longitude0);
      const offset = (y * width + x) * 3;
      const nx = cosLatitude * Math.cos(longitude);
      const ny = Math.sin(latitude);
      const nz = cosLatitude * Math.sin(longitude);
      points[offset] = radius * nx;
      points[offset + 1] = radius * ny;
      points[offset + 2] = radius * nz;
      normals[offset] = nx;
      normals[offset + 1] = ny;
      normals[offset + 2] = nz;
    }
  }
  return {width, height, points, normals};
}

/**
 * Build a chart-to-image remap through an application supplied projector.
 * A WCS caller can provide pixel coordinates and a visible-hemisphere mask;
 * a perspective camera caller can use `surfaceImageMapFromCamera` below.
 */
export function surfaceImageMapFromProjector(
  chart: SurfaceChart,
  imageWidth: number,
  imageHeight: number,
  projectPoints: SurfaceProjector,
): SurfaceImageMap {
  const count = validateChart(chart);
  if (!Number.isInteger(imageWidth) || imageWidth < 2 ||
      !Number.isInteger(imageHeight) || imageHeight < 2) {
    throw new RangeError('Source image dimensions must be integers of at least 2×2.');
  }
  const targetLocalPoints = chart.points instanceof Float64Array
    ? chart.points
    : Float64Array.from(chart.points);
  const projected = projectPoints(targetLocalPoints);
  if (projected.pixelX.length !== count || projected.pixelY.length !== count || projected.visible.length !== count) {
    throw new RangeError('Projector must return one x, y and visibility value per chart pixel.');
  }
  const sourceX = new Float32Array(count);
  const sourceY = new Float32Array(count);
  const valid = new Uint8Array(count);
  for (let index = 0; index < count; index++) {
    const x = Number(projected.pixelX[index]);
    const y = Number(projected.pixelY[index]);
    sourceX[index] = Number.isFinite(x) ? x : 0;
    sourceY[index] = Number.isFinite(y) ? y : 0;
    if (projected.visible[index] && Number.isFinite(x) && Number.isFinite(y) &&
        x >= 0 && x < imageWidth - 1 && y >= 0 && y < imageHeight - 1) {
      valid[index] = 1;
    }
  }
  return {width: chart.width, height: chart.height, imageWidth, imageHeight, sourceX, sourceY, valid};
}

function assertRigidPose(pose: Mat4, label: string): void {
  if (pose.length !== 4 || pose.some(row => row.length !== 4 || row.some(value => !Number.isFinite(value)))) {
    throw new RangeError(`${label} must be a finite 4×4 matrix.`);
  }
  if (Math.abs(pose[3][0]) > 1e-7 || Math.abs(pose[3][1]) > 1e-7 ||
      Math.abs(pose[3][2]) > 1e-7 || Math.abs(pose[3][3] - 1) > 1e-7) {
    throw new RangeError(`${label} must be an affine rigid pose.`);
  }
  for (let column = 0; column < 3; column++) {
    for (let other = 0; other < 3; other++) {
      let dot = 0;
      for (let row = 0; row < 3; row++) dot += pose[row][column] * pose[row][other];
      if (Math.abs(dot - (column === other ? 1 : 0)) > 1e-5) {
        throw new RangeError(`${label} rotation must be orthonormal.`);
      }
    }
  }
  const determinant = pose[0][0] * (pose[1][1] * pose[2][2] - pose[1][2] * pose[2][1]) -
    pose[0][1] * (pose[1][0] * pose[2][2] - pose[1][2] * pose[2][0]) +
    pose[0][2] * (pose[1][0] * pose[2][1] - pose[1][1] * pose[2][0]);
  if (Math.abs(determinant - 1) > 1e-5) throw new RangeError(`${label} rotation must be right-handed.`);
}

function identity4(): number[][] {
  return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}

function multiply4(a: Mat4 | number[][], b: Mat4 | number[][]): number[][] {
  const result = identity4().map(row => row.map(() => 0));
  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 4; column++) {
      for (let k = 0; k < 4; k++) result[row][column] += a[row][k] * b[k][column];
    }
  }
  return result;
}

function inverseRigid(pose: Mat4): number[][] {
  const result = identity4();
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) result[row][column] = pose[column][row];
  }
  for (let row = 0; row < 3; row++) {
    result[row][3] = -(result[row][0] * pose[0][3] + result[row][1] * pose[1][3] + result[row][2] * pose[2][3]);
  }
  return result;
}

/** Convert an XYZW quaternion and translation to the row-major pose convention. */
export function poseFromQuaternionTranslation(translation: Vec3, quaternionXyzw: Vec4): Mat4 {
  const [x, y, z, w] = quaternionXyzw;
  const norm = Math.hypot(x, y, z, w);
  if (!Number.isFinite(norm) || norm < 1e-12) throw new RangeError('Pose quaternion must be finite and nonzero.');
  translation.forEach(value => finite(value, 'pose translation'));
  const qx = x / norm, qy = y / norm, qz = z / norm, qw = w / norm;
  const xx = qx * qx, yy = qy * qy, zz = qz * qz;
  const xy = qx * qy, xz = qx * qz, yz = qy * qz;
  const wx = qw * qx, wy = qw * qy, wz = qw * qz;
  return [
    [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), translation[0]],
    [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), translation[1]],
    [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), translation[2]],
    [0, 0, 0, 1],
  ];
}

/** Perspective + OpenCV radial/tangential projection with independent poses. */
export function surfaceImageMapFromCamera(
  chart: SurfaceChart,
  camera: PinholeCameraModel,
  worldFromCamera: Mat4,
  worldFromTarget: Mat4,
): SurfaceImageMap {
  assertRigidPose(worldFromCamera, 'worldFromCamera');
  assertRigidPose(worldFromTarget, 'worldFromTarget');
  if (!(camera.fx > 0) || !(camera.fy > 0) || !Number.isFinite(camera.fx) || !Number.isFinite(camera.fy) ||
      !Number.isFinite(camera.cx) || !Number.isFinite(camera.cy) || !Number.isInteger(camera.imageWidth) ||
      !Number.isInteger(camera.imageHeight)) {
    throw new RangeError('Camera intrinsics or image dimensions are invalid.');
  }
  const distortion = camera.distortion ?? [0, 0, 0, 0, 0];
  if (distortion.some(value => !Number.isFinite(value)) || !Number.isFinite(camera.skew ?? 0)) {
    throw new RangeError('Camera distortion and skew must be finite.');
  }
  const cameraFromTarget = multiply4(inverseRigid(worldFromCamera), worldFromTarget);
  const rotation = cameraFromTarget;
  const translation = [rotation[0][3], rotation[1][3], rotation[2][3]];
  const cameraCenterTarget = [0, 1, 2].map(row =>
    -(rotation[0][row] * translation[0] + rotation[1][row] * translation[1] + rotation[2][row] * translation[2]));
  const count = validateChart(chart);
  const pixelX = new Float64Array(count), pixelY = new Float64Array(count), visible = new Uint8Array(count);
  const [k1, k2, p1, p2, k3] = distortion;
  for (let index = 0; index < count; index++) {
    const offset = index * 3;
    const px = chart.points[offset], py = chart.points[offset + 1], pz = chart.points[offset + 2];
    const nx = chart.normals[offset], ny = chart.normals[offset + 1], nz = chart.normals[offset + 2];
    const x = rotation[0][0] * px + rotation[0][1] * py + rotation[0][2] * pz + translation[0];
    const y = rotation[1][0] * px + rotation[1][1] * py + rotation[1][2] * pz + translation[1];
    const z = rotation[2][0] * px + rotation[2][1] * py + rotation[2][2] * pz + translation[2];
    const toCameraX = cameraCenterTarget[0] - px;
    const toCameraY = cameraCenterTarget[1] - py;
    const toCameraZ = cameraCenterTarget[2] - pz;
    if (nx * toCameraX + ny * toCameraY + nz * toCameraZ <= 0 || z <= 0) continue;
    const xn = x / z, yn = y / z, r2 = xn * xn + yn * yn;
    const radial = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
    const xd = xn * radial + 2 * p1 * xn * yn + p2 * (r2 + 2 * xn * xn);
    const yd = yn * radial + p1 * (r2 + 2 * yn * yn) + 2 * p2 * xn * yn;
    pixelX[index] = camera.fx * xd + (camera.skew ?? 0) * yd + camera.cx;
    pixelY[index] = camera.fy * yd + camera.cy;
    visible[index] = 1;
  }
  return surfaceImageMapFromProjector(chart, camera.imageWidth, camera.imageHeight, () => ({pixelX, pixelY, visible}));
}

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface SurfaceRegionBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Bilinearly resample an RGBA source image into chart coordinates. */
export function remapSurfaceRgba(
  source: RgbaImage,
  map: SurfaceImageMap,
  sourceMask?: Uint8Array,
): {image: RgbaImage; valid: Uint8Array} {
  if (source.width !== map.imageWidth || source.height !== map.imageHeight ||
      source.data.length !== source.width * source.height * 4) {
    throw new RangeError('Source RGBA image dimensions do not match the surface map.');
  }
  if (sourceMask && sourceMask.length !== source.width * source.height) {
    throw new RangeError('Source mask must have one byte per source pixel.');
  }
  const output = new Uint8ClampedArray(map.width * map.height * 4);
  const valid = new Uint8Array(map.width * map.height);
  for (let index = 0; index < valid.length; index++) {
    if (!map.valid[index]) continue;
    const x = map.sourceX[index], y = map.sourceY[index];
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = x0 + 1, y1 = y0 + 1;
    if (sourceMask && !sourceMask[Math.round(y) * source.width + Math.round(x)]) continue;
    const dx = x - x0, dy = y - y0;
    const i00 = (y0 * source.width + x0) * 4, i10 = (y0 * source.width + x1) * 4;
    const i01 = (y1 * source.width + x0) * 4, i11 = (y1 * source.width + x1) * 4;
    const out = index * 4;
    for (let channel = 0; channel < 4; channel++) {
      const top = source.data[i00 + channel] * (1 - dx) + source.data[i10 + channel] * dx;
      const bottom = source.data[i01 + channel] * (1 - dx) + source.data[i11 + channel] * dx;
      output[out + channel] = top * (1 - dy) + bottom * dy;
    }
    valid[index] = 1;
  }
  return {image: {width: map.width, height: map.height, data: output}, valid};
}

/** Flatten a chart rectangle with row-wise cos(latitude) longitude correction. */
export function flattenSurfaceRegion(
  source: RgbaImage,
  sourceValid: Uint8Array,
  chartHeight: number,
  box: SurfaceRegionBox,
): {image: RgbaImage; valid: Uint8Array} {
  if (source.data.length !== source.width * source.height * 4 ||
      sourceValid.length !== source.width * source.height || chartHeight !== source.height) {
    throw new RangeError('Chart image, coverage mask and chart height must agree.');
  }
  if (![box.x0, box.y0, box.x1, box.y1].every(Number.isInteger) ||
      box.x0 < 0 || box.y0 < 0 || box.x1 > source.width || box.y1 > source.height ||
      box.x1 <= box.x0 || box.y1 <= box.y0) {
    throw new RangeError('Surface region must be a nonempty integer rectangle inside the chart.');
  }
  const width = box.x1 - box.x0, height = box.y1 - box.y0;
  const data = new Uint8ClampedArray(width * height * 4);
  const valid = new Uint8Array(width * height);
  for (let row = 0; row < height; row++) {
    const latitude = Math.PI / 2 - ((box.y0 + row + 0.5) / chartHeight) * Math.PI;
    const rowWidth = Math.max(1, Math.round(width * Math.cos(latitude)));
    const left = Math.floor((width - rowWidth) / 2);
    const sourceStart = box.x0;
    for (let outputX = 0; outputX < rowWidth; outputX++) {
      const intervalStart = sourceStart + outputX * width / rowWidth;
      const intervalEnd = sourceStart + (outputX + 1) * width / rowWidth;
      const center = (intervalStart + intervalEnd) / 2;
      const maskX = Math.max(box.x0, Math.min(box.x1 - 1, Math.floor(center)));
      const maskIndex = (box.y0 + row) * source.width + maskX;
      if (!sourceValid[maskIndex]) continue;
      const xBegin = Math.floor(intervalStart), xEnd = Math.ceil(intervalEnd);
      const outIndex = (row * width + left + outputX) * 4;
      const sums = [0, 0, 0, 0];
      let weightSum = 0;
      for (let sourceX = xBegin; sourceX < xEnd; sourceX++) {
        const overlap = Math.max(0, Math.min(intervalEnd, sourceX + 1) - Math.max(intervalStart, sourceX));
        if (overlap <= 0 || sourceX < box.x0 || sourceX >= box.x1) continue;
        const sourceIndex = ((box.y0 + row) * source.width + sourceX) * 4;
        for (let channel = 0; channel < 4; channel++) sums[channel] += source.data[sourceIndex + channel] * overlap;
        weightSum += overlap;
      }
      if (weightSum <= 0) continue;
      for (let channel = 0; channel < 4; channel++) data[outIndex + channel] = sums[channel] / weightSum;
      valid[row * width + left + outputX] = 1;
    }
  }
  return {image: {width, height, data}, valid};
}
