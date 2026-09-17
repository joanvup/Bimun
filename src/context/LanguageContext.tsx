import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    institutional: string;
    institutional_desc: string;
    about: string;
    about_desc: string;
    team: string;
    team_desc: string;
    gallery: string;
    gallery_desc: string;
    news: string;
    news_desc: string;
    academic: string;
    academic_desc: string;
    committees: string;
    committees_desc: string;
    delegations: string;
    delegations_desc: string;
    topics: string;
    topics_desc: string;
    documents: string;
    documents_desc: string;
    event: string;
    event_desc: string;
    schedule: string;
    schedule_desc: string;
    contact: string;
    contact_desc: string;
    register: string;
    cms: string;
    cms_panel: string;
  };
  // Hero
  hero: {
    institution: string;
    countdown_title: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    cta_register: string;
    cta_committees: string;
    cta_documents: string;
    stat_committees: string;
    stat_delegations: string;
    stat_days: string;
    stat_tradition: string;
  };
  // About
  about: {
    badge: string;
    title: string;
    subtitle: string;
    objectives_title: string;
    history_title: string;
    methodology_title: string;
    learn_more: string;
  };
  // Committees
  committees: {
    badge: string;
    title: string;
    subtitle: string;
    filter_all: string;
    filter_es: string;
    filter_en: string;
    filter_bilingual: string;
    topics_label: string;
    board_label: string;
    details_btn: string;
    register_committee_btn: string;
    modal_title: string;
    modal_topics: string;
    modal_board: string;
    modal_close: string;
  };
  // Delegations
  delegations: {
    badge: string;
    title: string;
    subtitle: string;
    search_placeholder: string;
    filter_all_committees: string;
    filter_status: string;
    filter_status_all: string;
    filter_status_free: string;
    filter_status_assigned: string;
    status_free: string;
    status_assigned: string;
    col_country: string;
    col_committee: string;
    col_status: string;
    col_delegate: string;
    col_action: string;
    apply_btn: string;
    showing: string;
    of: string;
    delegations_label: string;
  };
  // Topics
  topics: {
    badge: string;
    title: string;
    subtitle: string;
    download_guide: string;
    topic_a: string;
    topic_b: string;
    topic_c: string;
  };
  // Schedule
  schedule: {
    badge: string;
    title: string;
    subtitle: string;
    day: string;
    time: string;
    activity: string;
    location: string;
    target: string;
  };
  // Documents
  documents: {
    badge: string;
    title: string;
    subtitle: string;
    download_btn: string;
    category_all: string;
  };
  // Gallery
  gallery: {
    badge: string;
    title: string;
    subtitle: string;
    filter_all: string;
    filter_debates: string;
    filter_ceremonies: string;
    filter_delegates: string;
    view_photo: string;
  };
  // Team
  team: {
    badge: string;
    title: string;
    subtitle: string;
    secretariat: string;
    faculty: string;
  };
  // News
  news: {
    badge: string;
    title: string;
    subtitle: string;
    read_more: string;
    published_on: string;
  };
  // Registration
  registration: {
    badge: string;
    title: string;
    subtitle: string;
    personal_info: string;
    academic_info: string;
    preferences_info: string;
    additional_info: string;
    full_name: string;
    full_name_placeholder: string;
    email: string;
    email_placeholder: string;
    phone: string;
    phone_placeholder: string;
    school: string;
    school_placeholder: string;
    delegation_type: string;
    type_individual: string;
    type_school: string;
    type_observer: string;
    grade: string;
    grade_placeholder: string;
    committee_1: string;
    committee_2: string;
    country_1: string;
    country_2: string;
    experience: string;
    experience_placeholder: string;
    dietary: string;
    dietary_placeholder: string;
    terms: string;
    submit_btn: string;
    submitting: string;
    success_title: string;
    success_message: string;
    reg_code: string;
    new_reg_btn: string;
  };
  // Contact
  contact: {
    badge: string;
    title: string;
    subtitle: string;
    venue_title: string;
    phone_title: string;
    email_title: string;
    hours_title: string;
    hours_value: string;
    form_title: string;
    form_name: string;
    form_email: string;
    form_subject: string;
    form_message: string;
    send_btn: string;
    sending: string;
    sent_success: string;
  };
  // Footer
  footer: {
    tagline: string;
    quick_links: string;
    academic_links: string;
    admin_title: string;
    admin_desc: string;
    rights: string;
  };
  // Admin Login Modal
  admin_modal: {
    title: string;
    subtitle: string;
    user_label: string;
    pass_label: string;
    login_btn: string;
    logging_in: string;
    cancel_btn: string;
    error_msg: string;
  };
}

