    // src/components/MapAreaSelector.jsx
    import { MapContainer, TileLayer, FeatureGroup, useMapEvents } from "react-leaflet";
    import { EditControl } from "react-leaflet-draw";
    import "leaflet/dist/leaflet.css";
    import "leaflet-draw/dist/leaflet.draw.css";
    import { useRef, useState } from "react";

    // THRESHOLD VALUES
    const MAX_PIXELS = 2500;
    const BASE_RESOLUTION = 60; // meters per pixel

    export default function MapAreaSelector({ onAreaSelected }) {
        const fgRef = useRef(null);
        const [areaInfo, setAreaInfo] = useState({
            safe: true,
            widthPx: 0,
            heightPx: 0
        });
        const [bbox, setBbox] = useState(null);

        const updateAreaLogic = (layer) => {
            const bbox = generateBBox(layer);
            const status = checkAreaSafety(bbox);

            setAreaInfo(status);

            layer.setStyle({
                color: status.safe ? "#3388ff" : "#ef4444",
                fillColor: status.safe ? "#3388ff" : "#ef4444",
                weight: status.safe ? 3 : 5
            });

            onAreaSelected && onAreaSelected(bbox);
        };

        const clearExisting = () => {
            if (!fgRef.current) return;

            fgRef.current.clearLayers();

            setAreaInfo({ safe: true, widthPx: 0, heightPx: 0 });
        };

        // round coordinates to a certain number of decimal places
        const round = (v, decimals = 4) => Math.round(v * 10 ** decimals) / 10 ** decimals;

        // calculate if the area exceeds backend limits
        const checkAreaSafety = (bbox) => {
            if (bbox.lat_min === "" || bbox.lat_min == null) return { safe: true, widthPx: 0, heightPx: 0 };

            // distance approximation (1 deg lat approx 111.1km)
            const latDist = Math.abs(bbox.lat_max - bbox.lat_min) * 111111;
            const cosLat = Math.cos((bbox.lat_min * Math.PI) / 180);
            const lonDist = Math.abs(bbox.lon_max - bbox.lon_min) * 111111 * cosLat;

            const widthPx = Math.round(lonDist / BASE_RESOLUTION);
            const heightPx = Math.round(latDist / BASE_RESOLUTION);

            return {
                safe: widthPx <= MAX_PIXELS && heightPx <= MAX_PIXELS,
                widthPx,
                heightPx
            };
        };

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
            setBbox(bbox);
            return bbox;
        };

        const handleCreated = (e) => {
            if (e.layerType !== "rectangle") return;

            // ensure that only one rectangle is drawn
            clearExisting();

            fgRef.current.addLayer(e.layer);
            updateAreaLogic(e.layer);
        };

        const handleDeleted = () => {
            clearExisting();

            setAreaInfo({ safe: true, widthPx: 0, heightPx: 0 });
            onAreaSelected && onAreaSelected({
                lat_min: "", lon_min: "", lat_max: "", lon_max: ""
            });
        };

        const handleEdited = (e) => {
            e.layers.eachLayer((layer) => updateAreaLogic(layer));
        };

        return (
            <div className="relative border rounded-lg overflow-hidden shadow-sm">
                <MapContainer
                    center={[52, 20]}
                    zoom={6}
                    style={{ height: 352, width: "100%", marginTop: 48 }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <FeatureGroup ref={fgRef}>
                        <EditControl
                            position="topleft"
                            draw={{
                                rectangle: { showArea: false },
                                polygon: false,
                                circle: false,
                                polyline: false,
                                marker: false,
                                circlemarker: false
                            }}
                            onCreated={handleCreated}
                            onEdited={handleEdited}
                            onDeleted={handleDeleted}
                        />
                    </FeatureGroup>
                </MapContainer>

                {/* Dynamic Metadata Overlay */}
                <div className="bg-white p-3 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
                    <div className="flex items-center gap-3">
                        <span className={areaInfo.safe ? "text-blue-600" : "text-red-600 font-bold"}>
                            {areaInfo.widthPx} × {areaInfo.heightPx} px
                        </span>
                        {bbox && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className="text-gray-400">
                                    {bbox.lat_min}°, {bbox.lon_min}° → {bbox.lat_max}°, {bbox.lon_max}°
                                </span>
                            </>
                        )}
                    </div>
                    {!areaInfo.safe && (
                        <div className="bg-red-50 text-red-700 px-3 py-2 rounded border border-red-200 flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <span><strong>AREA TOO LARGE:</strong> The image might be "mosaic".</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
