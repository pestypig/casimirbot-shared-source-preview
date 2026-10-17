import {verifySolarResearchExport} from './solar-research-export';
import {z} from 'zod';

const solution='893d75b6c30729902ef169bdc08166cc600b212857e1ddcc025087cb59aff226';
const kernels='027e2853299eee5aa34818149deb3a4bd51cf93c12fc5b2a525f14641fad344e';
const bibtex='@article{Basu2009SolarCore,\n  author = {Basu, Sarbani and Chaplin, William J. and Elsworth, Yvonne and New, Roger and Serenelli, Aldo M.},\n  title = {Fresh insights on the structure of the solar core},\n  journal = {The Astrophysical Journal},\n  volume = {699},\n  pages = {1403--1417},\n  year = {2009},\n  doi = {10.1088/0004-637X/699/2/1403},\n  eprint = {0905.0651},\n  archivePrefix = {arXiv},\n  url = {https://arxiv.org/abs/0905.0651v2}\n}\n';
async function hash(text:string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),
    value=>value.toString(16).padStart(2,'0')).join('');
}

/** Local citation context only; existing comparison IDs and numerical recipes are unchanged. */
export async function prepareSolarResearchLiterature(bundle:unknown) {
  const {record,recordId}=await verifySolarResearchExport(bundle);
  if(record.fixtureOnly || record.observation.kind!=='author_data' || record.kernels.kind!=='author_data' ||
    record.observation.sha256!==solution || record.kernels.sha256!==kernels)return undefined;
  const manifest={schemaVersion:'solar-research-literature-context/1',recordId,
    observationId:record.observation.id,kernelId:record.kernels.id,
    observationSha256:solution,kernelSha256:kernels,
    relation:'published_method_and_row_alignment_context',
    paper:{title:'Fresh insights on the structure of the solar core',citation:'Basu et al. (2009)',
      arxivVersion:'0905.0651v2',url:'https://arxiv.org/abs/0905.0651v2',doi:'10.1088/0004-637X/699/2/1403',
      journal:'The Astrophysical Journal 699, 1403–1417 (2009)',location:'Section III and Table 3 (BiSON-13)'},
    associationBasis:'declared_author_file_hashes_and_local_intake_row_alignment_audit',
    intakeAudit:'docs/research/controlled-stellar-composition-transport-g1-basu-author-intake-2026-09-24.md',
    distinction:'This record uses relative delta c squared / BP04 c squared author-file solutions, not the absolute sound speed and density columns of Table 3.',
    limitations:['author kernel-file identity caveat remains','paper context is not numerical source authentication',
      'density, cross terms, exact BP04 reference and joint uncertainty remain unbound',
      'citation does not grant author-data redistribution rights','paper does not validate this intervention or a lifetime extension'],
    sourceIdentityAuthenticated:false,scientificAdmission:false,scienceRunAllowed:false,
    redistributionPermissionGranted:false,bibtexSha256:await hash(bibtex)};
  const manifestJson=JSON.stringify(manifest,null,2);
  return {associationId:`solar-literature:${await hash(manifestJson)}`,manifestJson,bibtex};
}

const SidecarSchema=z.object({associationId:z.string().regex(/^solar-literature:[a-f0-9]{64}$/),
  manifestJson:z.string().max(16_000),bibtex:z.string().max(8_000)}).strict();
export async function verifySolarResearchLiterature(bundle:unknown,input:unknown) {
  const sidecar=SidecarSchema.parse(input);
  const expected=await prepareSolarResearchLiterature(bundle);
  if(!expected || sidecar.associationId!==expected.associationId || sidecar.manifestJson!==expected.manifestJson || sidecar.bibtex!==expected.bibtex)
    throw new Error('Research literature context identity or recipe mismatch');
  return {associationId:expected.associationId,recordId:JSON.parse(expected.manifestJson).recordId as string,
    artifactIntegrityVerified:true as const,sourceIdentityAuthenticated:false as const,scientificAdmission:false as const};
}
