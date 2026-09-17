export interface BIMUNSettings {
  bimun_name: string;
  bimun_edition: string;
  institution_name: string;
  institution_short: string;
  slogan: string;
  hero_tagline: string;
  hero_subtext: string;
  event_date_display: string;
  event_dates_iso: { start: string; end: string } | string;
  start_date?: string;
  end_date?: string;
  inauguration_time?: string;
  venue: string;
  venue_city: string;
  logo_url: string;
  logo_size?: number; // Size in pixels for navbar logo (e.g. 36 to 96, default ~56)
  hero_bg_image: string;
  hero_video_url?: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  instagram_url: string;
  youtube_url: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
  cta_tertiary_text: string;
  cta_tertiary_link: string;
  active_sections: {
    inicio: boolean;
    nosotros: boolean;
    comisiones: boolean;
    delegaciones: boolean;
    temas: boolean;
    cronograma: boolean;
    documentos: boolean;
    galeria: boolean;
    comite: boolean;
    noticias: boolean;
    inscripciones: boolean;
    contacto: boolean;
  };
  gallery_categories?: string[];
}

export interface AboutSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  icon: string;
  sort_order: number;
  is_active: number;
}

export interface Committee {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  description: string;
  image_url: string;
  language: string;
  topic_a: string;
  topic_b: string;
  topic_c: string;
  president_name: string;
  president_photo: string;
  vicepresident_name: string;
  vicepresident_photo: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  sort_order: number;
  created_at?: string;
}

export interface Country {
  id: string;
  name: string;
  official_name: string;
  code: string;
  flag_emoji: string;
  flag_url: string;
  additional_info: string;
  status: 'active' | 'inactive';
}

export interface Delegation {
  id: string;
  committee_id: string;
  country_id: string;
  delegate_name: string;
  delegate_school: string;
  delegate_email: string;
  delegate_phone: string;
  status: 'available' | 'assigned' | 'reserved';
  notes: string;
  created_at?: string;
  // Joined fields
  committee_name?: string;
  committee_abbr?: string;
  committee_language?: string;
  country_name?: string;
  country_code?: string;
  flag_emoji?: string;
  flag_url?: string;
}

export interface ScheduleItem {
  id: string;
  day_label: string;
  date: string;
  time_start: string;
  time_end: string;
  activity: string;
  description: string;
  location: string;
  audience: string;
  sort_order: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  file_url: string;
  description: string;
  file_size: string;
  is_featured: number;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  category: string;
  edition: string;
  sort_order: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: string;
  photo_url: string;
  bio: string;
  email: string;
  sort_order: number;
}

export interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  publish_date: string;
  is_published: number;
}

export interface Registration {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  school: string;
  delegation_type: 'individual' | 'delegacion_colegial' | 'observador';
  grade: string;
  committee_preference_1: string;
  committee_preference_2: string;
  country_preference_1: string;
  country_preference_2: string;
  experience: string;
  dietary_medical: string;
  emergency_contact: string;
  payment_receipt?: string;
  status: 'pending' | 'approved' | 'assigned' | 'rejected';
  assigned_committee_id: string;
  assigned_country_id: string;
  notes: string;
  created_at: string;
}

export interface PublicDataPayload {
  settings: BIMUNSettings;
  about: AboutSection[];
  committees: Committee[];
  countries: Country[];
  delegations: Delegation[];
  schedule: ScheduleItem[];
  documents: DocumentItem[];
  gallery: GalleryItem[];
  team: TeamMember[];
  news: NewsItem[];
}

export type PublicDataResponse = PublicDataPayload;

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  role: string;
}

export interface UserAccount {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'superadmin' | 'coordinador' | 'academico' | 'prensa';
  created_at: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  has_password?: boolean;
  from_name: string;
  reply_to?: string;
  is_enabled: boolean;
}

export interface SmtpStatus {
  configured: boolean;
  host: string;
  port: number;
  user: string;
  from_name: string;
  is_enabled: boolean;
}

export type DatabaseEngineType = 'sqlite' | 'postgres' | 'mysql';

export interface DatabaseStatus {
  activeType: DatabaseEngineType;
  configuredType: DatabaseEngineType;
  isConnected: boolean;
  host?: string;
  database?: string;
  error?: string | null;
  sqliteFallback: boolean;
}

export interface DatabaseConfig {
  type: DatabaseEngineType;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
}

