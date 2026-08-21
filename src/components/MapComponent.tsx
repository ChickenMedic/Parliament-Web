import { useMemo, useRef, useEffect, useState } from 'react';
import { MapContainer, ZoomControl, GeoJSON, useMap, useMapEvents, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import stringSimilarity from 'string-similarity';
import baseRidingsData from '../data/ridings_insets_final.json';
import politiciansData from '../data/politicians.json';
import rolesMap from '../data/roles.json';

const hexToRgba = (hex: string, alpha: number) => {
  if (!hex || hex === '#808080') return `rgba(128, 128, 128, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getPartyColor = (party: string) => {
  switch (party.toLowerCase()) {
    case 'liberal': return '#d71920';
    case 'conservative': return '#1a4782';
    case 'ndp': return '#f37021';
    case 'bloc': return '#33b2cc';
    case 'green': return '#3d9b35';
    default: return '#808080';
  }
};

const normalizeName = (name: string) => {
  return name.toLowerCase()
    .replace(/—|-/g, ' ')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const MapController = ({ selectedMP, geoJsonRef, ridingToLayerMap, lastMapClick }: {selectedMP: any, geoJsonRef: any, ridingToLayerMap: any, lastMapClick: any}) => {
  const map = useMap();
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (selectedMP && geoJsonRef.current && ridingToLayerMap.current) {
      const targetLayer = ridingToLayerMap.current.get(selectedMP.url);

      if (targetLayer) {
        if (Date.now() - lastMapClick.current < 500) {
           return;
        }

        const bounds = targetLayer.getBounds();
        const currentCenter = map.getCenter();
        const targetCenter = bounds.getCenter();
        
        if (currentCenter.distanceTo(targetCenter) > 200000) {
           map.flyTo(targetCenter, 7, { duration: 0.45 });
        } else {
           map.panTo(targetCenter, { animate: true, duration: 0.25 });
        }
        
        setTimeout(() => {
           targetLayer.openPopup();
        }, 450);
      }
    }
  }, [selectedMP, map, geoJsonRef, ridingToLayerMap, lastMapClick]);

  return null;
};

const createTextIcon = (text: string) => {
  return L.divIcon({
    className: 'inset-tooltip-marker',
    html: `<div>${text}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    // Force centering and size recalculation on initial load
    const initTimeout = setTimeout(() => {
      map.invalidateSize();
      const isMobile = window.innerWidth < 1024;
      map.fitBounds([
        [41.6751, -141.0], 
        [isMobile ? 68.0 : 83.1106, -52.6]
      ], { animate: false });
    }, 250);

    let timeout: any;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(initTimeout);
      clearTimeout(timeout);
    };
  }, [map]);
  return null;
};

