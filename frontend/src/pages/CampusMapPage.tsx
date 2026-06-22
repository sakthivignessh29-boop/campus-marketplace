import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Product } from '../types';
import { MapPin, Info, ArrowRight, BookOpen, Compass } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Setup standard marker icon from CDN to avoid relative-path assets breakage
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const CampusMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/products');
        // Filter items containing valid coordinates
        const hasCoords = response.data.filter((p: Product) => p.latitude && p.longitude);
        setProducts(hasCoords);
      } catch (e) {
        console.error('Failed to load item coordinates', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // SRM Easwari Engineering College campus center coordinates
  const campusCenter: [number, number] = [13.0229, 80.1793];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 h-[calc(100vh-80px)] flex flex-col">
      <div>
        <h1 className="font-poppins text-2xl font-extrabold text-gray-900 flex items-center gap-1.5">
          <Compass className="w-6 h-6 text-primary animate-float" /> Campus Circular Map
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm">Find resource exchange locations and pickup points on OpenStreetMap.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column Map Legend & list */}
        <div className="lg:col-span-4 glass border border-primary/10 rounded-3xl overflow-hidden flex flex-col shadow-lg p-5 space-y-4">
          <h2 className="font-poppins font-bold text-sm text-primary-dark">Active Pickup Coordinates</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 divide-y divide-primary/5">
            {loading ? (
              <div className="text-center text-xs text-gray-400 py-10">Searching coordinates...</div>
            ) : products.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-10">No items with active pickup points listed.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400 truncate flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-primary" /> {p.pickupLocationName || 'Campus Point'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="p-1.5 bg-primary/10 hover:bg-primary text-primary-dark hover:text-white rounded-lg transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border border-primary/10 rounded-2xl p-4 bg-primary/5 flex gap-2 text-xs text-gray-500 items-start">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <h4 className="font-bold text-primary-dark">Safety Notice</h4>
              <p className="text-[10px] leading-relaxed mt-0.5">Always organize item pickups at designated public spots (departments, libraries, or hostel guards) during daylight hours.</p>
            </div>
          </div>
        </div>

        {/* Right Column Map Canvas */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-primary/10 shadow-lg relative z-10">
          <MapContainer center={campusCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {products.map((p) => (
              <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={customIcon}>
                <Popup>
                  <div className="text-xs font-semibold space-y-2 p-1">
                    <span className="text-[8px] bg-primary/10 text-primary-dark font-extrabold px-1.5 py-0.5 rounded uppercase">{p.type}</span>
                    <h4 className="font-bold text-gray-900 mt-1">{p.name}</h4>
                    <p className="text-gray-500 font-medium">Pickup: {p.pickupLocationName || 'Campus Center'}</p>
                    <p className="text-primary font-black mt-1">Cost: {p.type === 'DONATE' ? 'FREE' : `₹${p.price}`}</p>
                    <button
                      onClick={() => navigate(`/product/${p.id}`)}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-1.5 rounded-lg font-bold text-[10px] mt-2 block transition-all"
                    >
                      View Product Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

      </div>
    </div>
  );
};
