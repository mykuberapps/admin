import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Globe2, Map, Database } from 'lucide-react';

const geoUrlWorld = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const geoUrlIndia = "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json";

interface GeoMapsProps {
  geoStats: any[];
}

export const GeoMaps = ({ geoStats }: GeoMapsProps) => {
  if (!geoStats || geoStats.length === 0) {
    return (
      <div className="col-span-12 lg:col-span-8 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col h-full min-h-[300px]">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Geospatial Telemetry</h2>
          <Globe2 size={14} className="text-gray-400" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500">
          <Database size={24} className="mb-2 text-gray-300" />
          <span className="text-xs font-medium">Insufficient geospatial data</span>
        </div>
      </div>
    );
  }

  const countryStats = geoStats.reduce((acc: any, curr: any) => {
    if (curr.country) acc[curr.country] = (acc[curr.country] || 0) + curr.views;
    return acc;
  }, {});

  const indiaStats = geoStats.reduce((acc: any, curr: any) => {
    if (curr.country === 'IN' && curr.state) acc[curr.state] = (acc[curr.state] || 0) + curr.views;
    return acc;
  }, {});

  const maxCountryViews = Math.max(...(Object.values(countryStats) as number[]), 1);
  const maxIndiaViews = Math.max(...(Object.values(indiaStats) as number[]), 1);

  // Professional data-viz color scales for light mode
  const colorScaleWorld = scaleLinear<string>().domain([0, maxCountryViews]).range(["#eff6ff", "#1d4ed8"]); // blue-50 to blue-700
  const colorScaleIndia = scaleLinear<string>().domain([0, maxIndiaViews]).range(["#fff7ed", "#b45309"]); // orange-50 to amber-700

  return (
    <div className="col-span-12 lg:col-span-8 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col font-sans h-full">
      
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Geospatial Telemetry</h2>
        <Globe2 size={14} className="text-gray-400" />
      </div>

      <div className="p-4 flex-1 flex flex-col sm:flex-row gap-4">
        
        {/* Global Distribution Map */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Globe2 size={12} className="text-gray-500" />
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider font-mono">Global Matrix</h3>
          </div>
          <div className="flex-1 relative bg-[#f8f9fa] flex items-center justify-center p-2">
            <ComposableMap projectionConfig={{ scale: 130 }} className="w-full h-full max-h-[250px]">
              <Geographies geography={geoUrlWorld}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const d = countryStats[geo.properties.ISO_A2] || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={d > 0 ? colorScaleWorld(d) : "#e5e7eb"} // gray-200 for empty
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#3b82f6", outline: "none", cursor: "crosshair" },
                          pressed: { outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

        {/* Domestic (India) Distribution Map */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Map size={12} className="text-gray-500" />
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider font-mono">Domestic Matrix (IN)</h3>
          </div>
          <div className="flex-1 relative bg-[#f8f9fa] flex items-center justify-center p-2">
            <ComposableMap projection="geoMercator" projectionConfig={{ scale: 800, center: [80, 22] }} className="w-full h-full max-h-[250px]">
              <Geographies geography={geoUrlIndia}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const stateName = geo.properties.name || geo.properties.NAME_1 || geo.properties["hc-key"];
                    const d = indiaStats[stateName] || 0;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={d > 0 ? colorScaleIndia(d) : "#e5e7eb"} // gray-200 for empty
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#f59e0b", outline: "none", cursor: "crosshair" },
                          pressed: { outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

      </div>
    </div>
  );
};