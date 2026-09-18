import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';

interface HumanCaptchaProps {
  onVerify: (isValid: boolean) => void;
  isEn?: boolean;
  theme?: 'light' | 'dark';
  idPrefix?: string;
}

export const HumanCaptcha: React.FC<HumanCaptchaProps> = ({
  onVerify,
  isEn = false,
  theme = 'light',
  idPrefix = 'reg',
}) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Generate a friendly challenge: e.g. sum between 2 single digit or simple numbers (3 to 12)
  const generateChallenge = useCallback(() => {
    const n1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const n2 = Math.floor(Math.random() * 8) + 1; // 1 to 8
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    setIsAnswered(false);
    setIsCorrect(false);
    setHasInteracted(false);
    onVerify(false);
  }, [onVerify]);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setUserAnswer(val);
    setHasInteracted(true);

    if (val === '') {
      setIsAnswered(false);
      setIsCorrect(false);
      onVerify(false);
      return;
    }

    const numericAnswer = parseInt(val, 10);
    const expected = num1 + num2;
    const correct = !isNaN(numericAnswer) && numericAnswer === expected;

    setIsAnswered(true);
    setIsCorrect(correct);
    onVerify(correct);
  };

  const isDark = theme === 'dark';

  return (
    <div
      id={`${idPrefix}-captcha-container`}
      className={`rounded-xl p-3.5 border transition-all ${
        isDark
          ? 'bg-slate-900/80 border-slate-700/90 text-slate-200'
          : 'bg-slate-50/90 border-slate-200 text-slate-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Challenge prompt with visual badge */}
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isCorrect
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : isDark
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'bg-white text-blue-600 border border-slate-200 shadow-xs'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">
                {isEn ? 'Anti-Spam Verification' : 'Verificación Anti-Spam'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
                CAPTCHA
              </span>
            </div>

            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {isEn ? 'Solve this to verify you are human:' : 'Resuelve la operación para verificar:'}
            </p>
          </div>
        </div>

        {/* Math expression & input */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-lg font-mono font-bold tracking-wider text-sm select-none ${
              isDark
                ? 'bg-slate-950 border border-slate-700 text-amber-300'
                : 'bg-white border border-slate-300 text-blue-900 shadow-xs'
            }`}
            title={isEn ? 'Math challenge' : 'Operación matemática'}
          >
            {num1} + {num2} = ?
          </div>

          <input
            id={`${idPrefix}-captcha-input`}
            type="number"
            inputMode="numeric"
            value={userAnswer}
            onChange={handleInputChange}
            placeholder="?"
            aria-label={isEn ? 'Captcha answer' : 'Respuesta del captcha'}
            className={`w-14 px-2 py-1.5 rounded-lg text-center font-bold text-sm border focus:outline-none transition-colors ${
              hasInteracted && isAnswered
                ? isCorrect
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                  : 'border-red-500 ring-2 ring-red-500/30 text-red-500 bg-red-500/5'
                : isDark
                ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500'
                : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
            }`}
          />

          <button
            type="button"
            onClick={generateChallenge}
            title={isEn ? 'Change challenge' : 'Cambiar operación'}
            className={`p-2 rounded-lg transition-colors border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300 shadow-xs'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Validation status feedback */}
      {hasInteracted && isAnswered && !isCorrect && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-500 font-medium animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isEn
              ? 'Incorrect answer. Please solve the calculation again.'
              : 'Resultado incorrecto. Por favor resuelve el cálculo nuevamente.'}
          </span>
        </div>
      )}

      {isCorrect && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isEn ? 'Verification successful.' : 'Verificación humana completada con éxito.'}
          </span>
        </div>
      )}
    </div>
  );
};
