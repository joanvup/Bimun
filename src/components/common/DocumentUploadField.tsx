import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Check, RefreshCw, AlertCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface DocumentUploadFieldProps {
  label: string;
  fileUrl: string;
  fileSize?: string;
  onChange: (fileUrl: string, fileSize?: string) => void;
  helperText?: string;
  maxSizeMb?: number;
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  fileUrl,
  fileSize,
  onChange,
  helperText = 'Solo se admiten documentos en formato PDF',
  maxSizeMb = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>(
    fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) ? 'url' : 'upload'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    // 1. Validate MIME type or file extension
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('El archivo seleccionado debe ser un documento PDF válido (.pdf).');
      return;
    }

    // 2. Validate file size
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`El archivo excede el límite permitido de ${maxSizeMb} MB (${(file.size / (1024 * 1024)).toFixed(2)} MB). Por favor optimice o comprima su PDF.`);
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

  const hasValue = Boolean(fileUrl && fileUrl.trim() !== '' && fileUrl !== '#');
  const isExternalUrl = Boolean(fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')));

  return (
    <div className="space-y-2" id="document-upload-field-container">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Subir archivo PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pegar enlace URL
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div>
          {!hasValue ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2 ${
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
                <div className="flex flex-col items-center space-y-2 py-2">
                  <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                  <p className="text-xs font-semibold text-slate-300">Procesando archivo PDF...</p>
                </div>
              ) : (
                <>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-200">
                      Arrastra tu archivo PDF aquí o <span className="text-blue-400 underline">haz clic para examinar</span>
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
                    {fileName || (isExternalUrl ? fileUrl.split('/').pop() || 'Documento PDF' : 'Guía de Estudio PDF')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {fileSize || (isExternalUrl ? 'Enlace Web' : 'PDF Listo')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-blue-400 transition-colors"
                  title="Abrir o previsualizar PDF"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <input
              type="url"
              value={fileUrl}
              placeholder="https://ejemplo.com/documentos/guia-comite.pdf"
              onChange={(e) => onChange(e.target.value, 'Enlace PDF')}
              className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {fileUrl && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-400"
                title="Limpiar URL"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Puedes ingresar un enlace directo a Google Drive, Dropbox, OneDrive o servidor web del PDF.</span>
            {hasValue && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Probar enlace</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </p>
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
