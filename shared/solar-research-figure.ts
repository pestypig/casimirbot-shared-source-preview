import { z } from 'zod';
import { prepareSolarResearchExport, verifySolarResearchExport } from './solar-research-export';

const RECIPE = 'solar-primary-point-error-figure/1' as const;
const hash = async (text: string) => {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};
const xml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const number = (value: number) => {
  if (!Number.isFinite(value)) throw new Error('Figure coordinate overflow');
  return Number(value.toFixed(4)).toString();
};

/** Deterministic static paper figure. No interpolation, fitting or source authentication. */
export async function prepareSolarResearchFigure(bundle: unknown) {
  const verified = await verifySolarResearchExport(bundle);
  const record = verified.record;
  const comparisonBundle = await prepareSolarResearchExport(record);
  const rows = [...record.rows].sort((a, b) => a.secondQuartileRadius - b.secondQuartileRadius || a.authorRow - b.authorRow);
  const [xLow, xHigh] = record.fullKernelSupport;
  const xSpan = xHigh - xLow;
  if (!Number.isFinite(xSpan) || xSpan <= 0) throw new Error('Figure radius range overflow');
  const x = (radius: number) => 104 + (radius - xLow) / xSpan * 792;
  const text = (px: number, py: number, value: string, anchor = 'start') =>
    `<text x="${number(px)}" y="${number(py)}" text-anchor="${anchor}">${xml(value)}</text>`;
  const sections: string[] = [];
  const domains: Record<string, [number, number]> = {};

  function panel(name: 'observed' | 'residual', top: number) {
    const values = name === 'observed'
      ? rows.flatMap(row => [row.observed - row.quotedSolutionError, row.observed + row.quotedSolutionError,
        ...(row.primaryPrediction === null ? [] : [row.primaryPrediction])])
      : rows.map(row => row.residual!);
    if (!values.every(Number.isFinite)) throw new Error('Figure uncertainty or residual range overflow');
    const low = Math.min(0, ...values), high = Math.max(0, ...values);
    const span = high - low;
    const padding = Math.max(span * 0.08, 1e-8);
    const domain: [number, number] = [low - padding, high + padding];
    const range = domain[1] - domain[0];
    if (!Number.isFinite(range) || range <= 0) throw new Error('Figure vertical range overflow');
    domains[name] = domain;
    const y = (value: number) => top + 200 - (value - domain[0]) / range * 200;
    sections.push(text(100, top - 16, name === 'observed'
      ? 'Observed inversion ± quoted error; primary prediction shown only when supplied'
      : 'Observed minus primary term — incomplete diagnostic, not a goodness-of-fit score'));
    sections.push(`<rect x="100" y="${top}" width="800" height="200" fill="none" stroke="#444"/>`);
    sections.push(`<path d="M100 ${number(y(0))} H900" stroke="#888" stroke-dasharray="4 4"/>`);
    for (let tick = 0; tick <= 4; tick++) {
      const value = domain[0] + range * tick / 4;
      sections.push(text(92, y(value) + 4, value.toExponential(2), 'end'));
    }
    for (let tick = 0; tick <= 4; tick++) {
      const radius = xLow + xSpan * tick / 4;
      sections.push(text(x(radius), top + 221, radius.toFixed(4), tick === 0 ? 'start' : tick === 4 ? 'end' : 'middle'));
    }
    sections.push(text(500, top + 245, 'r / historical BP04 radius (dimensionless; 695980000 m)', 'middle'));
    sections.push(`<text transform="translate(22 ${top + 100}) rotate(-90)" text-anchor="middle">${name === 'observed' ? 'Δc² / BP04 c²' : 'Residual'} (dimensionless)</text>`);
    for (const row of rows) {
      const px = x(row.secondQuartileRadius);
      if (name === 'observed') {
        const a = y(row.observed - row.quotedSolutionError), b = y(row.observed + row.quotedSolutionError);
        sections.push(`<g data-author-row="${row.authorRow}" data-series="observation"><title>Author row ${row.authorRow}; observed ${row.observed}; quoted error ${row.quotedSolutionError}</title><path d="M${number(px)} ${number(a)} V${number(b)} M${number(px - 3)} ${number(a)} H${number(px + 3)} M${number(px - 3)} ${number(b)} H${number(px + 3)}" stroke="#222"/><circle cx="${number(px)}" cy="${number(y(row.observed))}" r="3" fill="#222"/></g>`);
        if (row.primaryPrediction !== null) sections.push(`<g data-author-row="${row.authorRow}" data-series="primary-prediction"><title>Primary prediction ${row.primaryPrediction}; no prediction uncertainty bound</title><rect x="${number(px - 3)}" y="${number(y(row.primaryPrediction) - 3)}" width="6" height="6" fill="none" stroke="#1264a3"/></g>`);
      } else sections.push(`<g data-author-row="${row.authorRow}" data-series="residual"><title>Residual ${row.residual}; no combined uncertainty bound</title><circle cx="${number(px)}" cy="${number(y(row.residual!))}" r="3" fill="#222"/></g>`);
    }
  }
  panel('observed', 100);
  if (record.modelDifference) panel('residual', 395);
  else sections.push(text(100, 408, 'Model/reference difference unavailable — predictions and residuals not plotted.'));
  const height = record.modelDifference ? 790 : 550;
  const footer = record.modelDifference ? 690 : 450;
  const metadata = {recipe: RECIPE, recordId: verified.recordId, operator: record.operator,
    operatorSha256: record.operatorSha256, fixtureOnly: record.fixtureOnly, domains,
    uncertainty: record.uncertainty, sourceIdentityAuthenticated: false, admissionAllowed: false};
  const figureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}" role="img" aria-labelledby="figure-title figure-description">
