import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, AlertCircle, User, BookOpen, Shield, CreditCard } from 'lucide-react';
import { Committee, Country } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ImageUploadField } from './common/ImageUploadField.tsx';

interface RegistrationFormProps {
  committees: Committee[];
  countries: Country[];
  initialCommittee?: string;
  initialCountry?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  committees,
  countries,
  initialCommittee = '',
  initialCountry = '',
}) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    school: '',
    delegation_type: 'individual',
    grade: '',
    committee_preference_1: initialCommittee,
    committee_preference_2: '',
    country_preference_1: initialCountry,
    country_preference_2: '',
    experience: '',
    dietary_medical: '',
    emergency_contact: '',
    payment_receipt: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [registeredId, setRegisteredId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Update if parent passes selection
  React.useEffect(() => {
    if (initialCommittee) {
      setFormData((prev) => ({ ...prev, committee_preference_1: initialCommittee }));
    }
    if (initialCountry) {
      setFormData((prev) => ({ ...prev, country_preference_1: initialCountry }));
    }
  }, [initialCommittee, initialCountry]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'en' ? 'Registration processing error' : 'Error al procesar la inscripción'));
      }

      setSubmitSuccess(true);
      setRegisteredId(data.registration_id || 'REG-' + Math.floor(100000 + Math.random() * 900000));

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if canvas-confetti fails
      }
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'en' ? 'Connection error. Please try again.' : 'Error de conexión. Intente nuevamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const delegationTypes = [
    {
      id: 'individual',
      title: t.registration.type_individual,
      desc: language === 'en' ? 'Independent participation' : 'Participación particular',
    },
    {
      id: 'delegacion_colegial',
      title: t.registration.type_school,
      desc: language === 'en' ? 'Representing your institution' : 'Representando a tu colegio',
    },
    {
      id: 'observador',
      title: t.registration.type_observer,
      desc: language === 'en' ? 'Non-debating attendance' : 'Acompañamiento sin debate',
    },
  ];

  return (
    <section id="inscripciones" className="py-24 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            {t.registration.badge}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.registration.title}
          </h2>
          <p className="text-base text-slate-600 font-normal leading-relaxed">
            {t.registration.subtitle}
          </p>
        </div>

        {submitSuccess ? (
          <div className="p-8 sm:p-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-bold text-emerald-950">
                {t.registration.success_title}
              </h3>
              <p className="text-sm text-emerald-800 max-w-lg mx-auto leading-relaxed">
                {t.registration.success_message}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 inline-block max-w-xs mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {t.registration.reg_code}:
              </span>
              <span className="font-mono text-lg font-extrabold text-blue-900">{registeredId}</span>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    school: '',
                    delegation_type: 'individual',
                    grade: '',
                    committee_preference_1: '',
                    committee_preference_2: '',
                    country_preference_1: '',
                    country_preference_2: '',
                    experience: '',
                    dietary_medical: '',
                    emergency_contact: '',
                  });
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                {t.registration.new_reg_btn}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-8"
          >
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Delegate Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                  {t.registration.personal_info}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.full_name} *</label>
                  <input
                    type="text"
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder={t.registration.full_name_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.email} *</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.registration.email_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.phone} *</label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t.registration.phone_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.school} *</label>
                  <input
                    type="text"
                    required
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    placeholder={t.registration.school_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.grade}</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{t.registration.grade_placeholder}</option>
                    <option value="6°">6° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="7°">7° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="8°">8° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="9°">9° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="10°">10° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="11°">11° {language === 'en' ? 'Grade' : 'Grado'}</option>
                    <option value="Docente Asesor / Faculty">
                      {language === 'en' ? 'Faculty Advisor' : 'Docente Asesor / Faculty Advisor'}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Delegation & Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                  {t.registration.preferences_info}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.registration.delegation_type} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {delegationTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          formData.delegation_type === type.id
                            ? 'bg-blue-50 border-blue-600 shadow-sm ring-1 ring-blue-600'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">{type.title}</span>
                          <input
                            type="radio"
                            name="delegation_type"
                            value={type.id}
                            checked={formData.delegation_type === type.id}
                            onChange={handleChange}
                            className="text-blue-600"
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{type.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.committee_1} *</label>
                  <select
                    required
                    name="committee_preference_1"
                    value={formData.committee_preference_1}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{language === 'en' ? 'Select 1st preference' : 'Seleccione primera opción'}</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.abbreviation} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.committee_2}</label>
                  <select
                    name="committee_preference_2"
                    value={formData.committee_preference_2}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{language === 'en' ? 'Select 2nd preference (optional)' : 'Seleccione segunda opción (opcional)'}</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.abbreviation} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.country_1}</label>
                  <select
                    name="country_preference_1"
                    value={formData.country_preference_1}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{language === 'en' ? 'Select preferred country' : 'Seleccione país deseado (opcional)'}</option>
                    {countries.map((cnt) => (
                      <option key={cnt.id} value={cnt.name}>
                        {cnt.flag_emoji} {cnt.name} ({cnt.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.country_2}</label>
                  <select
                    name="country_preference_2"
                    value={formData.country_preference_2}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{language === 'en' ? '2nd country preference' : 'Segunda opción de país'}</option>
                    {countries.map((cnt) => (
                      <option key={cnt.id} value={cnt.name}>
                        {cnt.flag_emoji} {cnt.name} ({cnt.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Logistics & Experience */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                  {t.registration.additional_info}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.registration.experience}
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder={t.registration.experience_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {t.registration.dietary}
                  </label>
                  <input
                    type="text"
                    name="dietary_medical"
                    value={formData.dietary_medical}
                    onChange={handleChange}
                    placeholder={t.registration.dietary_placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {language === 'en' ? 'Emergency Contact Name & Phone' : 'Nombre y Teléfono de Contacto de Emergencia'}
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="Nombre del Acudiente / +57 300 000 0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Comprobante de Pago / Soporte (Opcional) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800">
                  {language === 'en' ? 'Payment Receipt / Voucher (Optional)' : 'Comprobante de Pago / Soporte de Inscripción'}
                </h3>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-3">
                  {language === 'en'
                    ? 'If you have already made the registration payment or bank transfer, you can attach the receipt directly from your computer or phone.'
                    : 'Si ya realizaste la consignación o transferencia bancaria del valor de inscripción, puedes adjuntar el comprobante directamente desde tu equipo para agilizar la validación de tu cupo.'}
                </p>
                <ImageUploadField
                  label={language === 'en' ? 'Upload Payment Receipt' : 'Adjuntar Comprobante de Pago'}
                  value={formData.payment_receipt}
                  onChange={(val) => setFormData((prev) => ({ ...prev, payment_receipt: val }))}
                  helperText={language === 'en' ? 'Supported formats: PNG, JPG, WebP. Can be a photo of the receipt or voucher.' : 'Formatos: PNG, JPG, WebP. Puede ser una foto o captura clara de la consignación.'}
                  aspectRatio="banner"
                  maxDimensions={{ width: 1400, height: 1400 }}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                {t.registration.terms}
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.registration.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.registration.submit_btn}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};
