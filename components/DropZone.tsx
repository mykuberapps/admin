"use client";

import React, { useState, useRef } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle, FileText, HardDrive } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  maxSize?: number; // in bytes
}

export default function DropZone({ onFileSelect, accept = "*", label = "production file", maxSize }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File) => {
    if (maxSize && file.size > maxSize) {
      setError(`ERR_FILE_SIZE: Payload exceeds threshold. Maximum allowed: ${Math.round(maxSize / (1024 * 1024))} MB.`);
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative w-full min-h-[160px] flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        ${selectedFile && !error ? 'border-green-500 bg-green-50/30' : ''}
        ${error ? 'border-red-400 bg-red-50/50' : ''}
      `}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept={accept}
        onChange={handleFileInput}
      />

      <div className="flex flex-col items-center text-center w-full max-w-lg z-10">
        {!selectedFile ? (
          <>
            <div className={`p-3 rounded-md mb-4 transition-colors ${isDragging ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
              <UploadCloud size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-900">
                Drop <span className="uppercase font-mono text-xs text-gray-600 bg-gray-200 px-1 py-0.5 rounded mx-1">{label}</span> payload here
              </h3>
              <p className="text-xs text-gray-500">or click to browse local filesystem</p>
            </div>
            
            <div className="flex items-center gap-4 mt-6 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              {accept !== "*" && (
                <span className="flex items-center gap-1.5"><FileText size={12} /> Accepts: {accept}</span>
              )}
              {maxSize && (
                <span className="flex items-center gap-1.5"><HardDrive size={12} /> Max Size: {formatSize(maxSize)}</span>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded bg-green-100 border border-green-200 text-green-700 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1 w-full">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wider font-mono">Payload Staged</p>
              <h3 className="text-sm font-mono text-gray-900 truncate px-4" title={selectedFile.name}>
                {selectedFile.name}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {formatSize(selectedFile.size)}
              </p>
            </div>
            <button 
              onClick={clearFile}
              className="mt-5 px-3 py-1.5 bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <X size={14} /> Detach File
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs font-mono w-full max-w-md mx-auto text-left">
            <AlertCircle size={14} className="shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}