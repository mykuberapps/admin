'use client';

import React, { useState } from 'react';
import { Layers, Film, Search, Filter, Database } from 'lucide-react';

interface ContentStats {
  id: string;
  title: string;
  type: string;
  uniqueViews: number;
  totalViews: number;
  watchTimeMinutes: number;
  completionRate: number;
}

interface ContentTableProps {
  topVideos: any[];
  allMediaStats: ContentStats[];
}

export const ContentTable = ({ topVideos, allMediaStats }: ContentTableProps) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'catalog'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');

  const filteredCatalog = (allMediaStats || []).filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="col-span-12 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col font-sans">
      
      {/* Header & Controls */}
      <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
        <div>
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider font-mono">Catalog Telemetry</h2>
        </div>
        <div className="flex bg-gray-200/50 p-0.5 rounded border border-gray-200">
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'trending' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Top 10 Active
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'catalog' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Global Index ({allMediaStats?.length || 0})
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      {activeTab === 'catalog' && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3 bg-white">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Query titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="pl-8 pr-6 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer appearance-none"
            >
              <option value="ALL">All Types</option>
              <option value="MOVIE">Movies</option>
              <option value="SERIES">Series</option>
            </select>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
              {activeTab === 'trending' ? (
                <>
                  <th className="px-4 py-2.5 font-medium w-16">Rank</th>
                  <th className="px-4 py-2.5 font-medium">Entity Title</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total Executions</th>
                  <th className="px-4 py-2.5 font-medium text-right">Duration (m)</th>
                  <th className="px-4 py-2.5 font-medium">Completion Avg</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-2.5 font-medium">Entity Title</th>
                  <th className="px-4 py-2.5 font-medium">Format</th>
                  <th className="px-4 py-2.5 font-medium text-right">Unique Clients</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total Executions</th>
                  <th className="px-4 py-2.5 font-medium text-right">Duration (m)</th>
                  <th className="px-4 py-2.5 font-medium">Completion Avg</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeTab === 'trending' ? (
              topVideos.slice(0, 10).map((video: any, index: number) => (
                <tr key={video.mediaId || index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-gray-500">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-400">
                        {video.type === 'SERIES' ? <Layers size={14} /> : <Film size={14} />}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[200px]">{video.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                    {video.totalViews?.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                    {video.watchTimeMinutes?.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 rounded-sm overflow-hidden flex shrink-0">
                        <div 
                          className={`h-full ${video.completionRate > 60 ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.min(100, Math.max(0, video.completionRate))}%` }} 
                        />
                      </div>
                      <span className="font-mono text-[10px] text-gray-500 w-8">{video.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredCatalog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                      <Database size={20} className="text-gray-300" />
                      <span className="text-xs font-medium">No records match current filter criteria.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCatalog.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-400">
                          {item.type === 'SERIES' ? <Layers size={14} /> : <Film size={14} />}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded font-mono text-[9px] uppercase tracking-wider text-gray-600">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                      {item.uniqueViews?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                      {item.totalViews?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                      {item.watchTimeMinutes?.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-sm overflow-hidden flex shrink-0">
                          <div 
                            className={`h-full ${item.completionRate > 60 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, Math.max(0, item.completionRate))}%` }} 
                          />
                        </div>
                        <span className="font-mono text-[10px] text-gray-500 w-8">{item.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )
            )}
            
            {/* Empty State for Trending when no data exists */}
            {activeTab === 'trending' && (!topVideos || topVideos.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Database size={20} className="text-gray-300" />
                    <span className="text-xs font-medium">No trending data available.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};