<title id="figure-title">${record.fixtureOnly ? 'UI TEST FIXTURE — ' : ''}BiSON primary-term diagnostic</title>
<desc id="figure-description">Point estimates at second-quartile localization radii, not spatially resolved measurements. Vertical bars are plus/minus quoted solution errors, not a joint confidence band. Cross terms and covariance omitted; reference profile unbound. No solver certification.</desc>
<metadata>${xml(JSON.stringify(metadata))}</metadata>
<rect width="960" height="${height}" fill="white"/><g font-family="sans-serif" font-size="13" fill="#222">
${text(100, 32, record.fixtureOnly ? 'UI TEST FIXTURE — NOT SCIENTIFIC EVIDENCE' : 'BiSON sound-speed inversion — primary-term diagnostic')}
${text(100, 55, record.modelDifference ? '● Observed ± quoted error     □ Supplied primary prediction (no uncertainty bound)' : '● Observed ± quoted error; no model prediction')}
${sections.join('\n')}
${text(100, footer, 'Localization uses second quartiles; horizontal kernel widths are not plotted.')}
${text(100, footer + 21, 'Cross terms omitted; BP04 reference unbound; covariance and systematic errors unavailable.')}
${text(100, footer + 42, 'No fit score, source authentication, G1 admission or stellar lifetime claim.')}
${text(100, footer + 63, verified.recordId)}
</g></svg>`;
  const manifest = {...metadata, schemaVersion: 'solar-research-figure-manifest/1',
    figureSha256: await hash(figureSvg), recordSha256: verified.recordId.slice('solar-primary:'.length),
    width: 960, height, coordinate: record.coordinate, referenceRadiusM: record.referenceRadiusM,
    fullKernelSupport: record.fullKernelSupport, rows: rows.length,
    observation: record.observation, kernels: record.kernels, modelDifference: record.modelDifference,
    predictionUncertainty: 'not_bound', residualUncertainty: 'not_bound',
    display: 'unconnected_points_at_second_quartile_with_quoted_vertical_errors',
    publicationPerformed: false, scienceRunAllowed: false};
  return {schemaVersion: 'solar-research-figure-bundle/1' as const, comparisonBundle, figureSvg,
    figureManifestJson: JSON.stringify(manifest, null, 2)};
}

const FigureBundleSchema = z.object({schemaVersion: z.literal('solar-research-figure-bundle/1'),
  comparisonBundle: z.unknown(), figureSvg: z.string().max(150_000), figureManifestJson: z.string().max(10_000)}).strict();

export async function verifySolarResearchFigure(input: unknown) {
  const bundle = FigureBundleSchema.parse(input);
  const expected = await prepareSolarResearchFigure(bundle.comparisonBundle);
  if (bundle.figureSvg !== expected.figureSvg || bundle.figureManifestJson !== expected.figureManifestJson)
    throw new Error('Solar research figure integrity or recipe mismatch');
  return {recordId: expected.comparisonBundle.recordId, figureIntegrityVerified: true as const,
    sourceIdentityAuthenticated: false as const, admissionAllowed: false as const};
}
