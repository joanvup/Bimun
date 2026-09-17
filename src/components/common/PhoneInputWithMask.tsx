import React, { useState, useEffect, useRef } from 'react';
import { Phone, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CountryDialInfo {
  code: string;
  name: string;
  dial: string;
  flag: string;
  samplePlaceholder: string;
  expectedDigits: number;
}

export const COUNTRY_DIAL_OPTIONS: CountryDialInfo[] = [
  { code: 'CO', name: 'Colombia', dial: '+57', flag: '🇨🇴', samplePlaceholder: '(300) 123-4567', expectedDigits: 10 },
  { code: 'US', name: 'Estados Unidos / USA', dial: '+1', flag: '🇺🇸', samplePlaceholder: '(555) 123-4567', expectedDigits: 10 },
  { code: 'MX', name: 'México', dial: '+52', flag: '🇲🇽', samplePlaceholder: '(55) 1234-5678', expectedDigits: 10 },
  { code: 'PA', name: 'Panamá', dial: '+507', flag: '🇵🇦', samplePlaceholder: '6123-4567', expectedDigits: 8 },
  { code: 'VE', name: 'Venezuela', dial: '+58', flag: '🇻🇪', samplePlaceholder: '(412) 123-4567', expectedDigits: 10 },
  { code: 'ES', name: 'España', dial: '+34', flag: '🇪🇸', samplePlaceholder: '612 34 56 78', expectedDigits: 9 },
  { code: 'PE', name: 'Perú', dial: '+51', flag: '🇵🇪', samplePlaceholder: '912 345 678', expectedDigits: 9 },
  { code: 'EC', name: 'Ecuador', dial: '+593', flag: '🇪🇨', samplePlaceholder: '99 123 4567', expectedDigits: 9 },
  { code: 'CL', name: 'Chile', dial: '+56', flag: '🇨🇱', samplePlaceholder: '9 1234 5678', expectedDigits: 9 },
  { code: 'AR', name: 'Argentina', dial: '+54', flag: '🇦🇷', samplePlaceholder: '(11) 1234-5678', expectedDigits: 10 },
  { code: 'OT', name: 'Internacional / Other', dial: '+', flag: '🌐', samplePlaceholder: '123 456 7890', expectedDigits: 10 },
];

export function applyPhoneMask(rawDigits: string, countryDial: string): string {
  if (!rawDigits) return '';
  const digits = rawDigits.replace(/\D/g, '');

  if (countryDial === '+57' || countryDial === '+1' || countryDial === '+58') {
    // 10 digits: (XXX) XXX-XXXX
    const d = digits.slice(0, 10);
    if (d.length === 0) return '';
    if (d.length <= 3) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  if (countryDial === '+52' || countryDial === '+54') {
    // 10 digits: (XX) XXXX-XXXX
    const d = digits.slice(0, 10);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }

  if (countryDial === '+507') {
    // 8 digits: XXXX-XXXX
    const d = digits.slice(0, 8);
    if (d.length <= 4) return d;
    return `${d.slice(0, 4)}-${d.slice(4)}`;
  }

  if (countryDial === '+34' || countryDial === '+51' || countryDial === '+593') {
    // 9 digits: XXX XX XX XX or XXX XXX XXX
    const d = digits.slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }

  // Other / Generic: 3-3-4 blocks
  const d = digits.slice(0, 14);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 10)} ${d.slice(10)}`;
}

interface PhoneInputWithMaskProps {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (fullFormattedValue: string, rawDigits: string, dialCode: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  isEn?: boolean;
  helperText?: string;
}

export const PhoneInputWithMask: React.FC<PhoneInputWithMaskProps> = ({
  id = 'phone-input',
  name = 'phone',
  label,
  required = false,
  value,
  onChange,
  onBlur,
  error,
  touched,
  isEn = false,
  helperText,
}) => {
  // Parse initial value if it has a dial prefix
  const [selectedCountry, setSelectedCountry] = useState<CountryDialInfo>(() => {
    if (value) {
      for (const c of COUNTRY_DIAL_OPTIONS) {
        if (c.dial !== '+' && value.startsWith(c.dial)) {
          return c;
        }
      }
    }
    return COUNTRY_DIAL_OPTIONS[0]; // Default Colombia (+57)
  });

  const [displayMaskedValue, setDisplayMaskedValue] = useState<string>(() => {
    if (!value) return '';
    // Strip dial prefix if present in the stored string
    let localDigits = value;
    if (value.startsWith(selectedCountry.dial)) {
      localDigits = value.slice(selectedCountry.dial.length).trim();
    }
    return applyPhoneMask(localDigits, selectedCountry.dial);
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Synchronize when external value changes
  useEffect(() => {
    if (!value) {
      setDisplayMaskedValue('');
      return;
    }
    // Check if dial code matches
    let matchedCountry = selectedCountry;
    for (const c of COUNTRY_DIAL_OPTIONS) {
      if (c.dial !== '+' && value.startsWith(c.dial)) {
        matchedCountry = c;
        break;
      }
    }
    if (matchedCountry.code !== selectedCountry.code) {
      setSelectedCountry(matchedCountry);
    }
    let localDigits = value;
    if (value.startsWith(matchedCountry.dial)) {
      localDigits = value.slice(matchedCountry.dial.length).trim();
    }
    const formatted = applyPhoneMask(localDigits, matchedCountry.dial);
    setDisplayMaskedValue(formatted);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;

    // Check if user pasted a full international number with '+'
    if (rawInput.startsWith('+')) {
      for (const c of COUNTRY_DIAL_OPTIONS) {
        if (c.dial !== '+' && rawInput.startsWith(c.dial)) {
          setSelectedCountry(c);
          const digitsAfter = rawInput.slice(c.dial.length).replace(/\D/g, '');
          const masked = applyPhoneMask(digitsAfter, c.dial);
          setDisplayMaskedValue(masked);
          const fullValue = digitsAfter ? `${c.dial} ${masked}` : '';
          onChange(fullValue, digitsAfter, c.dial);
          return;
        }
      }
    }

    const digitsOnly = rawInput.replace(/\D/g, '');
    const masked = applyPhoneMask(digitsOnly, selectedCountry.dial);
    setDisplayMaskedValue(masked);

    const fullValue = digitsOnly ? `${selectedCountry.dial} ${masked}` : '';
    onChange(fullValue, digitsOnly, selectedCountry.dial);
  };

  const handleCountrySelect = (country: CountryDialInfo) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);

    // Re-apply mask to existing digits under new country rules
    const digitsOnly = displayMaskedValue.replace(/\D/g, '');
    const masked = applyPhoneMask(digitsOnly, country.dial);
    setDisplayMaskedValue(masked);

    const fullValue = digitsOnly ? `${country.dial} ${masked}` : '';
    onChange(fullValue, digitsOnly, country.dial);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const rawDigits = displayMaskedValue.replace(/\D/g, '');
  const isValidLength = rawDigits.length >= selectedCountry.expectedDigits;
  const isFieldValid = touched && !error && rawDigits.length >= 7;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={id} className="text-xs font-semibold text-slate-700">
            {label} {required && '*'}
          </label>
          {isFieldValid && (
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Valid number' : 'Número válido'}
            </span>
          )}
        </div>
      )}

      <div
        className={`relative flex items-center rounded-xl bg-white border transition-all shadow-sm ${
          touched && error
            ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
            : isFieldValid
            ? 'border-emerald-300 ring-1 ring-emerald-200'
            : 'border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        {/* Country Dial Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 pl-3 pr-2 py-2.5 h-full text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-l-xl border-r border-slate-200 transition-colors focus:outline-none"
            aria-label={isEn ? 'Select Country Code' : 'Seleccionar Indicativo de País'}
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-mono text-slate-800">{selectedCountry.dial}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1.5 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                {isEn ? 'Select Country' : 'Selecciona el Indicativo'}
              </div>
              {COUNTRY_DIAL_OPTIONS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-blue-50 transition-colors ${
                    selectedCountry.code === c.code ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{c.flag}</span>
                    <span className="truncate max-w-[130px]">{c.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-500">{c.dial}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Masked Input */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={displayMaskedValue}
            onChange={handleInputChange}
            onBlur={onBlur}
            placeholder={selectedCountry.samplePlaceholder}
            className="w-full pl-3 pr-9 py-2.5 rounded-r-xl bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {touched && error ? (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            ) : isFieldValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Helper & Error text */}
      {touched && error ? (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-0.5">
          <span>
            {helperText ||
              (isEn
                ? `Format: ${selectedCountry.dial} ${selectedCountry.samplePlaceholder}`
                : `Formato: ${selectedCountry.dial} ${selectedCountry.samplePlaceholder}`)}
          </span>
          {rawDigits.length > 0 && (
            <span
              className={`font-mono font-medium ${
                isValidLength ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {rawDigits.length}/{selectedCountry.expectedDigits} {isEn ? 'digits' : 'dígitos'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
