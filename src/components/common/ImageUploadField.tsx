import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, RefreshCw } from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor.ts';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
  maxDimensions?: { width: number; height: number };
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  helperText,
  maxDimensions = { width: 1400, height: 1400 },
  aspectRatio = 'auto',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; sizeKb: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('El archivo seleccionado debe ser una imagen válida (PNG, JPG, WEBP, etc.)');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const result = await compressImage(
        file,
        maxDimensions.width,
        maxDimensions.height,
        0.85
      );
      onChange(result.dataUrl);
      setFileDetails({
        name: file.name,
        sizeKb: result.sizeKb,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando la imagen');
    } finally {
      setIsProcessing(false);
    }
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
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Subir archivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pegar URL
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
            className="hidden"
            onChange={handleFileChange}
          />

          {!value ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-white dark:bg-slate-950/60 hover:bg-slate-50 dark:hover:bg-slate-900/60'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 py-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Optimizando imagen...</span>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Haz clic para explorar en tu equipo
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      o arrastra y suelta tu imagen aquí (PNG, JPG, WEBP)
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden p-2 flex items-center gap-3">
              <img
                src={value}
                alt="Vista previa"
                className={`rounded-lg object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${
                  aspectRatio === 'square'
                    ? 'w-16 h-16'
                    : aspectRatio === 'banner'
                    ? 'w-24 h-14'
                    : 'w-16 h-14'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {fileDetails?.name || 'Imagen cargada'}
                </p>
                {fileDetails && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tamaño optimizado: ~{fileDetails.sizeKb} KB
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Cambiar archivo
                  </button>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <input
              type="url"
              value={value}
              placeholder="https://ejemplo.com/imagen.jpg"
              onChange={(e) => onChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {value && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 flex items-center gap-3">
              <img
                src={value}
                alt="Vista previa URL"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex-1">{value}</p>
            </div>
          )}
        </div>
      )}

      {errorMsg && <p className="text-[11px] text-rose-600 dark:text-rose-400">{errorMsg}</p>}
      {helperText && <p className="text-[10px] text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
};
