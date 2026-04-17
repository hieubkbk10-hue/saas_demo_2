'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamically import map components (Leaflet doesn't support SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

type Location = {
  lat: number;
  lng: number;
  address: string;
};

type OpenStreetMapDisplayProps = {
  location: Location;
  height?: string;
  zoom?: number;
};

export default function OpenStreetMapDisplay({
  location,
  height = '300px',
  zoom = 15,
}: OpenStreetMapDisplayProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      void import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, []);

  if (!isClient) {
    return (
      <div className="bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border" style={{ height }}>
        <div className="text-center">
          <MapPin size={32} className="mx-auto mb-2" />
          <span className="text-sm">{location.address || 'Đang tải bản đồ...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="relative z-0 rounded-xl overflow-hidden border">
      <MapContainer
        center={[location.lat, location.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[location.lat, location.lng]}>
          <Popup>{location.address}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
