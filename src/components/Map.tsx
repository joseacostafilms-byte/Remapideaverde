import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Initiative } from '@/src/types';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Leaf } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for leaflet default icon issues in some bundlers
const customIconMarkup = renderToStaticMarkup(
  <div className="bg-brand-primary p-2 rounded-full shadow-lg border-2 border-white text-white">
    <Leaf size={18} />
  </div>
);

const customIcon = L.divIcon({
  html: customIconMarkup,
  className: 'custom-leaflet-icon',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

interface MapProps {
  initiatives: Initiative[];
  onSelectInitiative?: (initiative: Initiative) => void;
  center?: [number, number];
  zoom?: number;
}

function CenterMap({ center, zoom }: { center?: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function AppMap({ initiatives, onSelectInitiative, center, zoom = 4 }: MapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) return <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />;

  const initialCenter: [number, number] = center || [23.6345, -102.5528]; // Default to Mexico center

  return (
    <MapContainer 
      center={initialCenter} 
      zoom={zoom} 
      className="w-full h-full shadow-inner rounded-xl"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CenterMap center={center} zoom={zoom} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
      >
        {initiatives.map((initiative) => (
          <Marker 
            key={initiative.id} 
            position={[initiative.lat, initiative.lng]} 
            icon={customIcon}
            eventHandlers={{
              click: () => onSelectInitiative?.(initiative),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1">
                <h3 className="font-bold text-brand-primary">{initiative.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{initiative.category} • {initiative.scope}</p>
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={`https://flagcdn.com/w20/${initiative.country.toLowerCase()}.png`} 
                    alt={initiative.country} 
                    className="w-5 h-auto rounded-sm"
                  />
                  <span className="text-xs font-semibold">{initiative.country}</span>
                </div>
                <p className="text-sm line-clamp-2 mb-3">{initiative.description}</p>
                <button 
                  onClick={() => onSelectInitiative?.(initiative)}
                  className="w-full py-2 bg-brand-primary text-white text-xs rounded-lg hover:bg-brand-secondary transition-colors"
                  id={`view-details-${initiative.id}`}
                >
                  Ver Detalles
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
