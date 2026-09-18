import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { AboutSection } from './components/AboutSection.tsx';
import { CommitteesSection } from './components/CommitteesSection.tsx';
import { DelegationsMatrix } from './components/DelegationsMatrix.tsx';
import { TopicsSection } from './components/TopicsSection.tsx';
import { ScheduleSection } from './components/ScheduleSection.tsx';
import { DocumentsSection } from './components/DocumentsSection.tsx';
import { GallerySection } from './components/GallerySection.tsx';
import { TeamSection } from './components/TeamSection.tsx';
import { NewsSection } from './components/NewsSection.tsx';
import { RegistrationForm } from './components/RegistrationForm.tsx';
import { ContactSection } from './components/ContactSection.tsx';
import { Footer } from './components/Footer.tsx';
import { AdminLoginModal } from './components/admin/AdminLoginModal.tsx';
import { MaintenanceView } from './components/common/MaintenanceView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { ScrollToTopButton } from './components/ScrollToTopButton.tsx';
import { FloatingThemeToggle } from './components/common/FloatingThemeToggle.tsx';
import { ScrollReveal } from './components/common/ScrollReveal.tsx';
import { IntroSplash } from './components/common/IntroSplash.tsx';
import { GlobalSearchModal } from './components/common/GlobalSearchModal.tsx';
import { PublicDataResponse, AdminUser } from './types.ts';

