import React, { useState } from 'react';
import { MapPin, Mail, Phone, Instagram, Youtube, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { BIMUNSettings } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { HumanCaptcha } from './common/HumanCaptcha.tsx';

interface ContactSectionProps {
  settings: BIMUNSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const { language, t } = useLanguage();
  const [msgSent, setMsgSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCaptchaError('');

    if (honeypot) {
      console.warn('Bot detected by honeypot.');
      return;
    }

    if (!isCaptchaValid) {
      setCaptchaError(
        language === 'en'
          ? 'Please complete the anti-spam verification before sending.'
          : 'Por favor resuelve la verificación anti-spam antes de enviar el mensaje.'
      );
      return;
    }

    setMsgSent(true);
  };

  return (
    <section id="contacto" className="py-24 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Institutional Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                {t.contact.badge}
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {t.contact.title}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                {t.contact.subtitle}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.contact.venue_title}
                  </h4>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {settings.institution_name || 'Fundación Colegio Bilingüe de Valledupar'}
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {settings.contact_address || 'Calle 16 # 19E-45, Valledupar, Cesar, Colombia'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.contact.email_title}
                  </h4>
                  <a
                    href={`mailto:${settings.contact_email || 'bimun@colegiobilingue.edu.co'}`}
                    className="text-sm font-semibold text-blue-300 hover:text-white transition-colors block mt-0.5"
                  >
                    {settings.contact_email || 'bimun@colegiobilingue.edu.co'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
                <div className="p-2.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.contact.phone_title}
                  </h4>
                  <a
                    href={`tel:${settings.contact_phone || '+576055742100'}`}
                    className="text-sm font-semibold text-white hover:text-blue-300 transition-colors block mt-0.5"
                  >
                    {settings.contact_phone || '+57 (605) 574-2100'}
                  </a>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-2 flex items-center gap-3">
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span>{language === 'en' ? 'Official Instagram' : 'Instagram Oficial'}</span>
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span>{language === 'en' ? 'Live Broadcasts' : 'Transmisiones en Vivo'}</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Contact Inquiries Box */}
          <div className="lg:col-span-6 bg-slate-800/90 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-xl">
            <h3 className="font-display text-xl font-bold text-white mb-2">
              {t.contact.form_title}
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              {language === 'en' ? 'We will reply within 24 business hours.' : 'Te responderemos en un plazo máximo de 24 horas hábiles.'}
            </p>

            {msgSent ? (
              <div className="p-6 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-display text-base font-bold text-emerald-200">
                  {t.contact.sent_success}
                </h4>
                <p className="text-xs text-emerald-300">
                  {language === 'en' ? `Thank you for reaching out. We will contact you at ${email || 'your email'}.` : `Gracias por comunicarte con BIMUN. Estaremos en contacto a través de ${email || 'tu correo'}.`}
                </p>
                <button
                  onClick={() => {
                    setMsgSent(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 underline pt-2 cursor-pointer"
                >
                  {language === 'en' ? 'Send another message' : 'Enviar otro mensaje'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t.contact.form_name}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'en' ? 'Your name or institutional role' : 'Tu nombre o cargo institucional'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t.contact.form_email}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">{t.contact.form_message}</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={language === 'en' ? 'Write your inquiry here regarding committees, registrations, delegations or logistics...' : 'Escribe aquí tu consulta sobre comisiones, inscripciones, delegaciones o logística...'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Honeypot field (hidden for spam bots) */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="company_title_check"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Anti-spam CAPTCHA */}
                <HumanCaptcha
                  idPrefix="contact"
                  isEn={language === 'en'}
                  theme="dark"
                  onVerify={(valid) => {
                    setIsCaptchaValid(valid);
                    if (valid) setCaptchaError('');
                  }}
                />

                {captchaError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{captchaError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isCaptchaValid}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 disabled:shadow-none cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.contact.send_btn}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
