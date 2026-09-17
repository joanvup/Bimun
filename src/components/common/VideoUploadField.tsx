import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Video as VideoIcon, X, Check } from 'lucide-react';

interface VideoUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  maxSizeMb?: number;
}

export const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  maxSizeMb = 5, // Prioritizing optimization (max 5MB by default)
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('El archivo seleccionado debe ser un video válido (MP4, WebM, etc.)');
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxSizeMb) {
      setErrorMsg(`El video pesa ${sizeMb.toFixed(1)}MB. Para optimizar el sitio, el tamaño máximo permitido es de ${maxSizeMb}MB.`);
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg('Error al leer el archivo de video');
      setIsProcessing(false);
    };
    
    reader.onload = () => {
      onChange(reader.result as string);
      setFileDetails({
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
      });
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <VideoIcon className="w-3.5 h-3.5 text-blue-400" />
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              activeTab === 'upload' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              activeTab === 'url' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Enlace Web
          </button>
        </div>
      </div>

      {activeTab === 'url' ? (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="url"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => {
              onChange(e.target.value);
              setFileDetails(null);
            }}
            placeholder="https://ejemplo.com/video.mp4"
            className="block w-full pl-9 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>
      ) : (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative overflow-hidden ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : errorMsg
                ? 'border-red-500/50 bg-red-500/5 hover:bg-red-500/10'
                : 'border-slate-700 bg-slate-900/50 hover:bg-slate-800'
            }`}
          >
            <div className="space-y-2 text-center relative z-10">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-blue-400 font-medium">Procesando video...</p>
                </div>
              ) : value.startsWith('data:') && fileDetails ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-emerald-400 font-medium">{fileDetails.name}</div>
                  <div className="text-[10px] text-slate-400">{(fileDetails.sizeKb / 1024).toFixed(2)} MB</div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Eliminar video
                  </button>
                </div>
              ) : (
                <>
                  <Upload
                    className={`mx-auto h-8 w-8 ${errorMsg ? 'text-red-400' : 'text-slate-400'}`}
                  />
                  <div className="flex text-sm text-slate-400 justify-center">
                    <span className="relative rounded-md font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      Subir archivo
                    </span>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-slate-500">MP4, WebM (Máx. {maxSizeMb}MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>
          {errorMsg && <p className="mt-2 text-xs text-red-400 flex items-center gap-1">{errorMsg}</p>}
        </div>
      )}

      {(helperText || activeTab === 'url') && !errorMsg && (
        <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
          {helperText} {activeTab === 'url' && value && !value.startsWith('data:') && ' Se está usando un video desde una URL externa.'}
        </p>
      )}
    </div>
  );
};