export default function App() {
  const [data, setData] = useState<PublicDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#cms') {
      return false;
    }
    return true;
  });

  // CMS state
  const [currentView, setCurrentView] = useState<'public' | 'cms'>('public');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('bimun_admin_token'));
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('bimun_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Pre-fill state for registrations
  const [selectedRegCommittee, setSelectedRegCommittee] = useState<string>('');
  const [selectedRegCountry, setSelectedRegCountry] = useState<string>('');

  const fetchPublicData = async () => {
    try {
      const res = await fetch('/api/public/data');
      if (!res.ok) throw new Error('Error al cargar la información del BIMUN');
      const json: PublicDataResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error al comunicarse con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();

    // Check if token is valid
    const token = localStorage.getItem('bimun_admin_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) {
            localStorage.removeItem('bimun_admin_token');
            localStorage.removeItem('bimun_admin_user');
            setAdminToken(null);
            setAdminUser(null);
          }
        })
        .catch(() => {});
    }

    // Check URL hash for direct CMS route
    if (window.location.hash === '#cms') {
      if (token) {
        setCurrentView('cms');
      } else {
        setIsLoginModalOpen(true);
      }
    }

    // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Dynamic SEO and Social Metadata synchronization with browser Head (applet-seo)
  useEffect(() => {
    if (!data?.settings) return;
    const settings = data.settings;

    // 1. Dynamic document/page Title
    if (settings.meta_title) {
      document.title = settings.meta_title;
    } else if (settings.bimun_name) {
      document.title = `${settings.bimun_name} – ${settings.slogan || 'Modelo de Naciones Unidas'}`;
    }

    // 1b. Dynamic document/page Favicon to match the official Logo uploaded in CMS settings
    if (settings.logo_url) {
      let faviconLink = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.setAttribute('rel', 'icon');
        document.head.appendChild(faviconLink);
      }
      faviconLink.setAttribute('href', settings.logo_url);
    }

    const updateMetaTag = (selector: string, attributeName: string, attributeValue: string, contentValue: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // 2. Meta description & keywords
    if (settings.meta_description) {
      updateMetaTag('meta[name="description"]', 'name', 'description', settings.meta_description);
    }
    if (settings.meta_keywords) {
      updateMetaTag('meta[name="keywords"]', 'name', 'keywords', settings.meta_keywords);
    }

    // 3. OpenGraph tags
    if (settings.meta_title) {
      updateMetaTag('meta[property="og:title"]', 'property', 'og:title', settings.meta_title);
    }
    if (settings.meta_description) {
      updateMetaTag('meta[property="og:description"]', 'property', 'og:description', settings.meta_description);
    }
    if (settings.og_image_url) {
      updateMetaTag('meta[property="og:image"]', 'property', 'og:image', settings.og_image_url);
    }
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.origin + window.location.pathname);

    // 4. Twitter tags
    updateMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    if (settings.meta_title) {
      updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', settings.meta_title);
    }
    if (settings.meta_description) {
      updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', settings.meta_description);
    }
    if (settings.og_image_url) {
      updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', settings.og_image_url);
    }
    if (settings.twitter_handle) {
      updateMetaTag('meta[name="twitter:creator"]', 'name', 'twitter:creator', settings.twitter_handle);
    }

    // 5. Schema.org JSON-LD structured data injection
    if (settings.schema_json) {
      let scriptElement = document.querySelector('script[id="bimun-seo-jsonld"]');
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'application/ld+json');
        scriptElement.setAttribute('id', 'bimun-seo-jsonld');
        document.head.appendChild(scriptElement);
      }
      try {
        // Validate JSON before injection
        const parsed = JSON.parse(settings.schema_json);
        scriptElement.textContent = JSON.stringify(parsed, null, 2);
      } catch (err) {
        scriptElement.textContent = settings.schema_json;
      }
    }
  }, [data?.settings]);

  const handleLoginSuccess = (token: string, user: AdminUser) => {
    setAdminToken(token);
    setAdminUser(user);
    setCurrentView('cms');
  };

  const handleLogout = () => {
    localStorage.removeItem('bimun_admin_token');
    localStorage.removeItem('bimun_admin_user');
    setAdminToken(null);
    setAdminUser(null);
    setCurrentView('public');
    window.location.hash = '';
  };

  const handleSelectCommitteeForRegister = (committeeName: string) => {
    setSelectedRegCommittee(committeeName);
    const element = document.getElementById('inscripciones');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectDelegationForRegister = (committeeName: string, countryName: string) => {
    setSelectedRegCommittee(committeeName);
    setSelectedRegCountry(countryName);
    const element = document.getElementById('inscripciones');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If showing intro animation, display it with data synchronization
  if (showIntro) {
    return (
      <IntroSplash
        settings={data?.settings || null}
        isDataReady={!loading && !!data}
        onFinish={() => setShowIntro(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="font-display text-xl font-bold tracking-wider">Cargando Plataforma BIMUN</h2>
        <p className="text-xs text-slate-400 mt-1">Fundación Colegio Bilingüe de Valledupar...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white text-center">
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 max-w-md space-y-3">
          <p className="font-bold text-sm">Ocurrió un error al cargar la información institucional</p>
          <p className="text-xs text-rose-400">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchPublicData();
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { settings, about, committees, countries, delegations, schedule, documents, gallery, team, news } = data;

  const isSectionActive = (esKey: string, enKey?: string): boolean => {
    if (!settings || !settings.active_sections) return true;
    const act = settings.active_sections as Record<string, any>;
    if (act[esKey] !== undefined) return Boolean(act[esKey]);
    if (enKey && act[enKey] !== undefined) return Boolean(act[enKey]);
    return true;
  };

  // If in CMS view and authenticated
  if (currentView === 'cms' && adminToken && adminUser) {
    return (
      <AdminDashboard
        token={adminToken}
        user={adminUser}
        onLogout={handleLogout}
        onReturnToPublic={() => {
          setCurrentView('public');
          window.location.hash = '';
        }}
        onDataUpdated={fetchPublicData}
      />
    );
  }

  // If in maintenance mode and NOT logged in as admin, show maintenance splash
  if (settings?.maintenance_mode && !adminToken) {
    return (
      <>
        <MaintenanceView
          settings={settings}
          onOpenCMS={() => setIsLoginModalOpen(true)}
        />
        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
        <FloatingThemeToggle />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white font-sans transition-colors duration-300">
      {/* Institutional Navigation Bar */}
      <Navbar
        settings={settings}
        onOpenCMS={() => {
          if (adminToken && adminUser) {
            setCurrentView('cms');
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        isAdminLoggedIn={!!(adminToken && adminUser)}
        onGoToCMS={() => setCurrentView('cms')}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Hero Header Section */}
      <Hero
        settings={settings}
        committeesCount={committees?.length || 0}
        countriesCount={countries?.length || 0}
      />

      {/* Main Public Content Sections based on CMS settings toggles */}
      <main className="flex-1">
        {isSectionActive('nosotros', 'about') && (
          <ScrollReveal>
            <AboutSection aboutItems={about || []} />
          </ScrollReveal>
        )}

        {isSectionActive('comisiones', 'committees') && (
          <ScrollReveal>
            <CommitteesSection
              committees={committees || []}
              onSelectCommitteeForRegister={handleSelectCommitteeForRegister}
            />
          </ScrollReveal>
        )}

        {isSectionActive('delegaciones', 'delegations') && (
          <ScrollReveal>
            <DelegationsMatrix
              delegations={delegations || []}
              committees={committees || []}
              onSelectDelegationForRegister={handleSelectDelegationForRegister}
            />
          </ScrollReveal>
        )}

        {isSectionActive('temas', 'topics') && (
          <ScrollReveal>
            <TopicsSection committees={committees || []} />
          </ScrollReveal>
        )}

        {isSectionActive('cronograma', 'schedule') && (
          <ScrollReveal>
            <ScheduleSection schedule={schedule || []} />
          </ScrollReveal>
        )}

        {isSectionActive('documentos', 'documents') && (
          <ScrollReveal>
            <DocumentsSection documents={documents || []} />
          </ScrollReveal>
        )}

        {isSectionActive('galeria', 'gallery') && (
          <ScrollReveal>
            <GallerySection gallery={gallery || []} configuredCategories={settings?.gallery_categories} />
          </ScrollReveal>
        )}

        {isSectionActive('comite', 'team') && (
          <ScrollReveal>
            <TeamSection team={team || []} />
          </ScrollReveal>
        )}

        {isSectionActive('noticias', 'news') && (
          <ScrollReveal>
            <NewsSection news={news || []} />
          </ScrollReveal>
        )}

        {isSectionActive('inscripciones', 'registrations') && (
          <ScrollReveal id="inscripciones">
            <RegistrationForm
              committees={committees || []}
              countries={countries || []}
              initialCommittee={selectedRegCommittee}
              initialCountry={selectedRegCountry}
            />
          </ScrollReveal>
        )}

        {isSectionActive('contacto', 'contact') && (
          <ScrollReveal>
            <ContactSection settings={settings} />
          </ScrollReveal>
        )}
      </main>

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenCMS={() => setIsLoginModalOpen(true)}
        isAdminLoggedIn={!!(adminToken && adminUser)}
        onGoToCMS={() => setCurrentView('cms')}
        onReplayIntro={() => setShowIntro(true)}
      />

      {/* Global Intelligent Search Spotlight Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        data={data}
        onSelectCommitteeForRegister={handleSelectCommitteeForRegister}
      />

      {/* CMS Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Floating Theme Switcher & Scroll to Top Button */}
      <FloatingThemeToggle />
      <ScrollToTopButton />
    </div>
  );
}
