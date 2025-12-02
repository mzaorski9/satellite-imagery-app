// src/components/MapAreaSelector.jsx
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useRef } from "react";

export default function MapAreaSelector({ onAreaSelected }) {
    const fgRef = useRef(null);

    // clear layers 
    const clearExisting = () => {
        const fg = fgRef.current;
        if (!fg) return;
        fg.clearLayers();
    }
    // round coordinates to a certain number of decimal places
    const round = (v, decimals = 4) => Math.round(v * 10 ** decimals) / 10 ** decimals;

    const generateBBox = (layer) => {
        if (!layer || typeof layer.getBounds !== 'function') {
            console.log("Invalid layer object provided. Cannot get bounds.");
            return null;
        }
        const bounds = layer.getBounds();
        const sw = bounds.getSouthWest();  // guarantees min lat/lng
        const ne = bounds.getNorthEast();  // guarantees max lat/lng
        
        const bbox = {
            lat_min: round(sw.lat, 4),
            lon_min: round(sw.lng, 4),
            lat_max: round(ne.lat, 4),
            lon_max: round(ne.lng, 4)
        };
        return bbox;
    }
    
    const handleCreated = (e) => {
        if (e.layerType !== "rectangle") return;
        const layer = e.layer;
        // ensure that only one rectangle is drawn
        clearExisting();
        fgRef.current.addLayer(layer);

        const bbox = generateBBox(layer)

        onAreaSelected && onAreaSelected(bbox)
    };

    const handleDeleted = (e) => {
      const bbox = {
            lat_min: "",
            lon_min: "",
            lat_max: "",
            lon_max: ""
        };
        onAreaSelected && onAreaSelected(bbox)        
    }

    const handleEdited = (e) => {
        e.layers.eachLayer(layer => {
            const bbox = generateBBox(layer);
            if (bbox) {
                onAreaSelected && onAreaSelected(bbox)        
            }
        })
    };

  return (
    <MapContainer center={[52, 20]} zoom={6} style={{ height: 400, width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FeatureGroup ref={fgRef}>
        <EditControl
          position="topleft"
          draw={{
            rectangle: {
                showArea: false
            },
            polygon: false,
            circle: false,
            polyline: false,
            marker: false,
            circlemarker: false
          }}
          //edit={{ edit: true, remove: true }}
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
        />
      </FeatureGroup>
    </MapContainer>
  );
}
