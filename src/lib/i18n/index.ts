import { getReactiveLanguage, setReactiveLanguage } from './store.svelte.ts';
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'tr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇬🇧', label: '🇬🇧 English' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', label: '🇹🇷 Türkçe' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: '🇩🇪 Deutsch' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: '🇫🇷 Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: '🇪🇸 Español' },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'apps.view_grid': "Grid View",
    'apps.view_list': "List View",
    'apps.view_mode': "View Layout",
    'apps.preview_btn': "Preview",
    'apps.confirm_delete_title': "Delete Application Profile?",
    'apps.confirm_delete_msg': "Are you sure you want to remove the glow profile for {name}? This cannot be undone.",
    'apps.fullscreen_suppressed': "Fullscreen Suppressed",
    'installer.start_on_startup': "Start Curry when Windows starts",
    'updater.cancelled': "Update check was cancelled.",
    'updater.status_checking': "Checking for updates...",
    'settings.theme_group_sapphire': "Sapphire & Ocean Blue",
    'theme.mocha.name': "Mocha Mousse",
    'theme.mocha.desc': "Rich velvety espresso, warm caramel & toasted cocoa",
    'theme.burgundy.name': "Burgundy Wine",
    'theme.burgundy.desc': "Deep royal wine, dark crimson & velvety plum",
    'theme.sakura.name': "Sakura Dawn",
    'theme.sakura.desc': "Soft cherry blossom dawn & delicate rose quartz",
    'theme.violet.name': "Violet Dusk",
    'theme.violet.desc': "Twilight violet dusk & luminous indigo neon",
    'theme.indigo.name': "Indigo Frost",
    'theme.indigo.desc': "Deep midnight navy & high-contrast electric indigo",
    'updater.checking': "Checking for updates...",
    'updater.update_available': "Curry v{version} is available! Ready to install.",
    'updater.downloading': "Downloading update ({progress}%)...",
    'updater.verifying': "Verifying package integrity and cryptographic signature...",
    'updater.ready_to_install': "Update downloaded and verified. Ready to apply.",
    'updater.installing': "Installing update package...",
    'updater.restart_required': "Update installed successfully. Restart Curry to finish.",
    'updater.restart_now': "Restart Now",
    'updater.server_error': "Update server returned an error. Please retry later.",
    'updater.signature_error': "Update signature verification failed. Update rejected for security.",
    'updater.cancel': "Cancel",
    'updater.retry': "Retry",
    'installer.start_on_signin': "Start Curry when I sign in",
    'errors.view_details': "View Details",
    'errors.dismiss': "Dismiss",
    'errors.close': "Close",
    'errors.copy_diagnostics': "Copy Diagnostics",
    'errors.copied': "Copied to Clipboard",
    'errors.what_happened': "What Happened",
    'errors.recommended_action': "Recommended Action",
    'errors.sanitized_diagnostics': "Sanitized Diagnostics",
    'errors.redaction_note': "Personal paths, passwords, and sensitive token values are automatically redacted.",
    'common.active': "Active",
    'common.select_option': "Select an option",

    // Nav tabs
    'nav.dashboard': 'Dashboard',
    'nav.notifications': 'Notifications',
    'nav.apps': 'Apps',
    'nav.glow': 'Glow',
    'nav.settings': 'Settings',

    // Header & Listening
    'header.brand_title': 'Curry',
    'header.brand_tagline': 'Ambient Glow Notification Companion',
    'header.test_glow': 'Test Glow',
    'header.testing': 'Testing...',
    'header.status_active': 'Listening',
    'header.status_paused': 'Paused',
    'header.status_error': 'Service Error',
    'header.status_permission': 'Permission Req',

    // Dashboard
    'dashboard.eyebrow': 'SYSTEM OVERVIEW',
    'dashboard.title': 'Desktop Activity & Glow Pipeline',
    'dashboard.desc': 'Real-time telemetry, notification capture pipeline, and ambient glow status.',
    'dashboard.stat_total': 'Total Captured',
    'dashboard.stat_unread': 'Unread Messages',
    'dashboard.stat_apps': 'Active App Profiles',
    'dashboard.stat_engine': 'Listener Pipeline',
    'dashboard.quick_actions': 'Quick Controls',
    'dashboard.recent_feed': 'Live Notification Feed',
    'dashboard.no_notifications': 'No notifications captured yet.',
    'dashboard.no_notifications_desc': 'Curry will display ambient screen-edge illumination when toasts arrive.',
    'dashboard.clear_all': 'Clear All',
    'dashboard.mark_all_read': 'Mark All as Read',
    'dashboard.test_toast': 'Send Test Toast',
    'dashboard.open_settings': 'Open Settings',

    // Settings
    'settings.eyebrow': 'CONFIGURATION & PREFERENCES',
    'settings.title': 'Application Settings',
    'settings.desc': 'Customize appearance, language, ambient themes, update rules, and native system integration.',
    
    // Appearance & Language Row
    'settings.appearance_mode': 'Appearance Mode',
    'settings.appearance_desc': 'Choose between System theme detection, Light, or Dark mode',
    'settings.appearance_system': 'System',
    'settings.appearance_light': 'Light',
    'settings.appearance_dark': 'Dark',
    
    'settings.language': 'Language',
    'settings.language_desc': 'Select interface language for Curry',
    
    // Themes
    'settings.themes_title': 'Themes & Palette Styling',
    'settings.themes_desc': 'Curated high-contrast ambient palettes inspired by modern design systems',
    'settings.theme_active': 'Active Theme',
    'settings.theme_group_warm': 'Warm & Amber Family',
    'settings.theme_group_monochrome': 'Monochrome Precision (Vercel)',
    'settings.theme_group_cosmic': 'Cosmic Purple & Violet',
    'settings.theme_group_vibrant': 'Electric Magenta & Rose',
    'settings.theme_group_organic': 'Organic Nature & Earth',
    
    // Theme names & descriptions
    'theme.promotor-wow.name': 'Promotor Wow',
    'theme.promotor-wow.desc': 'Deep obsidian navy & electric vibrant orange-coral aura (Default)',
    'theme.amberstate.name': 'Amber',
    'theme.amberstate.desc': 'Molten warm amber & industrial slate steel granite',
    'theme.perpetuity.name': 'Standard',
    'theme.perpetuity.desc': 'Precision monochrome obsidian & electric cyan-indigo glow',
    'theme.amethyst-haze.name': 'Amethyst',
    'theme.amethyst-haze.desc': 'Mystical violet aura, void purple & vivid amethyst',
    'theme.catppuccin.name': 'Catppuccin',
    'theme.catppuccin.desc': 'Soothing pastel lavender, mocha crust & soft mauve',
    'theme.neon-magenta.name': 'Magenta',
    'theme.neon-magenta.desc': 'Cyberpunk midnight void & high-voltage neon magenta radiance',
    'theme.bubblegum.name': 'Bubblegum',
    'theme.bubblegum.desc': 'Vibrant cyber-pop neon rose, velvet berry & berry noir',
    'theme.sage-mist.name': 'Sage',
    'theme.sage-mist.desc': 'Calm botanical forest, evergreen tones & sage mint',
    'theme.zen-linen.name': 'Zen',
    'theme.zen-linen.desc': 'Calm organic linen, airy warm stone & refined sage-moss accents',

    // System Preferences
    'settings.system_prefs': 'System Preferences',
    'settings.startup_title': 'Launch on Startup',
    'settings.startup_desc': 'Start Curry automatically when signing into your desktop',
    'settings.sound_title': 'Notification Sound',
    'settings.sound_desc': 'Play an acoustic chime when screen glow triggers',
    'settings.notifications_title': 'Toast Notifications',
    'settings.notifications_desc': 'Capture and process native system toast notifications',
    'settings.oled_title': 'OLED Panel Protection',
    'settings.oled_desc': 'Caps maximum peak intensity at 60% and narrows border radius to prevent panel wear',
    'settings.fullscreen_title': 'Fullscreen & Gaming Suppression',
    'settings.fullscreen_desc': 'Automatically suppress ambient glow while playing fullscreen games or videos',
    'settings.history_limit': 'History Limit',
    'settings.history_desc': 'Maximum number of recent notifications to retain in memory',

    // Fullscreen behavior options
    'fullscreen.always_show': 'Always Show',
    'fullscreen.always_show_desc': 'Display overlay even during fullscreen windows',
    'fullscreen.suppress_in_fullscreen': 'Suppress in Fullscreen',
    'fullscreen.suppress_in_fullscreen_desc': 'Hide overlay during fullscreen windows',
    'fullscreen.suppress_gaming': 'Suppress Gaming',
    'fullscreen.suppress_gaming_desc': 'Automatically suppress during gaming & fullscreen',

    // Updates
    'settings.updates_title': 'Software Updates',
    'settings.updates_desc': 'Check for signed official releases and auto-install updates',
    'settings.auto_update_enabled': 'Automatic Background Checks',
    'settings.auto_update_enabled_desc': 'Periodically check for official signed updates in the background',
    'settings.frequency_title': 'Check Frequency',
    'settings.frequency_desc': 'How often Curry contacts the update server',
    'settings.frequency_startup': 'At Startup',
    'settings.frequency_startup_desc': 'Check every time Curry opens',
    'settings.frequency_daily': 'Once a Day',
    'settings.frequency_daily_desc': 'Check automatically every 24 hours',
    'settings.frequency_weekly': 'Every Week',
    'settings.frequency_weekly_desc': 'Check automatically every 7 days',
    'settings.frequency_monthly': 'Every Month',
    'settings.frequency_monthly_desc': 'Check automatically every 30 days',
    'settings.check_updates_btn': 'Check for Updates',
    'settings.checking_updates': 'Checking...',
    'settings.install_update_btn': 'Download & Install',
    'settings.installing_update': 'Installing...',

    // Updater feedback messages
    'updater.up_to_date': "You're up to date! Curry is running the latest version.",
    'updater.available': 'Curry v{version} is available! Ready to install.',
    'updater.offline': 'Unable to check for updates: You are currently offline.',
    'updater.no_manifest': 'Update server reached: No new release manifest published.',
    'updater.rate_limited': 'Update check temporarily rate-limited. Please retry shortly.',
    'updater.invalid_signature': 'Update signature verification failed. Update rejected.',
    'updater.network_error': 'Unable to reach update server. Please check your connection.',

    // Glow Configuration Tab
    'glow.eyebrow': 'AMBIENT ILLUMINATION',
    'glow.title': 'Screen-Edge Glow Controls',
    'glow.desc': 'Fine-tune illumination duration, intensity, bezel thickness, corner radius, and animation style.',
    'glow.global_switch': 'Ambient Glow Enabled',
    'glow.global_switch_desc': 'Master toggle controlling screen-edge illumination across all displays',
    'glow.animation_style': 'Animation Style',
    'glow.animation_desc': 'Dynamic kinetic pattern used for screen borders',
    'glow.duration': 'Glow Duration',
    'glow.intensity': 'Glow Intensity',
    'glow.thickness': 'Bezel Thickness',
    'glow.corner_radius': 'Corner Rounding',
    'glow.monitor_target': 'Display Target',
    'glow.color': 'Base Illumination Color',
    'glow.preview': 'Trigger Live Preview',
    'glow.monitor_primary': 'Primary Display',
    'glow.monitor_primary_desc': 'Target primary desktop screen',
    'glow.monitor_active': 'Active Window Display',
    'glow.monitor_active_desc': 'Target monitor with current cursor/active window',
    'glow.monitor_all': 'All Displays',
    'glow.monitor_all_desc': 'Simultaneous ambient glow across all monitors',

    // Animation styles
    'anim.pulse': 'Pulse',
    'anim.pulse_desc': 'Periodic rhythmic breathing pulse',
    'anim.sweep': 'Sweep',
    'anim.sweep_desc': 'Dynamic continuous perimeter travel beam',
    'anim.ambient': 'Ambient',
    'anim.ambient_desc': 'Harmonic low-frequency border glow',
    'anim.comet': 'Comet',
    'anim.comet_desc': 'High-intensity orbiting segment with fading tail',
    'anim.ripple': 'Ripple',
    'anim.ripple_desc': 'Expanding wave radiating outward along screen edge',

    // Applications Tab
    'apps.eyebrow': 'APPLICATION PROFILES',
    'apps.title': 'Per-Application Glow Profiles',
    'apps.desc': 'Override color, animation, duration, and monitor targeting for individual apps.',
    'apps.add_profile': 'Add Profile',
    'apps.search_placeholder': 'Filter application profiles...',
    'apps.no_profiles': 'No application profiles configured yet.',
    'apps.no_profiles_desc': 'Add custom color and animation rules for Discord, Spotify, Steam, and more.',
    'apps.edit': 'Edit',
    'apps.delete': 'Delete',
    'apps.enabled': 'Profile Enabled',
    'apps.modal_add_title': 'New Application Profile',
    'apps.modal_edit_title': 'Edit Application Profile',
    'apps.app_name': 'Application Name',
    'apps.exe_name': 'Executable Name',
    'apps.browse_exe': 'Browse .exe...',
    'apps.override_color': 'Color Override',
    'apps.override_anim': 'Animation Override',
    'apps.override_intensity': 'Intensity Override',
    'apps.override_duration': 'Duration Override',

    // Common Actions
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.just_now': 'Just now',
    'common.seconds_ago': '{n}s ago',
    'common.minutes_ago': '{n}m ago',
    'common.hours_ago': '{n}h ago',
  },

  es: {
    'apps.view_grid': "Vista de Cuadrícula",
    'apps.view_list': "Vista de Lista",
    'apps.view_mode': "Diseño de Vista",
    'apps.preview_btn': "Vista Previa",
    'apps.confirm_delete_title': "¿Eliminar perfil de aplicación?",
    'apps.confirm_delete_msg': "¿Seguro que deseas eliminar el perfil de {name}? Esta acción no se puede deshacer.",
    'apps.fullscreen_suppressed': "Suprimido en pantalla completa",
    'installer.start_on_startup': "Iniciar Curry cuando Windows se inicie",
    'updater.cancelled': "Se canceló la comprobación de actualizaciones.",
    'updater.status_checking': "Buscando actualizaciones...",
    'settings.theme_group_sapphire': "Zafiro y Azul Océano",
    'theme.mocha.name': "Moca Terciopelo",
    'theme.mocha.desc': "Café espresso intenso, caramelo cálido y cacao tostado",
    'theme.burgundy.name': "Borgoña Noir",
    'theme.burgundy.desc': "Vino real profundo, carmesí oscuro y ciruela aterciopelada",
    'theme.sakura.name': "Flor de Sakura",
    'theme.sakura.desc': "Suave amanecer de cerezo en flor y cuarzo rosa",
    'theme.violet.name': "Atardecer Violeta",
    'theme.violet.desc': "Crepúsculo violeta y neón índigo luminoso",
    'theme.indigo.name': "Índigo Polar",
    'theme.indigo.desc': "Azul noche profundo e índigo eléctrico de alto contraste",
    'updater.checking': "Buscando actualizaciones...",
    'updater.update_available': "¡Curry v{version} está disponible! Lista para instalar.",
    'updater.downloading': "Descargando actualización ({progress}%)...",
    'updater.verifying': "Verificando integridad del paquete y firma criptográfica...",
    'updater.ready_to_install': "Actualización descargada y verificada. Lista para aplicar.",
    'updater.installing': "Instalando paquete de actualización...",
    'updater.restart_required': "Actualización instalada correctamente. Reinicia Curry para completar.",
    'updater.restart_now': "Reiniciar Ahora",
    'updater.server_error': "El servidor de actualización devolvió un error. Reintenta más tarde.",
    'updater.signature_error': "Error de verificación de firma. Actualización rechazada por seguridad.",
    'updater.cancel': "Cancelar",
    'updater.retry': "Reintentar",
    'installer.start_on_signin': "Iniciar Curry al iniciar sesión",
    'errors.view_details': "Ver Detalles",
    'errors.dismiss': "Descartar",
    'errors.close': "Cerrar",
    'errors.copy_diagnostics': "Copiar Diagnóstico",
    'errors.copied': "Copiado al Portapapeles",
    'errors.what_happened': "Qué Ocurrió",
    'errors.recommended_action': "Acción Recomendada",
    'errors.sanitized_diagnostics': "Diagnóstico Sanitizado",
    'errors.redaction_note': "Las rutas personales, contraseñas y valores sensibles se ocultan automáticamente.",
    'common.active': "Activo",
    'common.select_option': "Seleccionar una opción",

    // Nav tabs
    'nav.dashboard': 'Panel',
    'nav.notifications': 'Notificaciones',
    'nav.apps': 'Aplicaciones',
    'nav.glow': 'Brillo',
    'nav.settings': 'Ajustes',

    // Header & Listening
    'header.brand_title': 'Curry',
    'header.brand_tagline': 'Compañero de notificaciones con brillo ambiental',
    'header.test_glow': 'Probar Brillo',
    'header.testing': 'Probando...',
    'header.status_active': 'Escuchando',
    'header.status_paused': 'Pausado',
    'header.status_error': 'Error de Servicio',
    'header.status_permission': 'Permiso Requerido',

    // Dashboard
    'dashboard.eyebrow': 'RESUMEN DEL SISTEMA',
    'dashboard.title': 'Actividad del Escritorio y Flujo de Brillo',
    'dashboard.desc': 'Telemetría en tiempo real, captura de notificaciones y estado del brillo ambiental.',
    'dashboard.stat_total': 'Total Capturadas',
    'dashboard.stat_unread': 'Mensajes No Leídos',
    'dashboard.stat_apps': 'Perfiles de Apps Activos',
    'dashboard.stat_engine': 'Flujo de Escucha',
    'dashboard.quick_actions': 'Controles Rápidos',
    'dashboard.recent_feed': 'Canal de Notificaciones en Vivo',
    'dashboard.no_notifications': 'Aún no se han capturado notificaciones.',
    'dashboard.no_notifications_desc': 'Curry iluminará los bordes de la pantalla cuando lleguen avisos.',
    'dashboard.clear_all': 'Borrar Todo',
    'dashboard.mark_all_read': 'Marcar Todo como Leído',
    'dashboard.test_toast': 'Enviar Aviso de Prueba',
    'dashboard.open_settings': 'Abrir Ajustes',

    // Settings
    'settings.eyebrow': 'CONFIGURACIÓN Y PREFERENCIAS',
    'settings.title': 'Ajustes de la Aplicación',
    'settings.desc': 'Personaliza apariencia, idioma, temas ambientales, actualizaciones e integración nativa.',
    
    // Appearance & Language Row
    'settings.appearance_mode': 'Modo de Apariencia',
    'settings.appearance_desc': 'Elige entre detección del sistema, modo Claro u Oscuro',
    'settings.appearance_system': 'Sistema',
    'settings.appearance_light': 'Claro',
    'settings.appearance_dark': 'Oscuro',
    
    'settings.language': 'Idioma',
    'settings.language_desc': 'Selecciona el idioma de la interfaz de Curry',
    
    // Themes
    'settings.themes_title': 'Temas y Paletas de Color',
    'settings.themes_desc': 'Paletas ambientales de alto contraste inspiradas en sistemas de diseño modernos',
    'settings.theme_active': 'Tema Activo',
    'settings.theme_group_warm': 'Familia Cálida y Ámbar',
    'settings.theme_group_monochrome': 'Precisión Monocromática (Vercel)',
    'settings.theme_group_cosmic': 'Púrpura Cósmico y Violeta',
    'settings.theme_group_vibrant': 'Magenta Eléctrico y Rosa',
    'settings.theme_group_organic': 'Naturaleza Orgánica y Tierra',
    
    // Theme names & descriptions
    'theme.promotor-wow.name': 'Promotor Wow',
    'theme.promotor-wow.desc': 'Azul marino obsidiana y aura vibrante coral anaranjado (Predeterminado)',
    'theme.amberstate.name': 'Ámbar',
    'theme.amberstate.desc': 'Ámbar fundido y granito de acero gris industrial',
    'theme.perpetuity.name': 'Estándar',
    'theme.perpetuity.desc': 'Obsidiana monocromática y brillo cian-índigo futurista',
    'theme.amethyst-haze.name': 'Amatista',
    'theme.amethyst-haze.desc': 'Aura violeta mística, púrpura profundo y amatista brillante',
    'theme.catppuccin.name': 'Catppuccin',
    'theme.catppuccin.desc': 'Lavanda pastel relajante, corteza moca y malva suave',
    'theme.neon-magenta.name': 'Magenta',
    'theme.neon-magenta.desc': 'Vacío nocturno ciberpunk y resplandor magenta de alto voltaje',
    'theme.bubblegum.name': 'Chicle Pop',
    'theme.bubblegum.desc': 'Rosa neón ciber-pop vibrante, bayas de terciopelo y mora negra',
    'theme.sage-mist.name': 'Salvia',
    'theme.sage-mist.desc': 'Bosque botánico sereno, tonos perennes y menta salvia',
    'theme.zen-linen.name': 'Zen',
    'theme.zen-linen.desc': 'Lino orgánico tranquilo, piedra cálida y detalles de salvia-musgo',

    // System Preferences
    'settings.system_prefs': 'Preferencias del Sistema',
    'settings.startup_title': 'Ejecutar al Iniciar el Sistema',
    'settings.startup_desc': 'Iniciar Curry automáticamente al iniciar sesión en el escritorio',
    'settings.sound_title': 'Sonido de Notificación',
    'settings.sound_desc': 'Reproducir un sonido suave cuando se activa el brillo de pantalla',
    'settings.notifications_title': 'Notificaciones del Sistema',
    'settings.notifications_desc': 'Capturar y procesar notificaciones nativas de Windows/macOS',
    'settings.oled_title': 'Protección de Pantalla OLED',
    'settings.oled_desc': 'Limita la intensidad máxima al 60% y reduce el borde para prevenir desgaste',
    'settings.fullscreen_title': 'Supresión en Pantalla Completa y Juegos',
    'settings.fullscreen_desc': 'Ocultar automáticamente el brillo durante juegos o vídeos a pantalla completa',
    'settings.history_limit': 'Límite de Historial',
    'settings.history_desc': 'Número máximo de notificaciones recientes conservadas en memoria',

    // Fullscreen behavior options
    'fullscreen.always_show': 'Mostrar Siempre',
    'fullscreen.always_show_desc': 'Mostrar brillo incluso durante ventanas a pantalla completa',
    'fullscreen.suppress_in_fullscreen': 'Suprimir en Pantalla Completa',
    'fullscreen.suppress_in_fullscreen_desc': 'Ocultar brillo en ventanas a pantalla completa',
    'fullscreen.suppress_gaming': 'Suprimir en Juegos',
    'fullscreen.suppress_gaming_desc': 'Suprimir automáticamente en juegos y pantalla completa',

    // Updates
    'settings.updates_title': 'Actualizaciones de Software',
    'settings.updates_desc': 'Buscar versiones oficiales firmadas e instalarlas automáticamente',
    'settings.auto_update_enabled': 'Búsquedas Automáticas en Segundo Plano',
    'settings.auto_update_enabled_desc': 'Buscar periódicamente actualizaciones firmadas oficiales',
    'settings.frequency_title': 'Frecuencia de Búsqueda',
    'settings.frequency_desc': 'Con qué frecuencia Curry contacta al servidor de actualizaciones',
    'settings.frequency_startup': 'Al Iniciar',
    'settings.frequency_startup_desc': 'Comprobar cada vez que Curry se abre',
    'settings.frequency_daily': 'Una vez al Día',
    'settings.frequency_daily_desc': 'Comprobar automáticamente cada 24 horas',
    'settings.frequency_weekly': 'Cada Semana',
    'settings.frequency_weekly_desc': 'Comprobar automáticamente cada 7 días',
    'settings.frequency_monthly': 'Cada Mes',
    'settings.frequency_monthly_desc': 'Comprobar automáticamente cada 30 días',
    'settings.check_updates_btn': 'Buscar Actualizaciones',
    'settings.checking_updates': 'Buscando...',
    'settings.install_update_btn': 'Descargar e Instalar',
    'settings.installing_update': 'Instalando...',

    // Updater feedback messages
    'updater.up_to_date': '¡Estás al día! Curry está ejecutando la última versión.',
    'updater.available': '¡Curry v{version} está disponible! Lista para instalar.',
    'updater.offline': 'No se pudo buscar actualizaciones: Estás desconectado.',
    'updater.no_manifest': 'Servidor alcanzado: No hay nuevo manifiesto de versión publicado.',
    'updater.rate_limited': 'Búsqueda temporalmente limitada por tasa. Reintenta en breve.',
    'updater.invalid_signature': 'Error en la verificación de firma. Actualización rechazada.',
    'updater.network_error': 'No se puede contactar al servidor. Comprueba tu conexión.',

    // Glow Configuration Tab
    'glow.eyebrow': 'ILUMINACIÓN AMBIENTAL',
    'glow.title': 'Controles de Brillo en los Bordes',
    'glow.desc': 'Ajusta la duración, intensidad, grosor, redondeo y animación del brillo perimetral.',
    'glow.global_switch': 'Brillo Ambiental Activado',
    'glow.global_switch_desc': 'Interruptor principal que controla la iluminación perimetral en todas las pantallas',
    'glow.animation_style': 'Estilo de Animación',
    'glow.animation_desc': 'Patrón dinámico utilizado en los bordes de la pantalla',
    'glow.duration': 'Duración del Brillo',
    'glow.intensity': 'Intensidad del Brillo',
    'glow.thickness': 'Grosor del Bisel',
    'glow.corner_radius': 'Redondeo de Esquinas',
    'glow.monitor_target': 'Pantalla de Destino',
    'glow.color': 'Color Base de Iluminación',
    'glow.preview': 'Activar Vista Previa',
    'glow.monitor_primary': 'Pantalla Principal',
    'glow.monitor_primary_desc': 'Dirigir al monitor principal del escritorio',
    'glow.monitor_active': 'Pantalla con Ventana Activa',
    'glow.monitor_active_desc': 'Dirigir al monitor con el cursor o ventana activa',
    'glow.monitor_all': 'Todas las Pantallas',
    'glow.monitor_all_desc': 'Brillo ambiental simultáneo en todos los monitores',

    // Animation styles
    'anim.pulse': 'Pulso',
    'anim.pulse_desc': 'Pulso rítmico periódico y respiración suave',
    'anim.sweep': 'Barrido',
    'anim.sweep_desc': 'Haz de luz en movimiento perimetral continuo en sentido horario',
    'anim.ambient': 'Ambiental',
    'anim.ambient_desc': 'Iluminación suave perimetral constante y armónica',
    'anim.comet': 'Cometa',
    'anim.comet_desc': 'Segmento orbital de alta intensidad con estela en desvanecimiento',
    'anim.ripple': 'Onda',
    'anim.ripple_desc': 'Onda concéntrica que irradia dinámicamente hacia afuera',

    // Applications Tab
    'apps.eyebrow': 'PERFILES DE APLICACIÓN',
    'apps.title': 'Perfiles de Brillo por Aplicación',
    'apps.desc': 'Personaliza color, animación, duración y monitor de destino para cada aplicación.',
    'apps.add_profile': 'Añadir Perfil',
    'apps.search_placeholder': 'Filtrar perfiles de aplicaciones...',
    'apps.no_profiles': 'Aún no hay perfiles configurados.',
    'apps.no_profiles_desc': 'Crea reglas de color y animación personalizadas para Discord, Spotify, Steam y más.',
    'apps.edit': 'Editar',
    'apps.delete': 'Eliminar',
    'apps.enabled': 'Perfil Activado',
    'apps.modal_add_title': 'Nuevo Perfil de Aplicación',
    'apps.modal_edit_title': 'Editar Perfil de Aplicación',
    'apps.app_name': 'Nombre de la Aplicación',
    'apps.exe_name': 'Nombre del Ejecutable',
    'apps.browse_exe': 'Examinar .exe...',
    'apps.override_color': 'Color Personalizado',
    'apps.override_anim': 'Animación Personalizada',
    'apps.override_intensity': 'Intensidad Personalizada',
    'apps.override_duration': 'Duración Personalizada',

    // Common Actions
    'common.save': 'Guardar Cambios',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.delete': 'Eliminar',
    'common.confirm': 'Confirmar',
    'common.search': 'Buscar',
    'common.loading': 'Cargando...',
    'common.just_now': 'Justo ahora',
    'common.seconds_ago': 'Hace {n}s',
    'common.minutes_ago': 'Hace {n}m',
    'common.hours_ago': 'Hace {n}h',
  },

  fr: {
    'apps.view_grid': "Vue Grille",
    'apps.view_list': "Vue Liste",
    'apps.view_mode': "Disposition d'affichage",
    'apps.preview_btn': "Aperçu",
    'apps.confirm_delete_title': "Supprimer le profil d'application ?",
    'apps.confirm_delete_msg': "Voulez-vous vraiment supprimer le profil de {name} ? Cette action est irréversible.",
    'apps.fullscreen_suppressed': "Masqué en plein écran",
    'installer.start_on_startup': "Démarrer Curry au lancement de Windows",
    'updater.cancelled': "La vérification des mises à jour a été annulée.",
    'updater.status_checking': "Recherche de mises à jour...",
    'settings.theme_group_sapphire': "Saphir & Bleu Océan",
    'theme.mocha.name': "Mousse Moka",
    'theme.mocha.desc': "Espresso velouté riche, caramel chaud et cacao torréfié",
    'theme.burgundy.name': "Vin de Bourgogne",
    'theme.burgundy.desc': "Vin royal profond, pourpre sombre et prune veloutée",
    'theme.sakura.name': "Aube de Sakura",
    'theme.sakura.desc': "Aube douce de cerisiers en fleurs et quartz rose délicat",
    'theme.violet.name': "Crépuscule Violet",
    'theme.violet.desc': "Crépuscule violet mystique et néon indigo lumineux",
    'theme.indigo.name': "Givre Indigo",
    'theme.indigo.desc': "Nuit profonde et indigo électrique à haut contraste",
    'updater.checking': "Recherche de mises à jour...",
    'updater.update_available': "Curry v{version} est disponible ! Prêt à installer.",
    'updater.downloading': "Téléchargement de la mise à jour ({progress}%)...",
    'updater.verifying': "Vérification de l'intégrité du paquet et de la signature cryptographique...",
    'updater.ready_to_install': "Mise à jour téléchargée et vérifiée. Prête à être appliquée.",
    'updater.installing': "Installation de la mise à jour en cours...",
    'updater.restart_required': "Mise à jour installée avec succès. Redémarrez Curry pour terminer.",
    'updater.restart_now': "Redémarrer Maintenant",
    'updater.server_error': "Le serveur de mise à jour a renvoyé une erreur. Veuillez réessayer plus tard.",
    'updater.signature_error': "Échec de vérification de signature. Mise à jour rejetée par sécurité.",
    'updater.cancel': "Annuler",
    'updater.retry': "Réessayer",
    'installer.start_on_signin': "Lancer Curry à la connexion",
    'errors.view_details': "Voir les détails",
    'errors.dismiss': "Ignorer",
    'errors.close': "Fermer",
    'errors.copy_diagnostics': "Copier le diagnostic",
    'errors.copied': "Copié dans le presse-papiers",
    'errors.what_happened': "Ce qui s'est passé",
    'errors.recommended_action': "Action recommandée",
    'errors.sanitized_diagnostics': "Diagnostics assainis",
    'errors.redaction_note': "Les chemins personnels, mots de passe et jetons sensibles sont automatiquement masqués.",
    'common.active': "Actif",
    'common.select_option': "Sélectionner une option",

    // Nav tabs
    'nav.dashboard': 'Tableau de bord',
    'nav.notifications': 'Notifications',
    'nav.apps': 'Applications',
    'nav.glow': 'Halo',
    'nav.settings': 'Paramètres',

    // Header & Listening
    'header.brand_title': 'Curry',
    'header.brand_tagline': 'Compagnon de notifications à halo ambiant',
    'header.test_glow': 'Tester le Halo',
    'header.testing': 'Test en cours...',
    'header.status_active': 'À l\'écoute',
    'header.status_paused': 'En pause',
    'header.status_error': 'Erreur de service',
    'header.status_permission': 'Permission requise',

    // Dashboard
    'dashboard.eyebrow': 'VUE D\'ENSEMBLE DU SYSTÈME',
    'dashboard.title': 'Activité du bureau & Pipeline de halo',
    'dashboard.desc': 'Télémétrie en temps réel, capture des notifications et état du halo lumineux.',
    'dashboard.stat_total': 'Total capturé',
    'dashboard.stat_unread': 'Messages non lus',
    'dashboard.stat_apps': 'Profils d\'apps actifs',
    'dashboard.stat_engine': 'Moteur d\'écoute',
    'dashboard.quick_actions': 'Contrôles rapides',
    'dashboard.recent_feed': 'Flux de notifications en direct',
    'dashboard.no_notifications': 'Aucune notification capturée pour l\'instant.',
    'dashboard.no_notifications_desc': 'Curry illuminera les bordures de l\'écran lors de l\'arrivée de messages.',
    'dashboard.clear_all': 'Tout effacer',
    'dashboard.mark_all_read': 'Tout marquer comme lu',
    'dashboard.test_toast': 'Envoyer un test',
    'dashboard.open_settings': 'Ouvrir les paramètres',

    // Settings
    'settings.eyebrow': 'CONFIGURATION & PRÉFÉRENCES',
    'settings.title': 'Paramètres de l\'application',
    'settings.desc': 'Personnalisez l\'apparence, la langue, les thèmes ambiants, les mises à jour et l\'intégration système.',
    
    // Appearance & Language Row
    'settings.appearance_mode': 'Mode d\'apparence',
    'settings.appearance_desc': 'Choisissez entre la détection du système, le mode Clair ou Sombre',
    'settings.appearance_system': 'Système',
    'settings.appearance_light': 'Clair',
    'settings.appearance_dark': 'Sombre',
    
    'settings.language': 'Langue',
    'settings.language_desc': 'Sélectionnez la langue de l\'interface de Curry',
    
    // Themes
    'settings.themes_title': 'Thèmes & Palettes de couleur',
    'settings.themes_desc': 'Palettes d\'ambiance à contraste élevé inspirées des systèmes de design modernes',
    'settings.theme_active': 'Thème actif',
    'settings.theme_group_warm': 'Famille Ambre & Corail',
    'settings.theme_group_monochrome': 'Précision Monochrome (Vercel)',
    'settings.theme_group_cosmic': 'Pourpre & Violet Cosmique',
    'settings.theme_group_vibrant': 'Magenta Électrique & Rose',
    'settings.theme_group_organic': 'Nature Organique & Lin',
    
    // Theme names & descriptions
    'theme.promotor-wow.name': 'Promotor Wow',
    'theme.promotor-wow.desc': 'Bleu nuit obsidienne & aura éclatante corail orangé (Par défaut)',
    'theme.amberstate.name': 'Ambre',
    'theme.amberstate.desc': 'Ambre incandescent & acier ardoisé industriel',
    'theme.perpetuity.name': 'Standard',
    'theme.perpetuity.desc': 'Obsidienne monochrome & halo cyan-indigo futuriste',
    'theme.amethyst-haze.name': 'Brume d\'Améthyste',
    'theme.amethyst-haze.desc': 'Aura violette mystique, pourpre profond & améthyste vive',
    'theme.catppuccin.name': 'Catppuccin',
    'theme.catppuccin.desc': 'Lavande pastel apaisante, croûte moka & mauve délicat',
    'theme.neon-magenta.name': 'Néon Magenta',
    'theme.neon-magenta.desc': 'Vide nocturne cyberpunk & rayonnement magenta haute tension',
    'theme.bubblegum.name': 'Bubblegum',
    'theme.bubblegum.desc': 'Rose néon cyber-pop vibrant, baie veloutée & noir myrtille',
    'theme.sage-mist.name': 'Brume de Sauge',
    'theme.sage-mist.desc': 'Forêt botanique sereine, nuances persistantes & menthe sauge',
    'theme.zen-linen.name': 'Lin Zen',
    'theme.zen-linen.desc': 'Lin organique apaisant, pierre chaude & accents sauge-mousse raffinés',

    // System Preferences
    'settings.system_prefs': 'Préférences Système',
    'settings.startup_title': 'Lancer au démarrage',
    'settings.startup_desc': 'Démarrer Curry automatiquement lors de l\'ouverture de session',
    'settings.sound_title': 'Son de notification',
    'settings.sound_desc': 'Jouer un carillon acoustique subtil lors du déclenchement du halo',
    'settings.notifications_title': 'Notifications système',
    'settings.notifications_desc': 'Intercepter et traiter les notifications natives du bureau',
    'settings.oled_title': 'Protection d\'écran OLED',
    'settings.oled_desc': 'Limite l\'intensité maximale à 60% et réduit l\'épaisseur pour préserver la dalle',
    'settings.fullscreen_title': 'Suppression plein écran & jeux',
    'settings.fullscreen_desc': 'Masquer automatiquement le halo pendant les jeux ou vidéos en plein écran',
    'settings.history_limit': 'Limite d\'historique',
    'settings.history_desc': 'Nombre maximal de notifications conservées en mémoire',

    // Fullscreen behavior options
    'fullscreen.always_show': 'Toujours afficher',
    'fullscreen.always_show_desc': 'Afficher le halo même pendant les fenêtres en plein écran',
    'fullscreen.suppress_in_fullscreen': 'Supprimer en plein écran',
    'fullscreen.suppress_in_fullscreen_desc': 'Masquer le halo pendant les fenêtres en plein écran',
    'fullscreen.suppress_gaming': 'Supprimer en jeu',
    'fullscreen.suppress_gaming_desc': 'Supprimer automatiquement pendant les jeux et le plein écran',

    // Updates
    'settings.updates_title': 'Mises à jour du logiciel',
    'settings.updates_desc': 'Vérifier et installer automatiquement les versions officielles signées',
    'settings.auto_update_enabled': 'Vérification en arrière-plan',
    'settings.auto_update_enabled_desc': 'Vérifier périodiquement les mises à jour signées en arrière-plan',
    'settings.frequency_title': 'Fréquence de vérification',
    'settings.frequency_desc': 'À quelle fréquence Curry interroge le serveur de mise à jour',
    'settings.frequency_startup': 'Au démarrage',
    'settings.frequency_startup_desc': 'Vérifier à chaque ouverture de Curry',
    'settings.frequency_daily': 'Une fois par jour',
    'settings.frequency_daily_desc': 'Vérifier automatiquement toutes les 24 heures',
    'settings.frequency_weekly': 'Chaque semaine',
    'settings.frequency_weekly_desc': 'Vérifier automatiquement tous les 7 jours',
    'settings.frequency_monthly': 'Chaque mois',
    'settings.frequency_monthly_desc': 'Vérifier automatiquement tous les 30 jours',
    'settings.check_updates_btn': 'Vérifier les mises à jour',
    'settings.checking_updates': 'Vérification...',
    'settings.install_update_btn': 'Télécharger & Installer',
    'settings.installing_update': 'Installation...',

    // Updater feedback messages
    'updater.up_to_date': 'Vous êtes à jour ! Curry utilise la version la plus récente.',
    'updater.available': 'Curry v{version} est disponible ! Prêt à installer.',
    'updater.offline': 'Impossible de vérifier : Vous êtes actuellement hors ligne.',
    'updater.no_manifest': 'Serveur joint : Aucun nouveau manifeste de version publié.',
    'updater.rate_limited': 'Vérification temporairement limitée par GitHub. Réessayez bientôt.',
    'updater.invalid_signature': 'Échec de vérification de signature. Mise à jour rejetée.',
    'updater.network_error': 'Impossible de joindre le serveur. Vérifiez votre connexion.',

    // Glow Configuration Tab
    'glow.eyebrow': 'ÉCLAIRAGE AMBIANT',
    'glow.title': 'Contrôles du halo des bordures',
    'glow.desc': 'Ajustez la durée, l\'intensité, l\'épaisseur de la bordure, les arrondis et l\'animation.',
    'glow.global_switch': 'Halo ambiant activé',
    'glow.global_switch_desc': 'Interrupteur principal contrôlant l\'éclairage des bordures sur tous les écrans',
    'glow.animation_style': 'Style d\'animation',
    'glow.animation_desc': 'Motif cinétique appliqué le long du cadre de l\'écran',
    'glow.duration': 'Durée du halo',
    'glow.intensity': 'Intensité du halo',
    'glow.thickness': 'Épaisseur de bordure',
    'glow.corner_radius': 'Arrondi des coins',
    'glow.monitor_target': 'Écran cible',
    'glow.color': 'Couleur de base du halo',
    'glow.preview': 'Déclencher l\'aperçu direct',
    'glow.monitor_primary': 'Écran principal',
    'glow.monitor_primary_desc': 'Cibler le moniteur principal du bureau',
    'glow.monitor_active': 'Écran actif',
    'glow.monitor_active_desc': 'Cibler le moniteur contenant le curseur ou la fenêtre active',
    'glow.monitor_all': 'Tous les écrans',
    'glow.monitor_all_desc': 'Halo ambiant synchronisé sur l\'ensemble des moniteurs',

    // Animation styles
    'anim.pulse': 'Pulsation',
    'anim.pulse_desc': 'Pulsation périodique rythmée et respiration fluide',
    'anim.sweep': 'Balayage',
    'anim.sweep_desc': 'Faisceau continu voyageant dans le sens horaire le long du cadre',
    'anim.ambient': 'Ambiant',
    'anim.ambient_desc': 'Lueur constante et harmonique à basse fréquence',
    'anim.comet': 'Comète',
    'anim.comet_desc': 'Segment orbital haute intensité laissant une traînée dégradée',
    'anim.ripple': 'Ondulation',
    'anim.ripple_desc': 'Onde concentrique rayonnant dynamiquement vers l\'extérieur',

    // Applications Tab
    'apps.eyebrow': 'PROFILS D\'APPLICATIONS',
    'apps.title': 'Profils de halo par application',
    'apps.desc': 'Définissez la couleur, l\'animation, la durée et l\'écran cible pour chaque application.',
    'apps.add_profile': 'Ajouter un profil',
    'apps.search_placeholder': 'Filtrer les profils d\'applications...',
    'apps.no_profiles': 'Aucun profil configuré pour l\'instant.',
    'apps.no_profiles_desc': 'Ajoutez des règles de couleur et d\'animation pour Discord, Spotify, Steam, etc.',
    'apps.edit': 'Modifier',
    'apps.delete': 'Supprimer',
    'apps.enabled': 'Profil activé',
    'apps.modal_add_title': 'Nouveau profil d\'application',
    'apps.modal_edit_title': 'Modifier le profil d\'application',
    'apps.app_name': 'Nom de l\'application',
    'apps.exe_name': 'Nom de l\'exécutable',
    'apps.browse_exe': 'Parcourir .exe...',
    'apps.override_color': 'Couleur personnalisée',
    'apps.override_anim': 'Animation personnalisée',
    'apps.override_intensity': 'Intensité personnalisée',
    'apps.override_duration': 'Durée personnalisée',

    // Common Actions
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'common.just_now': 'À l\'instant',
    'common.seconds_ago': 'Il y a {n}s',
    'common.minutes_ago': 'Il y a {n}m',
    'common.hours_ago': 'Il y a {n}h',
  },

  de: {
    'apps.view_grid': "Rasteransicht",
    'apps.view_list': "Listenansicht",
    'apps.view_mode': "Ansichtslayout",
    'apps.preview_btn': "Vorschau",
    'apps.confirm_delete_title': "Anwendungsprofil löschen?",
    'apps.confirm_delete_msg': "Möchtest du das Profil für {name} wirklich löschen? Dies kann nicht rückgängig gemacht werden.",
    'apps.fullscreen_suppressed': "Im Vollbild unterdrückt",
    'installer.start_on_startup': "Curry beim Start von Windows ausführen",
    'updater.cancelled': "Die Update-Prüfung wurde abgebrochen.",
    'updater.status_checking': "Suche nach Updates...",
    'settings.theme_group_sapphire': "Saphir & Ozeanblau",
    'theme.mocha.name': "Mokka Mousse",
    'theme.mocha.desc': "Samtiger Espresso, warmes Karamell und gerösteter Kakao",
    'theme.burgundy.name': "Burgunderwein",
    'theme.burgundy.desc': "Tiefes Königsrot, dunkles Karminrot und samtige Pflaume",
    'theme.sakura.name': "Sakura Morgengrauen",
    'theme.sakura.desc': "Sanfte Kirschblüten und zartes Rosenquarz",
    'theme.violet.name': "Violetter Abend",
    'theme.violet.desc': "Dämmerungsviolett und leuchtendes Indigo-Neon",
    'theme.indigo.name': "Indigofrost",
    'theme.indigo.desc': "Tiefe Mitternachtsnacht und kontrastreiches Elektro-Indigo",
    'updater.checking': "Suche nach Updates...",
    'updater.update_available': "Curry v{version} ist verfügbar! Bereit zur Installation.",
    'updater.downloading': "Update wird heruntergeladen ({progress}%)...",
    'updater.verifying': "Paketintegrität und kryptografische Signatur werden überprüft...",
    'updater.ready_to_install': "Update heruntergeladen und verifiziert. Bereit zur Installation.",
    'updater.installing': "Update-Paket wird installiert...",
    'updater.restart_required': "Update erfolgreich installiert. Starte Curry neu, um abzuschließen.",
    'updater.restart_now': "Jetzt neu starten",
    'updater.server_error': "Der Update-Server hat einen Fehler gemeldet. Bitte später erneut versuchen.",
    'updater.signature_error': "Signaturprüfung fehlgeschlagen. Update aus Sicherheitsgründen abgelehnt.",
    'updater.cancel': "Abbrechen",
    'updater.retry': "Wiederholen",
    'installer.start_on_signin': "Curry beim Anmelden starten",
    'errors.view_details': "Details anzeigen",
    'errors.dismiss': "Verwerfen",
    'errors.close': "Schließen",
    'errors.copy_diagnostics': "Diagnose kopieren",
    'errors.copied': "In Zwischenablage kopiert",
    'errors.what_happened': "Was ist passiert",
    'errors.recommended_action': "Empfohlene Maßnahme",
    'errors.sanitized_diagnostics': "Bereinigte Diagnose",
    'errors.redaction_note': "Persönliche Pfade, Passwörter und sensible Token werden automatisch unkenntlich gemacht.",
    'common.active': "Aktiv",
    'common.select_option': "Option auswählen",

    // Nav tabs
    'nav.dashboard': 'Übersicht',
    'nav.notifications': 'Benachrichtigungen',
    'nav.apps': 'Apps',
    'nav.glow': 'Leuchten',
    'nav.settings': 'Einstellungen',

    // Header & Listening
    'header.brand_title': 'Curry',
    'header.brand_tagline': 'Ambient Glow Benachrichtigungsbegleiter',
    'header.test_glow': 'Leuchten testen',
    'header.testing': 'Testen...',
    'header.status_active': 'Aktiv',
    'header.status_paused': 'Pausiert',
    'header.status_error': 'Dienstfehler',
    'header.status_permission': 'Berechtigung nötig',

    // Dashboard
    'dashboard.eyebrow': 'SYSTEMÜBERSICHT',
    'dashboard.title': 'Desktop-Aktivität & Glow-Pipeline',
    'dashboard.desc': 'Echtzeit-Telemetrie, Erfassungspipeline und Status des Umgebungsleuchtens.',
    'dashboard.stat_total': 'Gesamt erfasst',
    'dashboard.stat_unread': 'Ungelesene Nachrichten',
    'dashboard.stat_apps': 'Aktive App-Profile',
    'dashboard.stat_engine': 'Listener-Pipeline',
    'dashboard.quick_actions': 'Schnellaktionen',
    'dashboard.recent_feed': 'Live-Benachrichtigungsfeed',
    'dashboard.no_notifications': 'Noch keine Benachrichtigungen erfasst.',
    'dashboard.no_notifications_desc': 'Curry illuminiert die Bildschirmränder, sobald Nachrichten eintreffen.',
    'dashboard.clear_all': 'Alle leeren',
    'dashboard.mark_all_read': 'Alle als gelesen markieren',
    'dashboard.test_toast': 'Testnachricht senden',
    'dashboard.open_settings': 'Einstellungen öffnen',

    // Settings
    'settings.eyebrow': 'KONFIGURATION & EINSTELLUNGEN',
    'settings.title': 'Anwendungseinstellungen',
    'settings.desc': 'Passe Erscheinungsbild, Sprache, Themes, Updates und native Systemintegration an.',
    
    // Appearance & Language Row
    'settings.appearance_mode': 'Erscheinungsbild',
    'settings.appearance_desc': 'Wähle zwischen automatischer Systemerkennung, Hell oder Dunkel',
    'settings.appearance_system': 'System',
    'settings.appearance_light': 'Hell',
    'settings.appearance_dark': 'Dunkel',
    
    'settings.language': 'Sprache',
    'settings.language_desc': 'Wähle die Oberflächensprache für Curry',
    
    // Themes
    'settings.themes_title': 'Themes & Farbpaletten',
    'settings.themes_desc': 'Kontrastreiche Umgebungspaletten inspiriert von modernen Designsystemen',
    'settings.theme_active': 'Aktives Theme',
    'settings.theme_group_warm': 'Warme Bernstein- & Korallenfamilie',
    'settings.theme_group_monochrome': 'Monochrome Präzision (Vercel)',
    'settings.theme_group_cosmic': 'Kosmisches Purpur & Violett',
    'settings.theme_group_vibrant': 'Elektrisches Magenta & Rose',
    'settings.theme_group_organic': 'Organische Natur & Leinen',
    
    // Theme names & descriptions
    'theme.promotor-wow.name': 'Promotor Wow',
    'theme.promotor-wow.desc': 'Tiefes Obsidian-Navy & elektrisierendes Orange-Korallen-Aura (Standard)',
    'theme.amberstate.name': 'Bernstein',
    'theme.amberstate.desc': 'Glühender Bernstein & industrieller Schieferstahl',
    'theme.perpetuity.name': 'Standard',
    'theme.perpetuity.desc': 'Präzises monochromes Obsidian & futuristisches Cyan-Indigo-Leuchten',
    'theme.amethyst-haze.name': 'Amethystdunst',
    'theme.amethyst-haze.desc': 'Mystische violette Aura, tiefes Purpur & lebendiger Amethyst',
    'theme.catppuccin.name': 'Catppuccin',
    'theme.catppuccin.desc': 'Sanftes Pastell-Lavendel, Mokka-Kruste & zartes Mauve',
    'theme.neon-magenta.name': 'Magenta',
    'theme.neon-magenta.desc': 'Cyberpunk-Mitternachtsleere & pulsierendes Hochvolt-Magenta',
    'theme.bubblegum.name': 'Bubblegum',
    'theme.bubblegum.desc': 'Lebendiges Cyber-Pop-Neonrosa, samtige Beere & Brombeerschwarz',
    'theme.sage-mist.name': 'Salbeinebel',
    'theme.sage-mist.desc': 'Ruhiger botanischer Wald, immergrüne Nuancen & Salbeiminze',
    'theme.zen-linen.name': 'Zen Leinen',
    'theme.zen-linen.desc': 'Ruhiges Bio-Leinen, warmer Stein & verfeinerte Salbei-Moos-Akzente',

    // System Preferences
    'settings.system_prefs': 'Systemeinstellungen',
    'settings.startup_title': 'Beim Systemstart ausführen',
    'settings.startup_desc': 'Curry beim Benutzer-Login automatisch starten',
    'settings.sound_title': 'Benachrichtigungston',
    'settings.sound_desc': 'Sanftes akustisches Signal bei Bildschirmrand-Leuchten abspielen',
    'settings.notifications_title': 'Desktop-Benachrichtigungen',
    'settings.notifications_desc': 'Native Windows-/macOS-Benachrichtigungen erfassen und verarbeiten',
    'settings.oled_title': 'OLED-Bildschirmschutz',
    'settings.oled_desc': 'Begrenzt maximale Intensität auf 60% und verringert Randstärke zum Schutz vor Einbrennen',
    'settings.fullscreen_title': 'Vollbild- & Spieleunterdrückung',
    'settings.fullscreen_desc': 'Leuchten während Vollbildanwendungen oder Spielen automatisch ausblenden',
    'settings.history_limit': 'Verlaufslimit',
    'settings.history_desc': 'Maximale Anzahl gespeicherter Benachrichtigungen im Speicher',

    // Fullscreen behavior options
    'fullscreen.always_show': 'Immer anzeigen',
    'fullscreen.always_show_desc': 'Leuchten auch bei Vollbildfenstern anzeigen',
    'fullscreen.suppress_in_fullscreen': 'Im Vollbild unterdrücken',
    'fullscreen.suppress_in_fullscreen_desc': 'Leuchten bei Vollbildfenstern verbergen',
    'fullscreen.suppress_gaming': 'Bei Spielen unterdrücken',
    'fullscreen.suppress_gaming_desc': 'Automatisch bei Spielen und im Vollbild unterdrücken',

    // Updates
    'settings.updates_title': 'Software-Updates',
    'settings.updates_desc': 'Offizielle signierte Versionen automatisch prüfen und installieren',
    'settings.auto_update_enabled': 'Automatische Hintergrundprüfung',
    'settings.auto_update_enabled_desc': 'Regelmäßig im Hintergrund nach signierten Updates suchen',
    'settings.frequency_title': 'Prüfhäufigkeit',
    'settings.frequency_desc': 'Wie oft Curry den Update-Server kontaktiert',
    'settings.frequency_startup': 'Beim Start',
    'settings.frequency_startup_desc': 'Bei jedem Öffnen von Curry prüfen',
    'settings.frequency_daily': 'Einmal täglich',
    'settings.frequency_daily_desc': 'Automatisch alle 24 Stunden prüfen',
    'settings.frequency_weekly': 'Jede Woche',
    'settings.frequency_weekly_desc': 'Automatisch alle 7 Tage prüfen',
    'settings.frequency_monthly': 'Jeden Monat',
    'settings.frequency_monthly_desc': 'Automatisch alle 30 Tage prüfen',
    'settings.check_updates_btn': 'Nach Updates suchen',
    'settings.checking_updates': 'Prüfen...',
    'settings.install_update_btn': 'Herunterladen & Installieren',
    'settings.installing_update': 'Installieren...',

    // Updater feedback messages
    'updater.up_to_date': 'Alles aktuell! Curry läuft auf der neuesten Version.',
    'updater.available': 'Curry v{version} ist verfügbar! Bereit zur Installation.',
    'updater.offline': 'Updateprüfung fehlgeschlagen: Sie sind offline.',
    'updater.no_manifest': 'Server erreichbar: Noch kein neues Versionsmanifest veröffentlicht.',
    'updater.rate_limited': 'Updateprüfung temporär durch GitHub limitiert. Bitte gleich erneut versuchen.',
    'updater.invalid_signature': 'Signaturprüfung fehlgeschlagen. Update abgelehnt.',
    'updater.network_error': 'Update-Server nicht erreichbar. Bitte Verbindung prüfen.',

    // Glow Configuration Tab
    'glow.eyebrow': 'UMGEBUNGSBELEUCHTUNG',
    'glow.title': 'Bildschirmrand-Leuchtsteuerung',
    'glow.desc': 'Feinabstimmung von Leuchtdauer, Intensität, Randstärke, Eckenrundung und Animation.',
    'glow.global_switch': 'Umgebungsleuchten aktiviert',
    'glow.global_switch_desc': 'Hauptschalter zur Steuerung der Bildschirmrandbeleuchtung auf allen Displays',
    'glow.animation_style': 'Animationsstil',
    'glow.animation_desc': 'Kinetisches Muster für die Bildschirmränder',
    'glow.duration': 'Leuchtdauer',
    'glow.intensity': 'Leuchtintensität',
    'glow.thickness': 'Randbreite',
    'glow.corner_radius': 'Eckenrundung',
    'glow.monitor_target': 'Zielbildschirm',
    'glow.color': 'Grundleuchtfarbe',
    'glow.preview': 'Live-Vorschau auslösen',
    'glow.monitor_primary': 'Hauptbildschirm',
    'glow.monitor_primary_desc': 'Auf primären Desktop-Bildschirm anwenden',
    'glow.monitor_active': 'Aktives Fenster Display',
    'glow.monitor_active_desc': 'Auf Bildschirm mit Mauszeiger oder aktivem Fenster anwenden',
    'glow.monitor_all': 'Alle Bildschirme',
    'glow.monitor_all_desc': 'Gleichzeitiges Umgebungsleuchten auf allen Monitoren',

    // Animation styles
    'anim.pulse': 'Pulsieren',
    'anim.pulse_desc': 'Periodisches rhythmisches Atmen und weiches Pulsieren',
    'anim.sweep': 'Schweif',
    'anim.sweep_desc': 'Kontinuierlicher Lichtstrahl im Uhrzeigersinn entlang der Kante',
    'anim.ambient': 'Ambient',
    'anim.ambient_desc': 'Sanfte harmonische Randbeleuchtung mit niedriger Frequenz',
    'anim.comet': 'Komet',
    'anim.comet_desc': 'Helles umlaufendes Segment mit abklingender Schweifspur',
    'anim.ripple': 'Welle',
    'anim.ripple_desc': 'Konzentrische Welle, die dynamisch nach außen abstrahlt',

    // Applications Tab
    'apps.eyebrow': 'ANWENDUNGSPROFILE',
    'apps.title': 'App-spezifische Leuchtprofile',
    'apps.desc': 'Passe Farbe, Animation, Dauer und Zielbildschirm für einzelne Anwendungen an.',
    'apps.add_profile': 'Profil hinzufügen',
    'apps.search_placeholder': 'App-Profile filtern...',
    'apps.no_profiles': 'Noch keine App-Profile eingerichtet.',
    'apps.no_profiles_desc': 'Lege individuelle Leuchtregeln für Discord, Spotify, Steam und mehr fest.',
    'apps.edit': 'Bearbeiten',
    'apps.delete': 'Löschen',
    'apps.enabled': 'Profil aktiviert',
    'apps.modal_add_title': 'Neues Anwendungsprofil',
    'apps.modal_edit_title': 'Anwendungsprofil bearbeiten',
    'apps.app_name': 'Anwendungsname',
    'apps.exe_name': 'Dateiname (.exe)',
    'apps.browse_exe': 'Durchsuchen .exe...',
    'apps.override_color': 'Farbüberschreibung',
    'apps.override_anim': 'Animationsüberschreibung',
    'apps.override_intensity': 'Intensitätsüberschreibung',
    'apps.override_duration': 'Dauerüberschreibung',

    // Common Actions
    'common.save': 'Änderungen speichern',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.delete': 'Löschen',
    'common.confirm': 'Bestätigen',
    'common.search': 'Suchen',
    'common.loading': 'Wird geladen...',
    'common.just_now': 'Gerade eben',
    'common.seconds_ago': 'Vor {n}s',
    'common.minutes_ago': 'Vor {n}m',
    'common.hours_ago': 'Vor {n}h',
  },

  tr: {
    'apps.view_grid': "Izgara Görünümü",
    'apps.view_list': "Liste Görünümü",
    'apps.view_mode': "Görünüm Düzeni",
    'apps.preview_btn': "Önizle",
    'apps.confirm_delete_title': "Uygulama Profili Silinsin mi?",
    'apps.confirm_delete_msg': "{name} için ışıklandırma profilini kaldırmak istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    'apps.fullscreen_suppressed': "Tam Ekranda Bastırılır",
    'installer.start_on_startup': "Windows başladığında Curry'yi başlat",
    'updater.cancelled': "Güncelleme denetimi iptal edildi.",
    'updater.status_checking': "Güncellemeler denetleniyor...",
    'settings.theme_group_sapphire': "Safir ve Okyanus Mavisi",
    'theme.mocha.name': "Moka Mus",
    'theme.mocha.desc': "Yoğun kadifemsi espresso, sıcak karamel ve kavrulmuş kakao",
    'theme.burgundy.name': "Bordo Şarap",
    'theme.burgundy.desc': "Derin asil şarap rengi, koyu kızıl ve kadife erik",
    'theme.sakura.name': "Sakura Şafağı",
    'theme.sakura.desc': "Narin kiraz çiçeği şafağı ve zarif gül kuvars",
    'theme.violet.name': "Alacakaranlık Menekşe",
    'theme.violet.desc': "Alacakaranlık moru ve parlak çivit neonu",
    'theme.indigo.name': "İndigo Ayazı",
    'theme.indigo.desc': "Derin gece mavisi ve yüksek kontrastlı elektrikli çivit",
    'updater.checking': "Güncellemeler denetleniyor...",
    'updater.update_available': "Curry v{version} mevcut! Yüklemeye hazır.",
    'updater.downloading': "Güncelleme indiriliyor (%{progress})...",
    'updater.verifying': "Paket bütünlüğü ve şifreleme imzası doğrulanıyor...",
    'updater.ready_to_install': "Güncelleme indirildi ve doğrulandı. Uygulanmaya hazır.",
    'updater.installing': "Güncelleme paketi yükleniyor...",
    'updater.restart_required': "Güncelleme başarıyla yüklendi. Tamamlamak için Curry'yi yeniden başlatın.",
    'updater.restart_now': "Şimdi Yeniden Başlat",
    'updater.server_error': "Güncelleme sunucusu bir hata döndürdü. Lütfen daha sonra tekrar deneyin.",
    'updater.signature_error': "İmza doğrulama hatası. Güncelleme güvenlik nedeniyle reddedildi.",
    'updater.cancel': "İptal",
    'updater.retry': "Yeniden Dene",
    'installer.start_on_signin': "Oturum açtığımda Curry'yi başlat",
    'errors.view_details': "Ayrıntıları Gör",
    'errors.dismiss': "Kapat",
    'errors.close': "Kapat",
    'errors.copy_diagnostics': "Tanı Kaydını Kopyala",
    'errors.copied': "Panoya Kopyalandı",
    'errors.what_happened': "Ne Oldu",
    'errors.recommended_action': "Önerilen İşlem",
    'errors.sanitized_diagnostics': "Güvenli Tanı Bilgileri",
    'errors.redaction_note': "Kişisel dosya yolları, parolalar ve gizli belirteçler otomatik olarak sansürlenir.",
    'common.active': "Aktif",
    'common.select_option': "Bir seçenek belirleyin",

    // Nav tabs
    'nav.dashboard': 'Panel',
    'nav.notifications': 'Bildirimler',
    'nav.apps': 'Uygulamalar',
    'nav.glow': 'Işıma',
    'nav.settings': 'Ayarlar',

    // Header & Listening
    'header.brand_title': 'Curry',
    'header.brand_tagline': 'Ortam Işıması Bildirim Yardımcısı',
    'header.test_glow': 'Işımayı Dene',
    'header.testing': 'Deneniyor...',
    'header.status_active': 'Dinleniyor',
    'header.status_paused': 'Duraklatıldı',
    'header.status_error': 'Servis Hatası',
    'header.status_permission': 'İzin Gerekli',

    // Dashboard
    'dashboard.eyebrow': 'SİSTEM GENEL BAKIŞI',
    'dashboard.title': 'Masaüstü Aktivitesi ve Işıma Hattı',
    'dashboard.desc': 'Gerçek zamanlı telemetri, bildirim yakalama hattı ve ortam ışıması durumu.',
    'dashboard.stat_total': 'Toplam Yakalanan',
    'dashboard.stat_unread': 'Okunmamış Mesajlar',
    'dashboard.stat_apps': 'Aktif Uygulama Profili',
    'dashboard.stat_engine': 'Dinleme Hattı',
    'dashboard.quick_actions': 'Hızlı Kontroller',
    'dashboard.recent_feed': 'Canlı Bildirim Akışı',
    'dashboard.no_notifications': 'Henüz yakalanan bildirim yok.',
    'dashboard.no_notifications_desc': 'Bildirimler geldiğinde Curry ekran kenarlarını zarifçe aydınlatacaktır.',
    'dashboard.clear_all': 'Tümünü Temizle',
    'dashboard.mark_all_read': 'Tümünü Okundu İşaretle',
    'dashboard.test_toast': 'Test Bildirimi Gönder',
    'dashboard.open_settings': 'Ayarları Aç',

    // Settings
    'settings.eyebrow': 'YAPILANDIRMA VE TERCİHLER',
    'settings.title': 'Uygulama Ayarları',
    'settings.desc': 'Görünüm, dil, ortam temaları, güncelleme kuralları ve yerel sistem entegrasyonunu özelleştirin.',
    
    // Appearance & Language Row
    'settings.appearance_mode': 'Görünüm Modu',
    'settings.appearance_desc': 'Sistem algılama, Açık veya Koyu mod arasında seçim yapın',
    'settings.appearance_system': 'Sistem',
    'settings.appearance_light': 'Açık',
    'settings.appearance_dark': 'Koyu',
    
    'settings.language': 'Dil',
    'settings.language_desc': 'Curry için arayüz dilini seçin',
    
    // Themes
    'settings.themes_title': 'Temalar ve Palet Stili',
    'settings.themes_desc': 'Modern tasarım sistemlerinden ilham alan yüksek kontrastlı ortam paletleri',
    'settings.theme_active': 'Aktif Tema',
    'settings.theme_group_warm': 'Sıcak & Kehribar Ailesi',
    'settings.theme_group_monochrome': 'Monokrom Hassasiyet (Vercel)',
    'settings.theme_group_cosmic': 'Kozmik Mor & Menekşe',
    'settings.theme_group_vibrant': 'Elektrik Macenta & Gül',
    'settings.theme_group_organic': 'Organik Doğa & Keten',
    
    // Theme names & descriptions
    'theme.promotor-wow.name': 'Promotor Wow',
    'theme.promotor-wow.desc': 'Derin obsidyen lacivert & elektrikli canlı turuncu-mercan aurası (Varsayılan)',
    'theme.amberstate.name': 'Kehribar',
    'theme.amberstate.desc': 'Erimiş sıcak kehribar ve endüstriyel arduvaz çelik graniti',
    'theme.perpetuity.name': 'Standart',
    'theme.perpetuity.desc': 'Hassas monokrom obsidyen ve fütüristik camgöbeği-çivit ışıması',
    'theme.amethyst-haze.name': 'Ametist Pusu',
    'theme.amethyst-haze.desc': 'Mistik menekşe aurası, derin mor ve canlı ametist',
    'theme.catppuccin.name': 'Catppuccin',
    'theme.catppuccin.desc': 'Huzurlu pastel lavanta, moka kabuğu ve yumuşak leylak',
    'theme.neon-magenta.name': 'Neon Macenta',
    'theme.neon-magenta.desc': 'Siberpunk gece yarısı boşluğu ve yüksek voltajlı neon macenta parlaklığı',
    'theme.bubblegum.name': 'Sakız Pop',
    'theme.bubblegum.desc': 'Canlı siber-pop neon gül, kadife böğürtlen ve gece meyvesi',
    'theme.sage-mist.name': 'Adaçayı Sisi',
    'theme.sage-mist.desc': 'Sakin botanik orman, her mevsim yeşil tonlar ve adaçayı nanesi',
    'theme.zen-linen.name': 'Zen Keten',
    'theme.zen-linen.desc': 'Sakin organik keten, havadar sıcak taş ve rafine adaçayı-yosun vurguları',

    // System Preferences
    'settings.system_prefs': 'Sistem Tercihleri',
    'settings.startup_title': 'Başlangıçta Çalıştır',
    'settings.startup_desc': 'Masaüstü oturumu açıldığında Curry otomatik olarak başlasın',
    'settings.sound_title': 'Bildirim Sesi',
    'settings.sound_desc': 'Ekran ışıması tetiklendiğinde hafif bir sesli uyarı çalınsın',
    'settings.notifications_title': 'Masaüstü Bildirimleri',
    'settings.notifications_desc': 'Yerel sistem bildirimlerini yakalayın ve işleyin',
    'settings.oled_title': 'OLED Panel Koruması',
    'settings.oled_desc': 'Ekran yanmasını önlemek için tepe yoğunluğu %60 ile sınırlar ve kenar kalınlığını azaltır',
    'settings.fullscreen_title': 'Tam Ekran & Oyun Bastırma',
    'settings.fullscreen_desc': 'Tam ekran oyunlar veya videolar sırasında ortam ışımasını otomatik olarak gizle',
    'settings.history_limit': 'Geçmiş Sınırı',
    'settings.history_desc': 'Bellekte tutulacak maksimum bildirim sayısı',

    // Fullscreen behavior options
    'fullscreen.always_show': 'Her Zaman Göster',
    'fullscreen.always_show_desc': 'Tam ekran pencerelerde bile ışımayı göster',
    'fullscreen.suppress_in_fullscreen': 'Tam Ekranda Gizle',
    'fullscreen.suppress_in_fullscreen_desc': 'Tam ekran pencerelerde ışımayı gizle',
    'fullscreen.suppress_gaming': 'Oyunlarda Gizle',
    'fullscreen.suppress_gaming_desc': 'Oyun ve tam ekran pencerelerde otomatik gizle',

    // Updates
    'settings.updates_title': 'Yazılım Güncellemeleri',
    'settings.updates_desc': 'İmzalı resmi sürümleri denetleyin ve güncellemeleri otomatik yükleyin',
    'settings.auto_update_enabled': 'Arka Planda Otomatik Denetim',
    'settings.auto_update_enabled_desc': 'Arka planda resmi imzalı güncellemeleri düzenli olarak kontrol et',
    'settings.frequency_title': 'Denetim Sıklığı',
    'settings.frequency_desc': 'Curry güncelleme sunucusunu ne sıklıkla kontrol etsin',
    'settings.frequency_startup': 'Açılışta',
    'settings.frequency_startup_desc': 'Curry her açıldığında kontrol et',
    'settings.frequency_daily': 'Günde Bir Kez',
    'settings.frequency_daily_desc': 'Her 24 saatte bir otomatik kontrol et',
    'settings.frequency_weekly': 'Her Hafta',
    'settings.frequency_weekly_desc': 'Her 7 günde bir otomatik kontrol et',
    'settings.frequency_monthly': 'Her Ay',
    'settings.frequency_monthly_desc': 'Her 30 günde bir otomatik kontrol et',
    'settings.check_updates_btn': 'Güncellemeleri Denetle',
    'settings.checking_updates': 'Denetleniyor...',
    'settings.install_update_btn': 'İndir ve Yükle',
    'settings.installing_update': 'Yükleniyor...',

    // Updater feedback messages
    'updater.up_to_date': 'Güncelsiniz! Curry son sürümü çalıştırıyor.',
    'updater.available': 'Curry v{version} mevcut! Yüklemeye hazır.',
    'updater.offline': 'Güncelleme denetlenemedi: Çevrimdışısınız.',
    'updater.no_manifest': 'Sunucuya ulaşıldı: Henüz yayınlanmış yeni bir sürüm bildirimi yok.',
    'updater.rate_limited': 'Güncelleme denetimi geçici olarak sınırlandı. Lütfen birazdan tekrar deneyin.',
    'updater.invalid_signature': 'İmza doğrulaması başarısız oldu. Güncelleme reddedildi.',
    'updater.network_error': 'Güncelleme sunucusuna ulaşılamıyor. Bağlantınızı kontrol edin.',

    // Glow Configuration Tab
    'glow.eyebrow': 'ORTAM AYDINLATMASI',
    'glow.title': 'Ekran Kenarı Işıma Kontrolleri',
    'glow.desc': 'Işıma süresi, yoğunluğu, çerçeve kalınlığı, köşe yuvarlaması ve animasyon stilini hassasça ayarlayın.',
    'glow.global_switch': 'Ortam Işıması Aktif',
    'glow.global_switch_desc': 'Tüm ekranlardaki kenar aydınlatmasını kontrol eden ana anahtar',
    'glow.animation_style': 'Animasyon Stili',
    'glow.animation_desc': 'Ekran kenarlarında kullanılan dinamik hareket deseni',
    'glow.duration': 'Işıma Süresi',
    'glow.intensity': 'Işıma Yoğunluğu',
    'glow.thickness': 'Kenar Kalınlığı',
    'glow.corner_radius': 'Köşe Yuvarlama',
    'glow.monitor_target': 'Hedef Ekran',
    'glow.color': 'Temel Aydınlatma Rengi',
    'glow.preview': 'Canlı Önizleme Tetikle',
    'glow.monitor_primary': 'Birincil Ekran',
    'glow.monitor_primary_desc': 'Birincil masaüstü ekranını hedefle',
    'glow.monitor_active': 'Aktif Pencere Ekranı',
    'glow.monitor_active_desc': 'İmlecin veya aktif pencerenin bulunduğu monitörü hedefle',
    'glow.monitor_all': 'Tüm Ekranlar',
    'glow.monitor_all_desc': 'Tüm monitörlerde eşzamanlı ortam ışıması',

    // Animation styles
    'anim.pulse': 'Nabız',
    'anim.pulse_desc': 'Periyodik ritmik nefes alma ve yumuşak nabız',
    'anim.sweep': 'Süpürme',
    'anim.sweep_desc': 'Ekran çevresi boyunca saat yönünde kesintisiz hareket eden ışık demeti',
    'anim.ambient': 'Ortam',
    'anim.ambient_desc': 'Düşük frekanslı, dengeli ve yumuşak sabit kenar aydınlatması',
    'anim.comet': 'Kuyruklu Yıldız',
    'anim.comet_desc': 'Azalan kuyruk izi bırakan yüksek yoğunluklu yörünge segmenti',
    'anim.ripple': 'Dalga',
    'anim.ripple_desc': 'Dışa doğru dinamik olarak yayılan eşmerkezli dalga',

    // Applications Tab
    'apps.eyebrow': 'UYGULAMA PROFİLLERİ',
    'apps.title': 'Uygulama Başına Işıma Profilleri',
    'apps.desc': 'Ayrı ayrı uygulamalar için renk, animasyon, süre ve ekran hedefi kuralları belirleyin.',
    'apps.add_profile': 'Profil Ekle',
    'apps.search_placeholder': 'Uygulama profillerini filtrele...',
    'apps.no_profiles': 'Henüz yapılandırılmış profil yok.',
    'apps.no_profiles_desc': 'Discord, Spotify, Steam ve diğerleri için özel renk ve animasyon kuralları oluşturun.',
    'apps.edit': 'Düzenle',
    'apps.delete': 'Sil',
    'apps.enabled': 'Profil Aktif',
    'apps.modal_add_title': 'Yeni Uygulama Profili',
    'apps.modal_edit_title': 'Uygulama Profilini Düzenle',
    'apps.app_name': 'Uygulama Adı',
    'apps.exe_name': 'Çalıştırılabilir Dosya (.exe)',
    'apps.browse_exe': 'Gözat (.exe)...',
    'apps.override_color': 'Özel Renk',
    'apps.override_anim': 'Özel Animasyon',
    'apps.override_intensity': 'Özel Yoğunluk',
    'apps.override_duration': 'Özel Süre',

    // Common Actions
    'common.save': 'Değişiklikleri Kaydet',
    'common.cancel': 'İptal',
    'common.close': 'Kapat',
    'common.delete': 'Sil',
    'common.confirm': 'Onayla',
    'common.search': 'Ara',
    'common.loading': 'Yükleniyor...',
    'common.just_now': 'Az önce',
    'common.seconds_ago': '{n} sn önce',
    'common.minutes_ago': '{n} dk önce',
    'common.hours_ago': '{n} sa önce',
  },
};

