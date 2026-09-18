import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface DocumentUploadFieldProps {
  label: string;
  fileUrl: string;
  fileSize: string;
  onChange: (fileUrl: string, fileSize: string) => void;
  helperText?: string;
  maxSizeMb?: number;
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  fileUrl,
  fileSize,
  onChange,
  helperText = 'Solo se admiten documentos en formato PDF',
  maxSizeMb = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    // 1. Validate MIME type or file extension
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('El archivo seleccionado debe ser un documento PDF válido.');
      return;
    }

    // 2. Validate file size (e.g. 5 MB max for site performance)
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`El archivo excede el límite permitido de ${maxSizeMb} MB (${(file.size / (1024 * 1024)).toFixed(2)} MB). Por favor optimice o comprima su PDF antes de subirlo.`);
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);

    try {
      // 3. Convert to Base64 data URL
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const formattedSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        onChange(base64String, formattedSize);
        setFileName(file.name);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setErrorMsg('Error al leer el archivo PDF.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando el documento.');
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
    onChange('', '');
    setFileName(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasValue = fileUrl && fileUrl !== '#';

  return (
    <div className="space-y-2" id="document-upload-field-container">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          {label}
        </label>
        {hasValue && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {fileSize || 'PDF'}
          </span>
        )}
      </div>

      {!hasValue ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Procesando PDF...</p>
            </div>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                <Upload className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-200">
                  Arrastra tu archivo PDF aquí o <span className="text-blue-400 underline">búscalo</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  {helperText} (máx. {maxSizeMb} MB)
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {fileName || 'Documento PDF Adjunto'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {fileSize || 'Listo para guardar'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
              title="Cambiar archivo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors"
              title="Quitar archivo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 flex items-start gap-1.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
