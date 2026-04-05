import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Box, Typography, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon missing in React builds
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #ddd'
};

// Default center: Thika Town, Kenya
const center = [-1.0333, 37.0693];

// Helper component to handle click events
const MapEvents = ({ setCoords }) => {
  useMapEvents({
    click(e) {
      setCoords({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
};

// Helper component to recenter map when coords change (for Edit Mode)
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lng], map.getZoom());
    }
  }, [coords, map]);
  return null;
};

const LocationPicker = ({ coords, setCoords }) => {
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        {coords 
          ? `Selected Location: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` 
          : "Click on the map to set your workshop or item location"}
      </Typography>

      <Box sx={containerStyle}>
        <MapContainer 
          center={coords ? [coords.lat, coords.lng] : center} 
          zoom={14} 
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* OpenStreetMap Tiles (No API Key Required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapEvents setCoords={setCoords} />
          <RecenterMap coords={coords} />

          {coords && (
            <Marker position={[coords.lat, coords.lng]} />
          )}
        </MapContainer>
      </Box>
      
      <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
        Tip: Zoom in for better accuracy in Thika.
      </Typography>
    </Box>
  );
};

export default React.memo(LocationPicker);