const translations: Record<Language, Translations> = {
  es: {
    nav: {
      home: 'Inicio',
      institutional: 'Institucional',
      institutional_desc: 'Identidad, historia y equipo del BIMUN',
      about: 'Sobre el BIMUN',
      about_desc: 'Misión, visión, objetivos y valores',
      team: 'Comité Organizador',
      team_desc: 'Secretaría General y directores',
      gallery: 'Galería de Memorias',
      gallery_desc: 'Fotografías y registros de sesiones',
      news: 'Noticias & Boletines',
      news_desc: 'Comunicados y avisos oficiales',
      academic: 'Académico',
      academic_desc: 'Comisiones, matriz, temas y guías',
      committees: 'Comisiones de Debate',
      committees_desc: 'Salas en Español, Inglés y Crisis',
      delegations: 'Matriz de Delegaciones',
      delegations_desc: 'Disponibilidad de países en tiempo real',
      topics: 'Temas de Debate',
      topics_desc: 'Agenda temática oficial por comisión',
      documents: 'Documentos & Guías',
      documents_desc: 'Manual parlamentario y guías de estudio',
      event: 'Evento',
      event_desc: 'Cronograma, horarios y ubicación',
      schedule: 'Cronograma Oficial',
      schedule_desc: 'Horarios de sesiones y recintos',
      contact: 'Contacto & Sede',
      contact_desc: 'Ubicación en Valledupar y canales de atención',
      register: 'Inscripciones',
      cms: 'CMS',
      cms_panel: 'Panel CMS',
    },
    hero: {
      institution: 'Fundación Colegio Bilingüe de Valledupar',
      countdown_title: 'Tiempo para la Sesión Inaugural:',
      days: 'Días',
      hours: 'Horas',
      minutes: 'Min',
      seconds: 'Seg',
      cta_register: 'Inscripciones Abiertas',
      cta_committees: 'Ver Comisiones',
      cta_documents: 'Descargar Documentos',
      stat_committees: 'Comisiones de Debate',
      stat_delegations: 'Delegaciones Soberanas',
      stat_days: 'Jornadas Diplomáticas',
      stat_tradition: 'Tradición & Liderazgo',
    },
    about: {
      badge: 'Tradición Académica e Institucional',
      title: 'Conoce el BIMUN y su Legado',
      subtitle: 'Formación en debate diplomático, oratoria rigurosa y pensamiento global en la Fundación Colegio Bilingüe de Valledupar.',
      objectives_title: 'Nuestros Objetivos',
      history_title: 'Nuestra Historia',
      methodology_title: 'Metodología Parlamentaria',
      learn_more: 'Conoce más detalles',
    },
    committees: {
      badge: 'Comisiones de Debate',
      title: 'Órganos y Comités Oficiales',
      subtitle: 'Explora las salas de negociación internacional, sus temáticas estratégicas y las mesas directivas asignadas para esta edición.',
      filter_all: 'Todas las Comisiones',
      filter_es: 'Español',
      filter_en: 'English',
      filter_bilingual: 'Bilingüe (ES/EN)',
      topics_label: 'Temáticas Oficiales',
      board_label: 'Mesa Directiva',
      details_btn: 'Ver Detalles y Temas',
      register_committee_btn: 'Postularse a esta Comisión',
      modal_title: 'Detalles de la Comisión',
      modal_topics: 'Temario Oficial de Debate',
      modal_board: 'Mesa Directiva Asignada',
      modal_close: 'Cerrar',
    },
    delegations: {
      badge: 'Matriz Diplomática en Vivo',
      title: 'Matriz de Delegaciones y Países',
      subtitle: 'Consulta el estado de asignación de cada país soberano por comisión y postula tu delegación oficial.',
      search_placeholder: 'Buscar país o código ISO...',
      filter_all_committees: 'Todas las Comisiones',
      filter_status: 'Estado de cupo',
      filter_status_all: 'Todos los estados',
      filter_status_free: 'Solo Disponibles',
      filter_status_assigned: 'Solo Asignados',
      status_free: 'Cupo Libre',
      status_assigned: 'Asignado',
      col_country: 'País / Delegación',
      col_committee: 'Comisión',
      col_status: 'Estado',
      col_delegate: 'Delegado / Colegio',
      col_action: 'Acción',
      apply_btn: 'Postularme',
      showing: 'Mostrando',
      of: 'de',
      delegations_label: 'delegaciones',
    },
    topics: {
      badge: 'Agenda Académica',
      title: 'Temas de Debate por Comisión',
      subtitle: 'Problemáticas globales seleccionadas con rigor pedagógico para desafiar el análisis crítico y la negociación de los delegados.',
      download_guide: 'Descargar Guía de Estudio',
      topic_a: 'Tema A',
      topic_b: 'Tema B',
      topic_c: 'Tema C',
    },
    schedule: {
      badge: 'Itinerario Oficial',
      title: 'Cronograma de Actividades',
      subtitle: 'Planificación de sesiones plenarias, debates de comisión, actos protocolarios y ceremonias de clausura.',
      day: 'Día',
      time: 'Hora',
      activity: 'Actividad',
      location: 'Recinto',
      target: 'Dirigido a',
    },
    documents: {
      badge: 'Centro de Descargas',
      title: 'Documentos Oficiales y Guías',
      subtitle: 'Accede a los manuales de procedimiento parlamentario, formatos de resolución y guías temáticas preparadas por la Secretaría Académica.',
      download_btn: 'Descargar Documento',
      category_all: 'Todos los Documentos',
    },
    gallery: {
      badge: 'Memorias Visuales',
      title: 'Galería Fotográfica BIMUN',
      subtitle: 'Momentos destacados de oratoria, debates, alianzas diplomáticas y ceremonias de las ediciones recientes.',
      filter_all: 'Todas las Fotos',
      filter_debates: 'Debates en Sala',
      filter_ceremonies: 'Ceremonias',
      filter_delegates: 'Delegados & Pasillos',
      view_photo: 'Ampliar Fotografía',
    },
    team: {
      badge: 'Liderazgo & Secretaría',
      title: 'Comité Organizador BIMUN',
      subtitle: 'Conoce al equipo de estudiantes y docentes de la Fundación Colegio Bilingüe dedicados a hacer posible esta experiencia formativa.',
      secretariat: 'Secretaría General & Staff',
      faculty: 'Comité Asesor Docente',
    },
    news: {
      badge: 'Actualidad & Avisos',
      title: 'Boletín y Comunicados Oficiales',
      subtitle: 'Mantente informado con los avisos de la Secretaría General, fechas clave y publicaciones institucionales.',
      read_more: 'Leer comunicado completo',
      published_on: 'Publicado el',
    },
    registration: {
      badge: 'Convocatoria Oficial',
      title: 'Inscripción de Delegados y Colegios',
      subtitle: 'Diligencia el formulario oficial para postular tu delegación individual o colectiva en la edición BIMUN XXVII.',
      personal_info: '1. Datos del Delegado / Representante',
      academic_info: '2. Información Académica e Institución',
      preferences_info: '3. Preferencias de Comisión y País',
      additional_info: '4. Información Adicional y Logística',
      full_name: 'Nombre Completo del Delegado',
      full_name_placeholder: 'Ej: Juan Andrés Morales Gómez',
      email: 'Correo Electrónico',
      email_placeholder: 'ejemplo@colegio.edu.co',
      phone: 'Teléfono / WhatsApp',
      phone_placeholder: '300 123 4567',
      school: 'Colegio o Institución Educativa',
      school_placeholder: 'Fundación Colegio Bilingüe de Valledupar',
      delegation_type: 'Tipo de Delegación',
      type_individual: 'Delegado Individual',
      type_school: 'Delegación Escolar (Colegio)',
      type_observer: 'Observador / Docente Acompañante',
      grade: 'Grado Escolar',
      grade_placeholder: 'Ej: 9°, 10°, 11° o Universidad',
      committee_1: 'Comisión Preferencia 1',
      committee_2: 'Comisión Preferencia 2 (Opcional)',
      country_1: 'País de Primera Preferencia',
      country_2: 'País de Segunda Preferencia (Opcional)',
      experience: 'Experiencia Previa en Modelos ONU',
      experience_placeholder: 'Menciona si has participado antes en BIMUN u otros modelos...',
      dietary: 'Requerimientos Dietarios o Médicos',
      dietary_placeholder: 'Alergias, vegetarianismo o condiciones especiales...',
      terms: 'Declaro que la información proporcionada es verídica y me comprometo a cumplir el código de vestimenta y conducta diplomática del BIMUN.',
      submit_btn: 'Enviar Solicitud de Inscripción',
      submitting: 'Procesando inscripción...',
      success_title: '¡Inscripción Radicada Exitosamente!',
      success_message: 'Tu postulación ha sido enviada a la Secretaría General. Recibirás confirmación y pasos de pago/asignación en tu correo.',
      reg_code: 'Código de Radicado:',
      new_reg_btn: 'Radicar otra inscripción',
    },
    contact: {
      badge: 'Canales de Atención',
      title: 'Contacto & Sede del Evento',
      subtitle: 'Comunícate con la Secretaría General o visita el campus principal de la Fundación Colegio Bilingüe de Valledupar.',
      venue_title: 'Campus Principal',
      phone_title: 'Líneas Telefónicas',
      email_title: 'Correo Institucional',
      hours_title: 'Atención al Público',
      hours_value: 'Lunes a Viernes: 7:30 AM - 3:30 PM',
      form_title: 'Envíanos un Mensaje Directo',
      form_name: 'Tu Nombre Completo',
      form_email: 'Tu Correo Electrónico',
      form_subject: 'Asunto / Motivo',
      form_message: 'Mensaje o Consulta',
      send_btn: 'Enviar Mensaje',
      sending: 'Enviando...',
      sent_success: '¡Mensaje enviado con éxito a la Secretaría!',
    },
    footer: {
      tagline: 'Formando líderes globales, diplomáticos comprometidos y ciudadanos de paz desde Valledupar para el mundo.',
      quick_links: 'Enlaces Rápidos',
      academic_links: 'Información Académica',
      admin_title: 'Administración',
      admin_desc: 'Panel privado para la Secretaría General y cuerpo directivo del BIMUN.',
      rights: 'Todos los derechos reservados. Fundación Colegio Bilingüe de Valledupar.',
    },
    admin_modal: {
      title: 'Acceso Administrativo CMS',
      subtitle: 'Ingresa las credenciales de la Secretaría General para gestionar la plataforma.',
      user_label: 'Usuario',
      pass_label: 'Contraseña',
      login_btn: 'Ingresar al CMS',
      logging_in: 'Verificando...',
      cancel_btn: 'Cancelar',
      error_msg: 'Credenciales inválidas. Verifica tu usuario y contraseña.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      institutional: 'Institutional',
      institutional_desc: 'BIMUN identity, history, and secretariat',
      about: 'About BIMUN',
      about_desc: 'Mission, vision, objectives, and values',
      team: 'Organizing Secretariat',
      team_desc: 'Secretariat, chairs, and faculty advisors',
      gallery: 'Photo Memories',
      gallery_desc: 'Visual archives from past conferences',
      news: 'News & Bulletins',
      news_desc: 'Official press releases and announcements',
      academic: 'Academic',
      academic_desc: 'Committees, matrix, topics, and guides',
      committees: 'Debate Committees',
      committees_desc: 'Rooms in English, Spanish, and Crisis',
      delegations: 'Delegations Matrix',
      delegations_desc: 'Real-time sovereign country availability',
      topics: 'Agenda Topics',
      topics_desc: 'Official thematic debate agenda',
      documents: 'Documents & Guides',
      documents_desc: 'Parliamentary handbook and study guides',
      event: 'Event',
      event_desc: 'Schedule, timeline, and venue',
      schedule: 'Official Schedule',
      schedule_desc: 'Session hours and room assignments',
      contact: 'Contact & Venue',
      contact_desc: 'Campus location in Valledupar and support',
      register: 'Register',
      cms: 'CMS',
      cms_panel: 'CMS Panel',
    },
    hero: {
      institution: 'Fundación Colegio Bilingüe de Valledupar',
      countdown_title: 'Countdown to the Opening Session:',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Mins',
      seconds: 'Secs',
      cta_register: 'Registrations Open',
      cta_committees: 'Explore Committees',
      cta_documents: 'Download Documents',
      stat_committees: 'Debate Committees',
      stat_delegations: 'Sovereign Delegations',
      stat_days: 'Days of Diplomacy',
      stat_tradition: 'Years of Tradition',
    },
    about: {
      badge: 'Academic & Institutional Heritage',
      title: 'Discover BIMUN and Its Legacy',
      subtitle: 'Rigorous diplomatic debate, persuasive oratory, and global leadership at Fundación Colegio Bilingüe de Valledupar.',
      objectives_title: 'Our Objectives',
      history_title: 'Our History',
      methodology_title: 'Parliamentary Methodology',
      learn_more: 'Learn more details',
    },
    committees: {
      badge: 'Debate Committees',
      title: 'Official Organs & Committees',
      subtitle: 'Explore the international negotiation chambers, their strategic agendas, and the rostrum chairs for this edition.',
      filter_all: 'All Committees',
      filter_es: 'Spanish',
      filter_en: 'English',
      filter_bilingual: 'Bilingual (ES/EN)',
      topics_label: 'Official Topics',
      board_label: 'Committee Dais / Rostrum',
      details_btn: 'View Details & Topics',
      register_committee_btn: 'Apply for this Committee',
      modal_title: 'Committee Details',
      modal_topics: 'Official Thematic Agenda',
      modal_board: 'Assigned Dais / Rostrum',
      modal_close: 'Close',
    },
    delegations: {
      badge: 'Live Diplomatic Matrix',
      title: 'Delegations & Country Matrix',
      subtitle: 'Check the real-time assignment status of sovereign states across all committees and apply for your delegation.',
      search_placeholder: 'Search country or ISO code...',
      filter_all_committees: 'All Committees',
      filter_status: 'Seat status',
      filter_status_all: 'All statuses',
      filter_status_free: 'Available Only',
      filter_status_assigned: 'Assigned Only',
      status_free: 'Available',
      status_assigned: 'Assigned',
      col_country: 'Country / Delegation',
      col_committee: 'Committee',
      col_status: 'Status',
      col_delegate: 'Delegate / School',
      col_action: 'Action',
      apply_btn: 'Apply',
      showing: 'Showing',
      of: 'of',
      delegations_label: 'delegations',
    },
    topics: {
      badge: 'Academic Agenda',
      title: 'Debate Topics by Committee',
      subtitle: 'Global dilemmas rigorously curated to challenge delegates through analytical critical thinking and multilateral negotiation.',
      download_guide: 'Download Study Guide',
      topic_a: 'Topic A',
      topic_b: 'Topic B',
      topic_c: 'Topic C',
    },
    schedule: {
      badge: 'Official Itinerary',
      title: 'Schedule of Activities',
      subtitle: 'Comprehensive agenda of plenary sessions, committee debates, protocolary acts, and closing ceremonies.',
      day: 'Day',
      time: 'Time',
      activity: 'Activity',
      location: 'Venue / Room',
      target: 'Audience',
    },
    documents: {
      badge: 'Download Center',
      title: 'Official Documents & Study Guides',
      subtitle: 'Access the parliamentary rules of procedure, resolution templates, and study guides prepared by the Academic Secretariat.',
      download_btn: 'Download Document',
      category_all: 'All Documents',
    },
    gallery: {
      badge: 'Visual Memories',
      title: 'BIMUN Photo Gallery',
      subtitle: 'Memorable moments of debate, diplomatic caucusing, unmoderated negotiations, and awards ceremonies.',
      filter_all: 'All Photos',
      filter_debates: 'Chamber Debates',
      filter_ceremonies: 'Ceremonies',
      filter_delegates: 'Delegates & Caucuses',
      view_photo: 'View Full Photo',
    },
    team: {
      badge: 'Leadership & Secretariat',
      title: 'BIMUN Organizing Committee',
      subtitle: 'Meet the dedicated team of students and faculty members from Fundación Colegio Bilingüe shaping this conference.',
      secretariat: 'Secretariat & Staff',
      faculty: 'Faculty Advisory Board',
    },
    news: {
      badge: 'News & Bulletins',
      title: 'Official Announcements & Press',
      subtitle: 'Stay up-to-date with communications from the Secretary-General, milestone deadlines, and institutional news.',
      read_more: 'Read full statement',
      published_on: 'Published on',
    },
    registration: {
      badge: 'Official Call for Delegations',
      title: 'Delegate & School Registration',
      subtitle: 'Complete the official registration form to submit your individual or school delegation for BIMUN XXVII.',
      personal_info: '1. Delegate / Representative Details',
      academic_info: '2. School & Academic Profile',
      preferences_info: '3. Committee & Country Preferences',
      additional_info: '4. Logistics & Dietary Information',
      full_name: 'Delegate Full Name',
      full_name_placeholder: 'e.g. John Alexander Smith',
      email: 'Email Address',
      email_placeholder: 'delegate@school.edu',
      phone: 'Phone / WhatsApp',
      phone_placeholder: '+57 300 123 4567',
      school: 'School or Educational Institution',
      school_placeholder: 'Fundación Colegio Bilingüe de Valledupar',
      delegation_type: 'Delegation Type',
      type_individual: 'Individual Delegate',
      type_school: 'School Delegation (Delegation of)',
      type_observer: 'Observer / Faculty Advisor',
      grade: 'School Grade / Academic Level',
      grade_placeholder: 'e.g. 9th, 10th, 11th Grade or University',
      committee_1: 'First Committee Preference',
      committee_2: 'Second Committee Preference (Optional)',
      country_1: 'First Country Preference',
      country_2: 'Second Country Preference (Optional)',
      experience: 'Previous Model UN Experience',
      experience_placeholder: 'List previous BIMUN editions or external MUN conferences...',
      dietary: 'Dietary or Medical Requirements',
      dietary_placeholder: 'Allergies, vegetarian, or special conditions...',
      terms: 'I certify that the provided information is true and accurate, and I agree to uphold the diplomatic dress code and code of conduct of BIMUN.',
      submit_btn: 'Submit Registration Application',
      submitting: 'Processing application...',
      success_title: 'Registration Successfully Submitted!',
      success_message: 'Your application has been received by the Secretariat. Confirmation and payment details will be sent to your email.',
      reg_code: 'Tracking ID:',
      new_reg_btn: 'Submit another application',
    },
    contact: {
      badge: 'Get in Touch',
      title: 'Contact & Conference Venue',
      subtitle: 'Reach out to the Secretariat or visit our main campus at Fundación Colegio Bilingüe de Valledupar.',
      venue_title: 'Main Campus',
      phone_title: 'Phone Lines',
      email_title: 'Institutional Email',
      hours_title: 'Office Hours',
      hours_value: 'Monday to Friday: 7:30 AM - 3:30 PM (COT)',
      form_title: 'Send a Direct Inquiry',
      form_name: 'Your Full Name',
      form_email: 'Your Email Address',
      form_subject: 'Subject / Topic',
      form_message: 'Message or Question',
      send_btn: 'Send Message',
      sending: 'Sending...',
      sent_success: 'Message sent successfully to the Secretariat!',
    },
    footer: {
      tagline: 'Fostering global leaders, ethical diplomats, and peacemakers from Valledupar to the world.',
      quick_links: 'Quick Links',
      academic_links: 'Academic Information',
      admin_title: 'Administration',
      admin_desc: 'Private portal for BIMUN Secretariat and faculty coordinators.',
      rights: 'All rights reserved. Fundación Colegio Bilingüe de Valledupar.',
    },
    admin_modal: {
      title: 'CMS Administrative Access',
      subtitle: 'Enter the Secretariat credentials to manage the conference platform.',
      user_label: 'Username',
      pass_label: 'Password',
      login_btn: 'Sign In to CMS',
      logging_in: 'Authenticating...',
      cancel_btn: 'Cancel',
      error_msg: 'Invalid credentials. Please verify your username and password.',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bimun_language');
    if (saved === 'es' || saved === 'en') return saved;
    return 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bimun_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  useEffect(() => {
    // Optionally update document lang attribute
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'es',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: translations['es'],
    };
  }
  return context;
};
