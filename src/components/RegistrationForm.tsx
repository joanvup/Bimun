import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, CheckCircle2, AlertCircle, User, BookOpen, Shield, CreditCard, AlertTriangle } from 'lucide-react';
import { Committee, Country } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { ImageUploadField } from './common/ImageUploadField.tsx';

interface RegistrationFormProps {
  committees: Committee[];
  countries: Country[];
  initialCommittee?: string;
  initialCountry?: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  school?: string;
  delegation_type?: string;
  committee_preference_1?: string;
  committee_preference_2?: string;
  country_preference_2?: string;
  emergency_contact?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  committees,
  countries,
  initialCommittee = '',
  initialCountry = '',
}) => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

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

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [registeredId, setRegisteredId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Update if parent passes selection
  React.useEffect(() => {
    if (initialCommittee) {
      setFormData((prev) => ({ ...prev, committee_preference_1: initialCommittee }));
      setErrors((prev) => ({ ...prev, committee_preference_1: undefined }));
    }
    if (initialCountry) {
      setFormData((prev) => ({ ...prev, country_preference_1: initialCountry }));
    }
  }, [initialCommittee, initialCountry]);

  // Validation logic
  const validateField = (name: string, value: string, currentData = formData): string | undefined => {
    switch (name) {
      case 'full_name': {
        const trimmed = value.trim();
        if (!trimmed) {
          return isEn ? 'Full name is required.' : 'El nombre completo es obligatorio.';
        }
        if (trimmed.length < 3) {
          return isEn ? 'Name must be at least 3 characters long.' : 'El nombre debe tener al menos 3 caracteres.';
        }
        return undefined;
      }
      case 'email': {
        const trimmed = value.trim();
        if (!trimmed) {
          return isEn ? 'Email address is required.' : 'El correo electrónico es obligatorio.';
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return isEn
            ? 'Please enter a valid email address (e.g. name@example.com).'
            : 'Ingresa un correo electrónico válido (ej. usuario@dominio.com).';
        }
        return undefined;
      }
      case 'phone': {
        const trimmed = value.trim();
        if (!trimmed) {
          return isEn ? 'Contact phone number is required.' : 'El teléfono de contacto es obligatorio.';
        }
        const digitsOnly = trimmed.replace(/\D/g, '');
        if (digitsOnly.length < 7) {
          return isEn
            ? 'Phone number must have at least 7 digits.'
            : 'El número telefónico debe contener al menos 7 dígitos.';
        }
        if (digitsOnly.length > 15) {
          return isEn
            ? 'Phone number is too long (maximum 15 digits).'
            : 'El número telefónico no debe exceder 15 dígitos.';
        }
        return undefined;
      }
      case 'school': {
        const trimmed = value.trim();
        if (!trimmed) {
          return isEn ? 'School or institution name is required.' : 'La institución o colegio es obligatorio.';
        }
        if (trimmed.length < 2) {
          return isEn
            ? 'Institution name must have at least 2 characters.'
            : 'El nombre de la institución debe tener al menos 2 caracteres.';
        }
        return undefined;
      }
      case 'committee_preference_1': {
        if (!value || !value.trim()) {
          return isEn
            ? 'Please select your first committee preference.'
            : 'Debes seleccionar tu primera opción de comité.';
        }
        return undefined;
      }
      case 'committee_preference_2': {
        if (value && currentData.committee_preference_1 && value === currentData.committee_preference_1) {
          return isEn
            ? 'Second committee preference must be different from the first.'
            : 'La segunda opción de comité no puede ser igual a la primera.';
        }
        return undefined;
      }
      case 'country_preference_2': {
        if (value && currentData.country_preference_1 && value === currentData.country_preference_1) {
          return isEn
            ? 'Second country preference must be different from the first.'
            : 'La segunda opción de país no puede ser igual a la primera.';
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const validateAll = (data = formData): FormErrors => {
    const newErrors: FormErrors = {};

    const fnError = validateField('full_name', data.full_name, data);
    if (fnError) newErrors.full_name = fnError;

    const emailError = validateField('email', data.email, data);
    if (emailError) newErrors.email = emailError;

    const phoneError = validateField('phone', data.phone, data);
    if (phoneError) newErrors.phone = phoneError;

    const schoolError = validateField('school', data.school, data);
    if (schoolError) newErrors.school = schoolError;

    const com1Error = validateField('committee_preference_1', data.committee_preference_1, data);
    if (com1Error) newErrors.committee_preference_1 = com1Error;

    const com2Error = validateField('committee_preference_2', data.committee_preference_2, data);
    if (com2Error) newErrors.committee_preference_2 = com2Error;

    const cnt2Error = validateField('country_preference_2', data.country_preference_2, data);
    if (cnt2Error) newErrors.country_preference_2 = cnt2Error;

    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);

    // Re-validate field dynamically if it has been touched
    if (touched[name]) {
      const fieldError = validateField(name, value, nextFormData);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }

    // Cross-field revalidation
    if (name === 'committee_preference_1' && touched['committee_preference_2'] && nextFormData.committee_preference_2) {
      const com2Err = validateField('committee_preference_2', nextFormData.committee_preference_2, nextFormData);
      setErrors((prev) => ({ ...prev, committee_preference_2: com2Err }));
    }

    if (name === 'country_preference_1' && touched['country_preference_2'] && nextFormData.country_preference_2) {
      const cnt2Err = validateField('country_preference_2', nextFormData.country_preference_2, nextFormData);
      setErrors((prev) => ({ ...prev, country_preference_2: cnt2Err }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Mark all required and preference fields as touched
    setTouched({
      full_name: true,
      email: true,
      phone: true,
      school: true,
      committee_preference_1: true,
      committee_preference_2: true,
      country_preference_1: true,
      country_preference_2: true,
    });

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setErrorMessage(
        isEn
          ? 'Please correct the highlighted errors in the form before submitting.'
          : 'Por favor corrige los campos marcados en rojo antes de enviar el formulario.'
      );
      // Scroll smoothly to form top to show errors
      const formElement = document.getElementById('inscripciones-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Registration processing error' : 'Error al procesar la inscripción'));
      }

      setSubmitSuccess(true);
      setRegisteredId(data.registration_id || 'REG-' + Math.floor(100000 + Math.random() * 900000));
      setErrors({});
      setTouched({});

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
      setErrorMessage(err.message || (isEn ? 'Connection error. Please try again.' : 'Error de conexión. Intente nuevamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const delegationTypes = [
    {
      id: 'individual',
      title: t.registration.type_individual,
      desc: isEn ? 'Independent participation' : 'Participación particular',
    },
    {
      id: 'delegacion_colegial',
      title: t.registration.type_school,
      desc: isEn ? 'Representing your institution' : 'Representando a tu colegio',
    },
    {
      id: 'observador',
      title: t.registration.type_observer,
      desc: isEn ? 'Non-debating attendance' : 'Acompañamiento sin debate',
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
                    payment_receipt: '',
                  });
                  setErrors({});
                  setTouched({});
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                {t.registration.new_reg_btn}
              </button>
            </div>
          </div>
        ) : (
          <form
            id="inscripciones-form"
            onSubmit={handleSubmit}
            noValidate
            className="p-6 sm:p-10 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-8"
          >
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">{isEn ? 'Please check the form:' : 'Atención:'}</span>
                  <p>{errorMessage}</p>
                </div>
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
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">{t.registration.full_name} *</label>
                    {touched.full_name && !errors.full_name && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Valid' : 'Correcto'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t.registration.full_name_placeholder}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.full_name && errors.full_name
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : touched.full_name && !errors.full_name
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {touched.full_name && errors.full_name && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">{t.registration.email} *</label>
                    {touched.email && !errors.email && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Valid' : 'Correcto'}
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t.registration.email_placeholder}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.email && errors.email
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : touched.email && !errors.email
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {touched.email && errors.email && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">{t.registration.phone} *</label>
                    {touched.phone && !errors.phone && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Valid' : 'Correcto'}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t.registration.phone_placeholder}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.phone && errors.phone
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : touched.phone && !errors.phone
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* School */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">{t.registration.school} *</label>
                    {touched.school && !errors.school && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Valid' : 'Correcto'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={t.registration.school_placeholder}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.school && errors.school
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : touched.school && !errors.school
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {touched.school && errors.school && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.school}
                    </p>
                  )}
                </div>

                {/* Grade */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.grade}</label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{t.registration.grade_placeholder}</option>
                    <option value="6°">6° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="7°">7° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="8°">8° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="9°">9° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="10°">10° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="11°">11° {isEn ? 'Grade' : 'Grado'}</option>
                    <option value="Docente Asesor / Faculty">
                      {isEn ? 'Faculty Advisor' : 'Docente Asesor / Faculty Advisor'}
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
                {/* Delegation Type */}
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

                {/* Committee 1 (Required) */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">{t.registration.committee_1} *</label>
                    {touched.committee_preference_1 && !errors.committee_preference_1 && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isEn ? 'Selected' : 'Seleccionado'}
                      </span>
                    )}
                  </div>
                  <select
                    name="committee_preference_1"
                    value={formData.committee_preference_1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.committee_preference_1 && errors.committee_preference_1
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : touched.committee_preference_1 && !errors.committee_preference_1
                        ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">{isEn ? '-- Select 1st Committee Preference --' : '-- Seleccione Primera Opción de Comité --'}</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.abbreviation} - {c.name}
                      </option>
                    ))}
                  </select>
                  {touched.committee_preference_1 && errors.committee_preference_1 && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.committee_preference_1}
                    </p>
                  )}
                </div>

                {/* Committee 2 (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.committee_2}</label>
                  <select
                    name="committee_preference_2"
                    value={formData.committee_preference_2}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.committee_preference_2 && errors.committee_preference_2
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">{isEn ? 'Select 2nd preference (optional)' : 'Seleccione segunda opción (opcional)'}</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.abbreviation} - {c.name}
                      </option>
                    ))}
                  </select>
                  {touched.committee_preference_2 && errors.committee_preference_2 && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      {errors.committee_preference_2}
                    </p>
                  )}
                </div>

                {/* Country 1 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.country_1}</label>
                  <select
                    name="country_preference_1"
                    value={formData.country_preference_1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">{isEn ? 'Select preferred country' : 'Seleccione país deseado (opcional)'}</option>
                    {countries.map((cnt) => (
                      <option key={cnt.id} value={cnt.name}>
                        {cnt.flag_emoji} {cnt.name} ({cnt.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Country 2 */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">{t.registration.country_2}</label>
                  <select
                    name="country_preference_2"
                    value={formData.country_preference_2}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-sm focus:outline-none transition-all text-slate-800 ${
                      touched.country_preference_2 && errors.country_preference_2
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">{isEn ? '2nd country preference' : 'Segunda opción de país (opcional)'}</option>
                    {countries.map((cnt) => (
                      <option key={cnt.id} value={cnt.name}>
                        {cnt.flag_emoji} {cnt.name} ({cnt.code})
                      </option>
                    ))}
                  </select>
                  {touched.country_preference_2 && errors.country_preference_2 && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      {errors.country_preference_2}
                    </p>
                  )}
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
                    {isEn ? 'Emergency Contact Name & Phone' : 'Nombre y Teléfono de Contacto de Emergencia'}
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
                  {isEn ? 'Payment Receipt / Voucher (Optional)' : 'Comprobante de Pago / Soporte de Inscripción'}
                </h3>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-600 mb-3">
                  {isEn
                    ? 'If you have already made the registration payment or bank transfer, you can attach the receipt directly from your computer or phone.'
                    : 'Si ya realizaste la consignación o transferencia bancaria del valor de inscripción, puedes adjuntar el comprobante directamente desde tu equipo para agilizar la validación de tu cupo.'}
                </p>
                <ImageUploadField
                  label={isEn ? 'Upload Payment Receipt' : 'Adjuntar Comprobante de Pago'}
                  value={formData.payment_receipt}
                  onChange={(val) => setFormData((prev) => ({ ...prev, payment_receipt: val }))}
                  helperText={isEn ? 'Supported formats: PNG, JPG, WebP. Can be a photo of the receipt or voucher.' : 'Formatos: PNG, JPG, WebP. Puede ser una foto o captura clara de la consignación.'}
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
