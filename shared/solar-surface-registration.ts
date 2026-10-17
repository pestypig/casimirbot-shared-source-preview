import {
  surfaceImageMapFromProjector,
  type SurfaceChart,
  type SurfaceImageMap,
} from './surface-registration';

export interface SolarObserverGeometry {
  observerCarringtonLongitudeDeg:number;
  observerCarringtonLatitudeDeg:number;
  observerDistanceMeters:number;
  solarRadiusMeters:number;
}

type Header=Readonly<Record<string,unknown>>;
const RAD_TO_DEG=180/Math.PI;

function number(header:Header,key:string):number{
  const value=header[key];
  if(typeof value!=='number'||!Number.isFinite(value))throw new TypeError(`Solar WCS ${key} must be finite.`);
  return value;
}
function text(header:Header,key:string):string{
  const value=header[key];
  if(typeof value!=='string')throw new TypeError(`Solar WCS ${key} is missing.`);
  return value.trim().toUpperCase();
}
function degreesPerUnit(header:Header,axis:1|2):number{
  const unit=(typeof header[`CUNIT${axis}`]==='string'?String(header[`CUNIT${axis}`] as string):'deg').trim().toLowerCase();
  if(unit==='deg'||unit==='degree'||unit==='degrees')return 1;
  if(unit==='arcsec'||unit==='arcsecond'||unit==='arcseconds')return 1/3600;
  if(unit==='arcmin'||unit==='arcminute'||unit==='arcminutes')return 1/60;
  if(unit==='rad'||unit==='radian'||unit==='radians')return RAD_TO_DEG;
  throw new TypeError(`Unsupported solar WCS angular unit ${unit}.`);
}

function pixelMatrixDegPerPixel(header:Header):[[number,number],[number,number]]{
  const units:[number,number]=[degreesPerUnit(header,1),degreesPerUnit(header,2)];
  const hasCd=[1,2].some(row=>[1,2].some(column=>header[`CD${row}_${column}`]!==undefined));
  if(hasCd)return [[number(header,'CD1_1')*units[0],number(header,'CD1_2')*units[0]],
    [number(header,'CD2_1')*units[1],number(header,'CD2_2')*units[1]]];
  const cdelt1=number(header,'CDELT1')*units[0],cdelt2=number(header,'CDELT2')*units[1];
  const pc=(row:1|2,column:1|2)=>header[`PC${row}_${column}`]===undefined
    ?(row===column?1:0):number(header,`PC${row}_${column}`);
  return [[cdelt1*pc(1,1),cdelt1*pc(1,2)],[cdelt2*pc(2,1),cdelt2*pc(2,2)]];
}

/** Project Carrington sphere-chart points through one native helioprojective TAN WCS. */
export function solarSurfaceImageMapFromWcs(
  chart:SurfaceChart,
  imageWidth:number,
  imageHeight:number,
  wcsHeader:Header,
  observer:SolarObserverGeometry,
):SurfaceImageMap{
  if(!text(wcsHeader,'CTYPE1').startsWith('HPLN-TAN')||!text(wcsHeader,'CTYPE2').startsWith('HPLT-TAN'))
    throw new TypeError('Solar surface registration supports only HPLN-TAN / HPLT-TAN WCS axes.');
  if(Object.keys(wcsHeader).some(key=>/^(?:A|B|AP|BP)_ORDER$/.test(key)||
    /^(?:A|B|AP|BP)_\d+_\d+$/.test(key)||/^PV[12]_\d+$/.test(key)))
    throw new TypeError('Solar WCS distortion coefficients require a distortion-aware projector.');
  const crvalLon=number(wcsHeader,'CRVAL1')*degreesPerUnit(wcsHeader,1)*Math.PI/180;
  const crvalLat=number(wcsHeader,'CRVAL2')*degreesPerUnit(wcsHeader,2)*Math.PI/180;
  const [[a,b],[c,d]]=pixelMatrixDegPerPixel(wcsHeader);
  const determinant=a*d-b*c;
  if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-15)throw new TypeError('Solar WCS pixel matrix is singular.');
  const crpix1=number(wcsHeader,'CRPIX1'),crpix2=number(wcsHeader,'CRPIX2');
  const observerLon=observer.observerCarringtonLongitudeDeg*Math.PI/180;
  const observerLat=observer.observerCarringtonLatitudeDeg*Math.PI/180;
  const distance=observer.observerDistanceMeters,solarRadius=observer.solarRadiusMeters;
  if(!Number.isFinite(observerLon)||!Number.isFinite(observerLat)||Math.abs(observer.observerCarringtonLatitudeDeg)>90||
    !(distance>solarRadius&&solarRadius>0))throw new TypeError('Solar observer geometry is invalid.');
  const scale=distance/solarRadius;

  return surfaceImageMapFromProjector(chart,imageWidth,imageHeight,points=>{
    const pixelX=new Float64Array(points.length/3),pixelY=new Float64Array(points.length/3);
    const visible=new Uint8Array(points.length/3);
    const sinB=Math.sin(observerLat),cosB=Math.cos(observerLat);
    for(let index=0;index<pixelX.length;index++){
      const offset=index*3,x=points[offset],y=points[offset+1],z=points[offset+2];
      const norm=Math.hypot(x,y,z);
      if(!(norm>0))continue;
      const latitude=Math.asin(Math.max(-1,Math.min(1,y/norm)));
      const longitude=Math.atan2(z,x);
      const delta=longitude-observerLon,cosLat=Math.cos(latitude);
      const dot=cosLat*cosB*Math.cos(delta)+Math.sin(latitude)*sinB;
      // A finite-distance observer sees the surface only outside the sphere's
      // tangent cone: (observer - point) · normal > 0, or dot > R / D.
      if(dot<=1/scale)continue;
      const depth=scale-dot;
      const hpcX=cosLat*Math.sin(delta),hpcY=Math.sin(latitude)*cosB-cosLat*sinB*Math.cos(delta);
      const hpcLon=Math.atan2(hpcX,depth),hpcLat=Math.atan2(hpcY,Math.hypot(hpcX,depth));
      const deltaLon=hpcLon-crvalLon,cosHpcLat=Math.cos(hpcLat);
      const denominator=Math.sin(crvalLat)*Math.sin(hpcLat)+Math.cos(crvalLat)*cosHpcLat*Math.cos(deltaLon);
      if(!(denominator>0))continue;
      const xi=cosHpcLat*Math.sin(deltaLon)/denominator;
      const eta=(Math.cos(crvalLat)*Math.sin(hpcLat)-Math.sin(crvalLat)*cosHpcLat*Math.cos(deltaLon))/denominator;
      const planeX=xi*RAD_TO_DEG,planeY=eta*RAD_TO_DEG;
      const dx=(d*planeX-b*planeY)/determinant;
      const dy=(-c*planeX+a*planeY)/determinant;
      pixelX[index]=crpix1-1+dx;
      pixelY[index]=crpix2-1+dy;
      visible[index]=1;
    }
    return {pixelX,pixelY,visible};
  });
}
