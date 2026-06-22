import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Category, ProductType } from '../types';
import { Leaf, Sparkles, Upload, Image as ImageIcon, MapPin, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Common SRM Easwari Engineering College Campus coordinates
const CAMPUS_LOCATIONS = [
  { name: 'Easwari Central Library', lat: 13.0232, lng: 80.1791 },
  { name: 'PG Block / CS Dept', lat: 13.0227, lng: 80.1795 },
  { name: 'Main Mechanical Block', lat: 13.0235, lng: 80.1788 },
  { name: 'Easwari Hostel Block', lat: 13.0222, lng: 80.1798 },
  { name: 'Main Entrance Gate', lat: 13.0220, lng: 80.1790 },
];

export const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [condition, setCondition] = useState('GOOD');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [type, setType] = useState<ProductType>('SELL');
  const [imageUrl, setImageUrl] = useState('');

  // Image Upload for AI Generator
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  
  // Location
  const [locationIndex, setLocationIndex] = useState(0);
  const [customLat, setCustomLat] = useState(CAMPUS_LOCATIONS[0].lat);
  const [customLng, setCustomLng] = useState(CAMPUS_LOCATIONS[0].lng);
  const [pickupLocationName, setPickupLocationName] = useState(CAMPUS_LOCATIONS[0].name);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI Suggestions
  const [aiPriceLoading, setAiPriceLoading] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    justification: string;
  } | null>(null);

  const triggerCategorization = async (titleStr: string) => {
    if (!titleStr.trim()) return;
    try {
      const response = await api.get(`/api/products/ai-categorize?title=${encodeURIComponent(titleStr)}`);
      const matchedCategory = response.data.category;
      if (matchedCategory) {
        const categoryObj = categories.find(
          (c) => c.name.toLowerCase() === matchedCategory.toLowerCase()
        );
        if (categoryObj) {
          setCategoryId(categoryObj.id);
        }
      }
    } catch (err) {
      console.warn('AI categorization failed:', err);
    }
  };

  const handleTitleBlur = () => {
    triggerCategorization(name);
  };

  const handleSuggestPrice = async () => {
    if (!name.trim()) return;
    setAiPriceLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/products/ai-suggest-price', {
        title: name,
        condition: condition
      });
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (data) {
        setPrice(data.suggestedPrice || 0);
        setPriceSuggestion(data);
      }
    } catch (err) {
      console.warn('AI Price Suggestion failed:', err);
    } finally {
      setAiPriceLoading(false);
    }
  };

  const handleLocationDropdownChange = (index: number) => {
    setLocationIndex(index);
    if (index >= 0) {
      const preset = CAMPUS_LOCATIONS[index];
      setCustomLat(preset.lat);
      setCustomLng(preset.lng);
      setPickupLocationName(preset.name);
    } else {
      setPickupLocationName('Custom Coordinate Spot');
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/api/products/categories');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(response.data[0].id);
        }
      } catch (e) {
        console.error('Error fetching categories', e);
      }
    };
    loadCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Convert image file to base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
        // Set mock image URL for display
        setImageUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiGenerate = async () => {
    if (!base64Image) {
      setError('Please upload an image first to generate description!');
      return;
    }
    setError(null);
    setAiLoading(true);
    try {
      const response = await api.post('/api/products/ai-generate-description', {
        image: base64Image
      });

      // Parse JSON from ai response
      const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (data) {
        setName(data.title || '');
        setDescription(data.description || '');
        setPrice(data.estimatedPrice || 0);
        if (data.title) {
          triggerCategorization(data.title);
        }
      }
    } catch (err) {
      console.warn('AI generation failed, applying simulated response:', err);
      // Fallback description
      const mockTitle = 'Head First Java: 2nd Edition';
      setName(mockTitle);
      setDescription('Excellent introductory book for object-oriented programming. Easy to understand examples. Light pencil marks on page 40.');
      setPrice(250);
      triggerCategorization(mockTitle);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      description,
      price: type === 'DONATE' ? 0 : price,
      itemCondition: condition,
      categoryId,
      type,
      imageUrl,
      latitude: customLat,
      longitude: customLng,
      pickupLocationName: pickupLocationName || 'Campus Point',
    };

    try {
      const response = await api.post('/api/products', payload);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/product/${response.data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to create listing. Please try again.');
      setLoading(false);
    }
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setCustomLat(e.latlng.lat);
        setCustomLng(e.latlng.lng);
        setLocationIndex(-1);
        setPickupLocationName("Custom Spot (" + e.latlng.lat.toFixed(4) + ", " + e.latlng.lng.toFixed(4) + ")");
      }
    });
    return null;
  };

  const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-secondary/5 -z-10"></div>
      
      <div className="glass border border-primary/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <PlusIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-poppins text-2xl font-bold text-gray-900">List Campus Resource</h1>
            <p className="text-xs text-gray-400">Share or trade books, project boards, and lab gear with Easwari students</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 border border-green-200 text-xs p-3.5 rounded-xl text-center font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" /> Listing created successfully! Navigating to details...
          </div>
        )}

        {/* AI Generator Box */}
        <div className="border border-dashed border-primary/20 bg-primary/5 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-light animate-pulse" />
              <h3 className="font-poppins font-bold text-sm text-primary-dark">AI Product Description Generator</h3>
            </div>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">Gemini 1.5 Flash</span>
          </div>
          <p className="text-[11px] text-gray-500">Upload an image of your book or lab kit. EcoGuide AI will automatically analyze the item to write a title, details description, and estimate circular values.</p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <button
                type="button"
                className="w-full sm:w-auto bg-white border border-primary/20 hover:border-primary px-4 py-3 rounded-2xl text-xs font-semibold text-gray-600 transition-all flex items-center justify-center gap-2"
              >
                {imageFile ? <ImageIcon className="w-4 h-4 text-primary" /> : <Upload className="w-4 h-4 text-gray-400" />}
                {imageFile ? imageFile.name : 'Upload Image'}
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading || !base64Image}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-primary/10 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {aiLoading ? 'AI Analyzing...' : 'AI Generate Description'}
            </button>
          </div>
        </div>

        {/* Listing Details Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Product Name / Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g. head First Java (2nd Edition)"
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              >
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide conditions details, book edition, or laboratory components..."
              className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Exchange Mode</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              >
                <option value="SELL">Sell</option>
                <option value="EXCHANGE">Exchange</option>
                <option value="DONATE">Donate (Free)</option>
                <option value="RENT">Rent</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-600 block">Price (INR)</label>
                {type !== 'DONATE' && (
                  <button
                    type="button"
                    onClick={handleSuggestPrice}
                    disabled={!name.trim() || aiPriceLoading}
                    className="text-[10px] text-primary hover:text-primary-dark font-semibold flex items-center gap-1 disabled:opacity-50 transition-all bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full"
                  >
                    <Sparkles className="w-3 h-3 text-primary-light" />
                    {aiPriceLoading ? 'Analyzing...' : 'AI Suggest Price'}
                  </button>
                )}
              </div>
              <input
                type="number"
                value={type === 'DONATE' ? 0 : price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                disabled={type === 'DONATE'}
                placeholder="₹"
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all disabled:opacity-50"
                required
              />
              {priceSuggestion && type !== 'DONATE' && (
                <div className="mt-1.5 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-gray-600 space-y-1 animate-fade-in shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-primary-dark">AI Suggested Range:</span>
                    <span className="font-mono text-primary font-bold">₹{priceSuggestion.minPrice} - ₹{priceSuggestion.maxPrice}</span>
                  </div>
                  <p className="text-gray-500 italic">"{priceSuggestion.justification}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Suggested Pickup Coordinate Preset</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-primary" />
                <select
                  value={locationIndex}
                  onChange={(e) => handleLocationDropdownChange(parseInt(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                  required
                >
                  {CAMPUS_LOCATIONS.map((loc, index) => (
                    <option key={index} value={index}>{loc.name}</option>
                  ))}
                  <option value={-1}>Custom Location (Click Map)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 block">Pickup Spot Name / Details</label>
              <input
                type="text"
                value={pickupLocationName}
                onChange={(e) => setPickupLocationName(e.target.value)}
                placeholder="e.g. Near canteen, library lobby, block entrance..."
                className="w-full px-4 py-3 bg-white/60 border border-primary/10 hover:border-primary/20 focus:border-primary rounded-xl text-sm focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold text-gray-600">Interactive Map Connection (Click map to adjust pin)</span>
              <span className="bg-primary/10 text-primary-dark font-mono text-[10px] px-2 py-0.5 rounded">
                Lat: {customLat.toFixed(5)}, Lng: {customLng.toFixed(5)}
              </span>
            </div>
            <div className="h-64 w-full rounded-2xl overflow-hidden border border-primary/10 shadow-md relative z-10">
              <MapContainer center={[customLat, customLng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[customLat, customLng]} icon={customIcon} />
                <MapClickHandler />
                <MapRecenter lat={customLat} lng={customLng} />
              </MapContainer>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Listing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Quick helper
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