export type SupportedLocale = SupportedLanguage;

export const LANGUAGE_DROPDOWN_OPTIONS = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'tr', label: '🇹🇷 Türkçe' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'es', label: '🇪🇸 Español' },
];

export const currentLanguage = {
  subscribe(fn: (lang: SupportedLanguage) => void) {
    return subscribeLanguage(fn);
  },
  set(lang: SupportedLanguage) {
    setLanguage(lang);
  }
};

export function initLanguage(): SupportedLanguage {
  return getLanguage();
}

// Global reactive state holder for Svelte 5
let _activeLang: SupportedLanguage = 'en';
const subscribers = new Set<(lang: SupportedLanguage) => void>();

export function getLanguage(): SupportedLanguage {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('curry_language') as SupportedLanguage;
    if (saved && (saved in translations)) {
      _activeLang = saved;
      try {
        setReactiveLanguage(saved);
      } catch {}
    }
  }
  return _activeLang;
}

export function setLanguage(lang: SupportedLanguage): void {
  if (!(lang in translations)) {
    lang = 'en';
  }
  _activeLang = lang;
  try {
    setReactiveLanguage(lang);
  } catch {}
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('curry_language', lang);
    } catch {}
  }
  subscribers.forEach((fn) => fn(lang));
}

export function subscribeLanguage(fn: (lang: SupportedLanguage) => void): () => void {
  subscribers.add(fn);
  fn(_activeLang);
  return () => {
    subscribers.delete(fn);
  };
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  fallbackOrLang?: string,
  maybeLang?: SupportedLanguage
): string {
  let fallback: string | undefined;
  let lang: SupportedLanguage | undefined;
  if (maybeLang) {
    lang = maybeLang;
    fallback = fallbackOrLang;
  } else if (fallbackOrLang && (['en', 'es', 'fr', 'de', 'tr'].includes(fallbackOrLang))) {
    lang = fallbackOrLang as SupportedLanguage;
  } else {
    fallback = fallbackOrLang;
  }
  let current: SupportedLanguage;
  try {
    current = lang || getReactiveLanguage() || _activeLang;
  } catch {
    current = lang || _activeLang;
  }
  const langDict = translations[current] || translations.en;
  let text = langDict[key] ?? translations.en[key] ?? fallback ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * Validates that all translation dictionaries contain every key from the English base dictionary.
 * Throws or returns detailed report.
 */
export function validateTranslations(): { valid: boolean; missingKeys: Record<SupportedLanguage, string[]> } {
  const enKeys = Object.keys(translations.en);
  const missingKeys: Record<SupportedLanguage, string[]> = {
    en: [],
    es: [],
    fr: [],
    de: [],
    tr: [],
  };

  let valid = true;
  for (const lang of (['es', 'fr', 'de', 'tr'] as SupportedLanguage[])) {
    const dict = translations[lang];
    for (const key of enKeys) {
      if (!dict[key]) {
        missingKeys[lang].push(key);
        valid = false;
      }
    }
  }

  return { valid, missingKeys };
}
