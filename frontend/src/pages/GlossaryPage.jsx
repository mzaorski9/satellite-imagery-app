import React from "react";

export default function Glossary() {
    const containerStyle = { maxWidth: 980, margin: "24px auto", padding: 16, lineHeight: 1.5, fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" };
    const navListStyle = { display: "flex", gap: 10, flexWrap: "wrap", padding: 0, margin: "0 0 18px 0", listStyle: "none" };
    const navLinkStyle = { color: "#1a73e8", textDecoration: "none", padding: "6px 10px", borderRadius: 6, background: "rgba(26,115,232,0.06)" };
    const cardStyle = { border: "1px solid #e6e9ef", padding: 14, borderRadius: 10, background: "#fff", boxShadow: "0 1px 2px rgba(16,24,40,0.03)", marginBottom: 12 };
    const headingStyle = { fontSize: 28, marginBottom: 12 };
    const sectionTitleStyle = { fontSize: 18, margin: "0 0 8px 0" };
    const smallNoteStyle = { marginTop: 16, color: "#666", fontSize: 13 };

    return (
        <div style={containerStyle}>
            <h1 style={headingStyle}>Remote Sensing Glossary</h1>
            <p style={{ marginBottom: 12, color: "#444" }}>
                Short, user-friendly explanations for terms used in this app. Click a term to jump to its section.
            </p>

            <nav style={{ marginBottom: 8 }}>
                <ul style={navListStyle}>
                    <li><a style={navLinkStyle} href="#ndvi">NDVI</a></li>
                    <li><a style={navLinkStyle} href="#ndwi">NDWI</a></li>
                    <li><a style={navLinkStyle} href="#sentinel">Sentinel‑2</a></li>
                    <li><a style={navLinkStyle} href="#heatmap">Heatmap</a></li>
                    <li><a style={navLinkStyle} href="#raster">Raster</a></li>
                    <li><a style={navLinkStyle} href="#vector">Vector data</a></li>
                    <li><a style={navLinkStyle} href="#resolution">Resolution</a></li>
                    <li><a style={navLinkStyle} href="#aoi">AOI</a></li>
                </ul>
            </nav>

            <article id="ndvi" style={cardStyle}>
                <h2 style={sectionTitleStyle}>NDVI — Normalized Difference Vegetation Index</h2>
                <p><strong>What it is:</strong> a simple numeric index that shows how healthy and dense vegetation is in satellite imagery.</p>
                <p><strong>How it works:</strong> it uses near-infrared (NIR) and red bands. Healthy plants reflect NIR strongly and absorb red, so the comparison tells us plant vigor.</p>
                <p><strong>Typical values:</strong> close to <em>1.0</em> = dense healthy vegetation; around <em>0</em> = bare soil; negative = water/clouds/buildings.</p>
            </article>

            <article id="ndwi" style={cardStyle}>
                <h2 style={sectionTitleStyle}>NDWI — Normalized Difference Water Index</h2>
                <p><strong>What it is:</strong> an index that highlights water bodies and moisture. It uses green and NIR bands to separate water from vegetation and land.</p>
                <p><strong>Use cases:</strong> flood mapping, detecting lakes/rivers, monitoring changes in water extent.</p>
            </article>

            <article id="sentinel" style={cardStyle}>
                <h2 style={sectionTitleStyle}>Sentinel‑2</h2>
                <p><strong>What it is:</strong> a free European satellite mission (Copernicus) that provides multispectral imagery at medium-high resolution (typically 10–60 m per pixel).</p>
                <p><strong>Why it matters:</strong> it has multiple spectral bands (red, green, blue, NIR, SWIR) used to compute NDVI, NDWI and other indices.</p>
            </article>

            <article id="heatmap" style={cardStyle}>
                <h2 style={sectionTitleStyle}>Heatmap</h2>
                <p><strong>What it is:</strong> a colored overlay showing intensity of a measurement (e.g. change magnitude or density). Colors help visualise where values are high/low.</p>
            </article>

            <article id="raster" style={cardStyle}>
                <h2 style={sectionTitleStyle}>Raster</h2>
                <p><strong>What it is:</strong> a pixel-based image (like a photo) coming from a satellite. Each pixel stores a numeric value (for example NDVI values or raw band reflectance).</p>
            </article>

            <article id="vector" style={cardStyle}>
                <h2 style={sectionTitleStyle}>Vector data</h2>
                <p><strong>What it is:</strong> user-drawn geometric shapes: points, lines and polygons. In this app you use polygons or rectangles to mark the Area of Interest (AOI) to process.</p>
            </article>

            <article id="resolution" style={cardStyle}>
                <h2 style={sectionTitleStyle}>Resolution (meters per pixel)</h2>
                <p><strong>What it means:</strong> how big one pixel is on the ground. For example 10 m resolution means each pixel covers a 10×10 m square. Smaller numbers = more detail.</p>
            </article>

            <article id="aoi" style={cardStyle}>
                <h2 style={sectionTitleStyle}>AOI — Area Of Interest</h2>
                <p><strong>What it is:</strong> the map area you select (draw) for analysis. The app will clip satellite data to this area and compute the chosen index for it.</p>
            </article>

            <article id="extras" style={{ ...cardStyle, marginTop: 10 }}>
                <h2 style={sectionTitleStyle}>Other useful terms</h2>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li><strong>Cloud mask / coverage</strong> — clouds block the ground; cloudy pixels are detected and usually ignored when computing indices.</li>
                    <li><strong>Time series</strong> — looking at the same AOI over many dates to see trends (growth, deforestation, flooding, etc.).</li>
                    <li><strong>Georeferencing</strong> — ensuring every pixel has a real-world coordinate so results align with maps and GPS coordinates.</li>
                </ul>
            </article>

            <footer style={smallNoteStyle}>
                Tip: if a term is unclear while using the app, come back to this page — it was written to help you interpret the maps and results quickly.
            </footer>
        </div>
    );
    }