export const MapComponent = ({ selectedMP, setSelectedMP }: {selectedMP: any, setSelectedMP: (mp: any) => void}) => {
  const bounds: LatLngBoundsExpression = [
    [10.0, -180.00], 
    [89.0, -20.00]   
  ];

  const politicians = politiciansData.objects;
  const geoJsonRef = useRef<any>(null);
  const ridingToLayerMap = useRef<Map<string, any>>(new Map());
  const lastMapClick = useRef<number>(0);
  const hoveredLayerRef = useRef<any>(null);
  const selectedMPRef = useRef<any>(selectedMP);

  useEffect(() => {
    selectedMPRef.current = selectedMP;
  }, [selectedMP]);

  const ridingMap = useMemo(() => {
    const pList = politicians.map((p: any) => ({ norm: normalizeName(p.current_riding.name.en), mp: p }));
    const rNames = Array.from(new Set(baseRidingsData.features.map((f: any) => normalizeName(f.properties.name)))) as string[];
    
    const manualOverrides: Record<string, string> = {
      'dauphin swan river neepawa': 'riding mountain',
      'charleswood st james assiniboia headingley': 'winnipeg west',
      'timmins james bay': 'kapuskasing timmins mushkegowuk',
      'manicouagan': 'cote nord kawawachikamach nitassinan',
      'lambton kent middlesex': 'middlesex london',
      'rimouski neigette temiscouata les basques': 'rimouski la matapedia',
      'montarville': 'mont saint bruno lacadie',
      'bonavista burin trinity': 'terra nova the peninsulas',
      'new brunswick southwest': 'saint john st croix',
      'york simcoe': 'new tecumseth gwillimbury',
      'elgin middlesex london': 'elgin st thomas london south',
      'red deer mountain view': 'ponoka didsbury',
      'algoma manitoulin kapuskasing': 'brampton chinguacousy park',
      'avignon la mitis matane matapedia': 'les pays den haut',
      'st johns south mount pearl': 'cape spear'
    };

    const pairs: {r: string, p: any, score: number}[] = [];
    for (const r of rNames) {
      for (const p of pList) {
        let score = stringSimilarity.compareTwoStrings(r, p.norm);
        
        if (manualOverrides[r] === p.norm) {
          score = 1.0;
        }

        const rWords = r.split(' ');
        const pWords = p.norm.split(' ');
        const intersect = rWords.filter(w => w.length > 3 && pWords.includes(w)).length;
        score += intersect * 0.2;
        pairs.push({ r, p: p.mp, score });
      }
    }
    
    pairs.sort((a, b) => b.score - a.score);
    
    const assignedRidings = new Set();
    const assignedMPs = new Set();
    const map = new Map<string, any>();
    
    for (const pair of pairs) {
       if (!assignedRidings.has(pair.r) && !assignedMPs.has(pair.p.url)) {
          map.set(pair.r, pair.p);
          assignedRidings.add(pair.r);
          assignedMPs.add(pair.p.url);
       }
    }
    return map;
  }, [politicians]);

  const getMPForRiding = (rName: string) => {
    return ridingMap.get(rName) || null;
  };

  const [insetConfigs] = useState<Record<string, any>>({
    Vancouver: { targetLat: 45, targetLon: -134, scale: 9, center: [-123.1, 49.25] },
    Edmonton: { targetLat: 44, targetLon: -114, scale: 10, center: [-113.5, 53.5] },
    Calgary: { targetLat: 37, targetLon: -114, scale: 10, center: [-114.0, 51.0] },
    Winnipeg: { targetLat: 42, targetLon: -97, scale: 10, center: [-97.1, 49.8] },
    Toronto: { targetLat: 32, targetLon: -84, scale: 9, center: [-79.4, 43.7] },
    Ottawa: { targetLat: 34, targetLon: -74, scale: 9, center: [-75.7, 45.4] },
    Montreal: { targetLat: 36, targetLon: -64, scale: 9, center: [-73.6, 45.5] },
    'Quebec City': { targetLat: 38, targetLon: -54, scale: 9, center: [-71.2, 46.8] },
    Halifax: { targetLat: 40, targetLon: -44, scale: 10, center: [-63.6, 44.6] }
  });

  const [insetTops, setInsetTops] = useState<Record<string, number>>({});
  const [insetBottoms, setInsetBottoms] = useState<Record<string, number>>({});

  const ridingsGeojson = useMemo(() => {
    const baseFeatures = baseRidingsData.features.filter((f: any) => !f.properties.isInset);
    const data = { ...baseRidingsData, features: JSON.parse(JSON.stringify(baseFeatures)) } as any;
    const newFeatures: any[] = [];
    
    const tops: Record<string, number> = {};
    const bottoms: Record<string, number> = {};
    data.features.forEach((f: any) => {
      if (!f.geometry || !f.geometry.coordinates) return;
      let minX=180, maxX=-180, minY=90, maxY=-90;
      const processCoords = (coords: any) => {
        if (typeof coords[0] === 'number') {
          minX = Math.min(minX, coords[0]); maxX = Math.max(maxX, coords[0]);
          minY = Math.min(minY, coords[1]); maxY = Math.max(maxY, coords[1]);
        } else {
          coords.forEach(processCoords);
        }
      };
      processCoords(f.geometry.coordinates);
      const cx = (minX + maxX)/2;
      const cy = (minY + maxY)/2;
      
      // Allow a bit larger max bounds so we don't accidentally skip Hamilton which might be slightly larger
      if ((maxX - minX) > 0.4 || (maxY - minY) > 0.4) return;

      Object.entries(insetConfigs).forEach(([cityName, config]) => {
        let inBounds = Math.abs(cx - config.center[0]) < 0.3 && Math.abs(cy - config.center[1]) < 0.3;
        
        if (cityName === 'Toronto') {
          inBounds = Math.abs(cx - config.center[0]) < 0.6 && Math.abs(cy - config.center[1]) < 0.6;
          const name = f.properties.name.toLowerCase();
          if (name.includes('st. catharines') || name.includes('niagara') || name.includes('barrie') || name.includes('ajax') || name.includes('whitby') || name.includes('oshawa')) {
            inBounds = false;
          }
        }

        if (inBounds) {
          const clone = JSON.parse(JSON.stringify(f));
          clone.properties.isInset = true;
          clone.properties.insetName = cityName;
          clone.properties.insetScale = config.scale;
          
          let maxTransformedY = -90;
          let minTransformedY = 90;
          const transform = (coords: any) => {
            if (typeof coords[0] === 'number') {
               coords[0] = config.targetLon + (coords[0] - config.center[0]) * config.scale;
               coords[1] = config.targetLat + (coords[1] - config.center[1]) * config.scale;
               if (coords[1] > maxTransformedY) maxTransformedY = coords[1];
               if (coords[1] < minTransformedY) minTransformedY = coords[1];
            } else {
               coords.forEach(transform);
            }
          };
          transform(clone.geometry.coordinates);
          
          if (!tops[cityName] || maxTransformedY > tops[cityName]) {
             tops[cityName] = maxTransformedY;
          }
          if (!bottoms[cityName] || minTransformedY < bottoms[cityName]) {
             bottoms[cityName] = minTransformedY;
          }
          
          newFeatures.push(clone);
        }
      });
    });
    setTimeout(() => {
      setInsetTops(tops);
      setInsetBottoms(bottoms);
    }, 0);
    
    data.features.push(...newFeatures);
    return data as any;
  }, [insetConfigs]);

  useEffect(() => {
     if (geoJsonRef.current) {
        geoJsonRef.current.eachLayer((layer: any) => {
           const ridingName = normalizeName(layer.feature.properties.name);
           const mp = getMPForRiding(ridingName);
           const isSelected = selectedMP && mp && mp.url === selectedMP.url;
           const isInset = layer.feature.properties.isInset;
           
           layer.setStyle({
             fillColor: mp ? getPartyColor(mp.current_party.short_name.en) : '#222',
             weight: isSelected ? 3 : (isInset ? 0.5 : 1),
             opacity: 1,
             color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
             fillOpacity: isSelected ? 1 : 0.75,
             className: isSelected ? 'pulse-riding' : ''
           });
           if (isSelected && layer.bringToFront) {
             layer.bringToFront();
           }
        });
     }
  }, [selectedMP, geoJsonRef]);

  const styleFeature = (feature: any) => {
    const ridingName = normalizeName(feature.properties.name);
    const mp = getMPForRiding(ridingName);
    const isSelected = selectedMPRef.current && mp && mp.url === selectedMPRef.current.url;
    const isInset = feature.properties.isInset;
    
    return {
      fillColor: mp ? getPartyColor(mp.current_party.short_name.en) : '#222',
      weight: isSelected ? 3 : (isInset ? 0.5 : 1),
      opacity: 1,
      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)',
      fillOpacity: isSelected ? 1 : 0.75,
      className: isSelected ? 'pulse-riding' : ''
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const ridingName = normalizeName(feature.properties.name);
    const mp = getMPForRiding(ridingName);

    if (!feature.properties.isInset && mp) {
       ridingToLayerMap.current.set(mp.url, layer);
    }

    if (mp) {
      const party = mp ? mp.current_party.short_name.en : 'Unknown';
      const role = mp ? ((rolesMap as any)[mp.name] || `Member of Parliament for ${mp.current_riding.name.en}`) : 'Unknown';
      const popupContent = `
        <div style="font-family: 'Outfit', sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; color: white;">${feature.properties.name}</h3>
          
          <div style="display: flex; gap: 12px; align-items: center; background-color: ${hexToRgba(getPartyColor(party), 0.15)}; padding: 12px; margin: 0 -16px; border-top: 1px solid ${getPartyColor(party)}40; border-bottom: 1px solid ${getPartyColor(party)}40;">
            <img src="https://openparliament.ca${mp.image}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(mp.name)}&background=random&color=fff'" style="width: 48px; aspect-ratio: 8 / 11; border-radius: 10px; object-fit: cover; object-position: center 10%; border: 2px solid ${getPartyColor(party)};" />
            <div>
              <strong style="font-size: 15px; color: white;">${mp.name}</strong><br/>
              <span style="color: ${getPartyColor(party)}; font-weight: bold; font-size: 13px;">${party}</span>
            </div>
          </div>

          <div style="margin-top: 12px; font-size: 13px; color: #ccc;">
            <p style="margin: 2px 0;"><strong>Role:</strong> <span style="color: white;">${role}</span></p>
            <p style="margin: 2px 0;"><strong>Elected:</strong> Last Election (2025)</p>
            <p style="margin: 2px 0;"><strong>Next Election:</strong> On or before Oct 2029</p>
            <p style="margin: 2px 0;"><strong>Contact:</strong> <a href="mailto:${mp.name.replace(' ', '.').toLowerCase()}@parl.gc.ca" style="color: #3b82f6;">${mp.name.replace(' ', '.').toLowerCase()}@parl.gc.ca</a></p>
          </div>
          
          <div style="margin-top: 12px;">
            <a href="https://openparliament.ca${mp.url}" target="_blank" style="background: ${hexToRgba(getPartyColor(party), 0.8)}; color: white; text-decoration: none; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 13px; display: block; text-align: center; border: 1px solid ${getPartyColor(party)};">Learn More</a>
          </div>
        </div>
      `;
      layer.bindPopup(popupContent);
    } else {
      layer.bindPopup(`<b>${feature.properties.name}</b><br/>MP data not found.`);
    }

    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        
        // Force cleanup of any previously hovered layer that skipped the mouseout event
        if (hoveredLayerRef.current && hoveredLayerRef.current !== l) {
           geoJsonRef.current.resetStyle(hoveredLayerRef.current);
        }
        hoveredLayerRef.current = l;

        if (!selectedMP || !mp || mp.url !== selectedMP.url) {
           l.setStyle({ fillOpacity: 0.9, weight: 2, color: 'rgba(255,255,255,0.8)' });
           l.bringToFront();
        }
        // Always ensure the selected item stays visibly on top!
        if (selectedMP && ridingToLayerMap.current.has(selectedMP.url)) {
           ridingToLayerMap.current.get(selectedMP.url).bringToFront();
        }
      },
      mouseout: (e: any) => {
        const l = e.target;
        if (hoveredLayerRef.current === l) {
           hoveredLayerRef.current = null;
        }
        if (!selectedMP || !mp || mp.url !== selectedMP.url) {
           geoJsonRef.current.resetStyle(l);
        }
      },
      click: () => {
         lastMapClick.current = Date.now();
         if (mp) {
            setSelectedMP(mp);
         } else {
            setSelectedMP(null);
         }
      }
    });
  };

  // SVG renderer with padding so it draws off-screen polygons, preventing flash, but allowing CSS classes.
  const svgRenderer = useMemo(() => L.svg({ padding: 0.5 }), []);

  const InsetLabels = () => {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());
    
    useMapEvents({
      zoomend: (e) => setZoom(e.target.getZoom()),
    });

    if (zoom <= 3.5) {
      return (
         <Marker 
           position={[20, -100]} 
           icon={L.divIcon({
             className: 'cities-header-marker',
             html: `<div style="font-size: 4em; color: rgba(255,255,255,0.15); font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; white-space: nowrap; text-align: center; margin-left: -50%; transform: translate(-50%, -50%); position: absolute; pointer-events: none;">CITIES</div>`,
             iconSize: [0, 0],
             iconAnchor: [0, 0]
           })} 
         />
      );
    }

    return (
      <>
        {Object.entries(insetConfigs).map(([cityName, config]) => {
           const isBottom = cityName === 'Ottawa' || cityName === 'Quebec City';
           const posLat = isBottom 
             ? (insetBottoms[cityName] ? insetBottoms[cityName] - 2.5 : config.targetLat - 3.5)
             : (insetTops[cityName] ? insetTops[cityName] + 0.3 : config.targetLat + 1.2);

           return (
             <Marker 
               key={cityName} 
               position={[posLat, config.targetLon]} 
               icon={createTextIcon(cityName)} 
             />
           );
        })}
      </>
    );
  };



  // Safe initial bounds for Canada
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 1024;
  const canadaBounds: LatLngBoundsExpression = [
    [41.6751, -141.0], 
    [isMobileInitial ? 68.0 : 83.1106, -52.6]
  ];

  return (
    <div className="map-container" style={{ background: '#0f172a' }}>
      <MapContainer 
        bounds={canadaBounds}
        minZoom={2}
        maxBounds={bounds}
        maxBoundsViscosity={0.2}
        bounceAtZoomLimits={false}
        renderer={svgRenderer}
        style={{ height: '100%', width: '100%', background: 'transparent' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <MapResizer />
        
        <GeoJSON 
          ref={geoJsonRef}
          data={ridingsGeojson} 
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
        <MapController selectedMP={selectedMP} geoJsonRef={geoJsonRef} ridingToLayerMap={ridingToLayerMap} lastMapClick={lastMapClick} />
        
        <InsetLabels />
      </MapContainer>

    </div>
  );
};
