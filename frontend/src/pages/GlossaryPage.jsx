
export default function Glossary() {
    return (
            <div className="mx-auto w-full max-w-4xl px-4">
                <div className="bg-white p-6 shadow-md rounded-lg">
                    <h1 className="text-5xl font-bold mb-10">Glossary</h1>

                    {/* Navigation */}
                    <nav className="mb-6">
                        <ul className="flex flex-wrap gap-2">
                            {[
                                ["NDVI", "ndvi"],
                                ["NDMI", "ndmi"],
                                ["Sentinel-2", "sentinel"],
                                ["Bands", "bands"],
                                ["Heatmap", "heatmap"],
                                ["Cloud Cover", "cloudcover"],
                                ["Quality Control", "qc"],
                                ["Change Detection", "changedetection"],
                                ["Raster", "raster"],
                                ["Vector data", "vector"],
                                ["Resolution", "resolution"],
                                ["AOI", "aoi"],
                                ["Dates & time range", "dates"],
                            ].map(([label, id]) => (
                                <li key={id}>
                                    <a
                                        href={`#${id}`}
                                        className="rounded bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                                    >
                                        {label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Sections */}
                    <Section id="ndvi" title="NDVI — Normalized Difference Vegetation Index">
                        <p>
                            <strong>What it is:</strong> a numeric index showing how healthy and dense vegetation is.
                        </p>
                        <p>
                            <strong>How it works:</strong> compares near-infrared (NIR) and red light.
                            Healthy plants reflect more NIR and absorb red light.
                        </p>
                        <p>
                            <strong>Typical values:</strong> close to <em>1.0</em> = healthy vegetation;
                            around <em>0</em> = bare soil; negative values = water or clouds.
                        </p>
                        <p>
                            <strong>Use cases:</strong> deforestation monitoring (detecting forest loss
                            over time), crop health assessment (identifying stressed or failing crops
                            before harvest), drought impact analysis (mapping vegetation decline during
                            dry seasons), urban green space tracking, and post-disaster recovery
                            monitoring (e.g. regrowth after wildfires).
                        </p>
                        <p>
                            <strong>Why generate a heatmap:</strong> a single NDVI image shows the current
                            state of vegetation. A heatmap (comparison of two periods) reveals <em>where
                            and how much</em> vegetation has changed — for example, comparing July 2022
                            vs July 2023 can pinpoint exactly which forest areas were cleared, which
                            fields recovered after drought, or where urban expansion replaced green areas.
                        </p>
                    </Section>

                    <Section id="ndmi" title="NDMI — Normalized Difference Moisture Index">
                        <p>
                            <strong>What it is:</strong> a numeric index measuring the water content
                            stored in vegetation canopy, using near-infrared (NIR) and shortwave
                            infrared (SWIR) bands.
                        </p>
                        <p>
                            <strong>How it works:</strong> healthy, well-watered plants absorb more
                            SWIR and reflect more NIR. As vegetation dries out, SWIR reflectance
                            increases and the index drops.
                        </p>
                        <p>
                            <strong>Typical values:</strong> close to <em>1.0</em> = very high moisture;
                            around <em>0</em> = moderate; negative values = dry, stressed or bare areas.
                        </p>
                        <p>
                            <strong>Use cases:</strong> drought stress detection (identifying water-stressed
                            crops and forests before visible damage occurs), wildfire risk assessment
                            (dry vegetation with low NDMI is highly flammable), irrigation monitoring
                            (verifying whether agricultural areas are receiving adequate water),
                            flood aftermath analysis (mapping areas of abnormally high moisture after
                            flooding events), and forest health monitoring (detecting moisture loss
                            caused by pest infestations or disease).
                        </p>
                        <p>
                            <strong>Why generate a heatmap:</strong> a single NDMI image shows current
                            moisture levels across an area. A heatmap comparison reveals how moisture
                            conditions have shifted between two periods — for example, comparing NDMI
                            before and after a wildfire shows not just which areas burned, but how far
                            the heat stress spread into surrounding vegetation that survived. Similarly,
                            comparing the same month across two different years can pinpoint exactly
                            which agricultural zones lost moisture during a drought and by how much —
                            information that a single snapshot cannot provide. That's useful for insurance 
                            assessments, replanting decisions, or predicting which stressed areas might 
                            catch fire next.
                        </p>
                    </Section>

                    <Section id="sentinel" title="Sentinel-2">
                        <p>
                            <strong>What it is:</strong> a free European satellite mission (ESA Copernicus
                            programme) providing high-resolution multispectral imagery of the Earth's surface.
                        </p>
                        <p>
                            <strong>Resolution:</strong> 10–60 meters per pixel depending on the spectral
                            band. Most vegetation and moisture indices use 20–60 m bands.
                        </p>
                        <p>
                            <strong>Revisit time:</strong> approximately every 5 days over the same location,
                            which is why a date range of at least 5–10 days is recommended.
                        </p>
                        <p>
                            <strong>Why it matters:</strong> its multispectral bands (NIR, Red, SWIR etc.)
                            are the raw input for computing NDVI, NDMI, NDWI and similar indices.
                        </p>
                    </Section>

                    <Section id="bands" title="Spectral Bands">
                        <p>
                            Sentinel-2 captures light across multiple wavelength ranges called bands.
                            Each band measures how much light of a specific wavelength is reflected
                            by the Earth's surface. Different materials (water, soil, vegetation)
                            reflect light differently across bands — this is what makes indices like
                            NDVI and NDMI possible.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                                <strong>B02 — Blue (490 nm):</strong> used for water body detection
                                and atmospheric correction.
                            </li>
                            <li>
                                <strong>B03 — Green (560 nm):</strong> sensitive to vegetation
                                vigour. Used in NDWI (water index).
                            </li>
                            <li>
                                <strong>B04 — Red (665 nm):</strong> absorbed by chlorophyll in
                                healthy plants. Used in NDVI as the denominator band.
                            </li>
                            <li>
                                <strong>B08 — Near-Infrared / NIR (842 nm):</strong> strongly
                                reflected by healthy vegetation. Core band in NDVI and NDMI.
                            </li>
                            <li>
                                <strong>B11 — Shortwave Infrared / SWIR (1610 nm):</strong> absorbed
                                by water in plant tissue. Used in NDMI to measure moisture content.
                            </li>
                            <li>
                                <strong>B12 — Shortwave Infrared / SWIR (2190 nm):</strong> sensitive
                                to soil moisture and burn severity. Used in NBR (Normalized Burn Ratio).
                            </li>
                            <li>
                                <strong>SCL — Scene Classification Layer:</strong> not a spectral band
                                but a pre-computed quality map. Classifies each pixel as clear, cloud,
                                cloud shadow, water, snow etc. Used by this app to mask out unusable
                                pixels before computing indices.
                            </li>
                        </ul>
                    </Section>

                    <Section id="heatmap" title="Heatmap">
                        <p>
                            <strong>What it is:</strong> a color-coded visualization showing the magnitude
                            of change between two satellite images. Each pixel's color represents how much
                            the index value increased or decreased.
                        </p>
                        <p>
                            <strong>Color scale:</strong> blue tones indicate a decrease (e.g. vegetation
                            loss, drying); red tones indicate an increase. White or neutral means no
                            significant change.
                        </p>
                    </Section>
    
                    <Section id="cloudcover" title="Cloud Cover">
                        <p>
                            <strong>What it is:</strong> the percentage of a satellite scene obscured by
                            clouds. Sentinel-2 is an optical satellite — it cannot see through clouds,
                            so cloudy pixels contain no usable data.
                        </p>
                        <p>
                            <strong>How it affects your results:</strong> high cloud cover produces large
                            areas of missing data (shown as white patches in the output image). This app
                            filters out cloudy pixels using the Scene Classification Layer (SCL) and
                            composites the clearest pixels across your selected date range.
                        </p>
                        <p>
                            <strong>What to do:</strong> if your result has too many missing pixels, try
                            extending the date range or selecting a different season. Summer months
                            (June–August) typically have lower cloud cover in temperate regions.
                        </p>
                    </Section>

                    <Section id="qc" title="Quality Control (QC)">
                        <p>
                            <strong>What it is:</strong> an automated check applied to every result before
                            it is saved. It measures the percentage of missing pixels and the size of the
                            largest continuous data gap.
                        </p>
                        <p>
                            <strong>Possible outcomes:</strong>
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                                <strong>Pass:</strong> image quality is sufficient. Result is saved as-is.
                            </li>
                            <li>
                                <strong>Warning:</strong> moderate missing data detected. Gaps are filled
                                using nearest-neighbour interpolation and a warning is shown alongside
                                the result.
                            </li>
                            <li>
                                <strong>Failed:</strong> too much missing data to produce a reliable result.
                                Try a wider date range or a less cloudy period.
                            </li>
                        </ul>
                    </Section>

                    <Section id="changedetection" title="Change Detection & Comparison">
                        <p>
                            <strong>What it is:</strong> a method of identifying differences in land cover
                            or environmental conditions between two time periods by subtracting one index
                            image from another pixel by pixel.
                        </p>
                        <p>
                            <strong>How it works:</strong> the app computes the index for Period A and
                            Period B separately, then calculates the difference. Positive values indicate
                            an increase (e.g. vegetation growth), negative values indicate a decrease
                            (e.g. deforestation or drought).
                        </p>
                        <p>
                            <strong>Best practice:</strong> compare the same calendar month across
                            different years (e.g. June 2022 vs June 2023) to avoid seasonal variation
                            being mistaken for real change.
                        </p>
                    </Section>               
                    <Section id="raster" title="Raster">
                        <p>
                            <strong>What it is:</strong> a grid of pixels where each cell stores a numeric
                            value — such as an NDVI score or raw reflectance. All satellite imagery is
                            raster data.
                        </p>
                        <p>
                            <strong>In this app:</strong> the output images (NDVI, NDMI maps) are rasters
                            where pixel brightness and color represent the index value at that location.
                        </p>
                    </Section>

                    <Section id="vector" title="Vector data">
                        <p>
                            <strong>What it is:</strong> geographic data represented as geometric shapes —
                            points, lines, or polygons — rather than pixels.
                        </p>
                        <p>
                            <strong>In this app:</strong> the rectangle you draw on the map is a vector
                            polygon. It defines the <strong>Area of Interest</strong> which is then used
                            to clip the satellite raster data before computing indices.
                        </p>
                    </Section>
                    
                    <Section id="resolution" title="Resolution (meters per pixel)">
                        <p>
                            <strong>What it means:</strong> how large one pixel is on the ground.
                        </p>
                        <p>
                            Example: 10 m resolution means one pixel represents a 10 × 10 m area.
                            Smaller values = more detail.
                        </p>
                    </Section>

                    <Section id="aoi" title="AOI — Area Of Interest">
                        <p>
                            <strong>What it is:</strong> the area you draw on the map for analysis.
                        </p>
                        <p>
                            Satellite data is clipped to this area before computing indices.
                        </p>
                    </Section>

                    <Section id="dates" title="Dates & Time Range">
                        <p>
                            <strong>Why dates are needed:</strong> Satellites (like Sentinel-2) pass over a specific location 
                            approximately every 5 days. We use a date range to find the clearest, cloud-free pixels within that window.
                        </p>

                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li>
                                <strong>Precise Range (1–7 days):</strong> Best if you know the exact date of a satellite pass. 
                                High risk of "No Data" if the area was covered by clouds during that single week.
                            </li>
                            <li>
                                <strong>Recommended Range (10–21 days):</strong> 
                                <span className="text-green-700 font-semibold"> Optimal for most analyses. </span> 
                                Covers 2–4 satellite passes, providing the best chance for a cloud-free image while 
                                maintaining a consistent snapshot of surface conditions.
                            </li>
                            <li>
                                <strong>Extended Range (4–6 weeks):</strong> Use this in very cloudy regions (e.g., tropics). 
                                Note: Results may appear "smoothed" as surface conditions can change over a longer period, 
                                reducing the precision of the snapshot.
                            </li>
                        </ul>

                        <p className="mt-3 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                            <strong>Comparison advice:</strong> When using the <strong>Compare</strong> feature, 
                            try to keep the duration (number of days) identical for both periods (e.g., 14 days in June 
                            vs. 14 days in July) to ensure a fair and accurate change detection regardless of the index used.
                        </p>
                    </Section>
                </div>
            </div>
    );
}

/* add a bottom line between terms, hide on last item */
function Section({ id, title, children }) {
    return (
        <section
            id={id}
            className="mb-6 border-b border-gray-200 pb-4 last:border-0 last:mb-0"
        >
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <div className="space-y-2 text-gray-700 text-sm">{children}</div>
        </section>
    );
}
