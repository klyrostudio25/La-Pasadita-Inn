/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MapPin,
  Clock,
  Star,
  Award,
  Flame,
  Check,
  ChevronRight,
  X,
  Plus,
  Minus,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  Info,
  Search,
  User,
  Instagram,
  Facebook,
  Twitter,
  Copy,
  Database,
  ChefHat,
  Bell,
  RefreshCw,
  CheckCircle2,
  Code,
  RotateCcw,
  Receipt,
  Calendar,
  Menu as MenuIcon,
  Shield,
  Lock,
  Play,
  Utensils,
  ChevronLeft,
  Users
} from 'lucide-react';
import {
  supabase,
  isConfigured,
  SUPABASE_URL,
  saveRuntimeCredentials,
  clearRuntimeCredentials,
  MenuItemRecord,
  OrderRecord,
  ReservationRecord,
  SiteSettingsRecord,
  DEFAULT_SITE_SETTINGS
} from './lib/supabase';
import { AdminDashboard } from './components/AdminDashboard';

// High-resolution culinary food assets
const IMAGES = {
  heroRelleno: '/src/assets/images/hero_chile_relleno_1792550221170.jpg',
  kitchenStory: '/src/assets/images/la_pasadita_story_kitchen_1792550223270.jpg',
  fajitas: '/src/assets/images/sizzling_fajitas_skillet_1792550222395.jpg',
  pozole: '/src/assets/images/pozole_rojo_bowl_1792550223047.jpg',
  streetTacos: '/src/assets/images/street_tacos_platter_1792550349202.jpg',
  desserts: '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg',
};

export interface FeaturedHeroSlide {
  id: string;
  tagline: string;
  lines: [string, string, string];
  servings: string;
  prepTime: string;
  cookTime: string;
  price: number;
  image: string;
  dishRefId: string;
  description: string;
  badge: string;
}

const FEATURED_HERO_SLIDES: FeaturedHeroSlide[] = [
  {
    id: 'slide-1',
    tagline: 'for authentic denver flavor',
    lines: [
      'Crispy Chile Rellenos',
      'With House Green Chile',
      'And Warm Tortillas'
    ],
    servings: '2 guests',
    prepTime: '15 m',
    cookTime: '25 m',
    price: 15.19,
    image: IMAGES.heroRelleno,
    dishRefId: '11111111-1111-1111-1111-111111111111',
    description: 'Fresh roasted poblano pepper stuffed with molten Monterey Jack cheese, crispy comal fried in home-style batter, smothered in house pork green chile.',
    badge: "Grandma's Favorite"
  },
  {
    id: 'slide-2',
    tagline: 'for rich heritage comfort',
    lines: [
      'Pozole Rojo Tradicional',
      'With Slow-Simmered Pork',
      'Hominy And Fresh Lime'
    ],
    servings: '1-2 guests',
    prepTime: '20 m',
    cookTime: '45 m',
    price: 14.99,
    image: IMAGES.pozole,
    dishRefId: '55555555-5555-5555-5555-555555555555',
    description: 'Rich guajillo and ancho chile broth, tender pork shoulder, white cacahuazintle hominy, fresh oregano, shredded cabbage, and lime.',
    badge: 'Traditional Comfort'
  },
  {
    id: 'slide-3',
    tagline: 'for sizzling comal feast',
    lines: [
      'Sizzling Steak Fajitas',
      'With Blistered Peppers',
      'And Fresh Guacamole'
    ],
    servings: '2-3 guests',
    prepTime: '15 m',
    cookTime: '20 m',
    price: 17.99,
    image: IMAGES.fajitas,
    dishRefId: '22222222-2222-2222-2222-222222222222',
    description: 'Choice of seasoned Chicken, tender flank Steak, or wild Gulf Shrimp served on a piping hot comal skillet with grilled bell peppers and sweet onions.',
    badge: 'Popular'
  },
  {
    id: 'slide-4',
    tagline: 'for legendary landmark cravings',
    lines: [
      'Smothered Burrito',
      'With House Pork Chile',
      'And Melted Jack Cheese'
    ],
    servings: '1-2 guests',
    prepTime: '10 m',
    cookTime: '15 m',
    price: 14.99,
    image: IMAGES.heroRelleno,
    dishRefId: '44444444-4444-4444-4444-444444444444',
    description: 'Warm flour tortilla packed with seasoned beef, pinto beans, and rice, generously smothered edge-to-edge in legendary Denver green chile.',
    badge: 'Denver Icon'
  }
];

// Seed/Fallback Menu Items
const FALLBACK_MENU_ITEMS: MenuItemRecord[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    category_id: 'cat-specials',
    name: 'Crispy Chile Rellenos',
    spanish_name: 'Rellenos Crujientes de la Casa',
    description: 'Fresh roasted poblano pepper stuffed with molten Monterey Jack cheese, crispy fried in home-style batter, and generously smothered in house pork green chile.',
    price: 15.19,
    badge: "Grandma's Favorite",
    is_available: true,
    image_url: IMAGES.heroRelleno,
    spice_level: 'Medium',
    grandma_note: 'Denver-style crispy comal fried. Served with Spanish rice and refried pinto beans.',
    categories: { id: 'cat-specials', name: 'Signature Specials', display_order: 1 }
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    category_id: 'cat-specials',
    name: 'Sizzling Fajitas',
    spanish_name: 'Fajitas al Comal Caliente',
    description: 'Choice of seasoned Chicken, tender flank Steak, or wild Gulf Shrimp served on a piping hot skillet with grilled bell peppers, onions, Spanish rice, beans, and warm tortillas.',
    price: 17.99,
    badge: 'Popular',
    is_available: true,
    image_url: IMAGES.fajitas,
    spice_level: 'Mild',
    grandma_note: 'Arrives smoking hot with lime wedges and house guacamole.',
    categories: { id: 'cat-specials', name: 'Signature Specials', display_order: 1 }
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    category_id: 'cat-specials',
    name: 'Homemade Tamales Plate',
    spanish_name: 'Platillo de Tamales Caseros',
    description: 'Traditional pork or tender chicken tamales hand-wrapped in corn husks, steamed daily, topped with grandma’s famous green chile sauce and melted Jack cheese.',
    price: 14.99,
    badge: 'House Special',
    is_available: true,
    image_url: IMAGES.kitchenStory,
    spice_level: 'Medium',
    grandma_note: 'Hand-ground masa steamed fresh every morning.',
    categories: { id: 'cat-specials', name: 'Signature Specials', display_order: 1 }
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    category_id: 'cat-specials',
    name: 'Smothered Green Chile Burrito',
    spanish_name: 'Burrito Ahogado en Chile Verde',
    description: 'Warm flour tortilla packed with choice of savory meat, pinto beans, and rice, generously smothered edge-to-edge in legendary Denver green chile and melted cheese.',
    price: 14.99,
    badge: "Grandma's Favorite",
    is_available: true,
    image_url: IMAGES.heroRelleno,
    spice_level: 'Fiery',
    grandma_note: 'Fork-and-knife classic. A local Denver staple.',
    categories: { id: 'cat-specials', name: 'Signature Specials', display_order: 1 }
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    category_id: 'cat-tacos',
    name: 'Street Tacos',
    spanish_name: 'Tacos Callejeros al Pastor y Asada',
    description: 'Double warm corn tortillas stuffed with Carne Asada, Al Pastor with pineapple, Pollo, Carnitas, or Chorizo. Topped with cilantro, diced onions, and fresh lime.',
    price: 3.75,
    badge: 'Popular',
    is_available: true,
    image_url: IMAGES.streetTacos,
    spice_level: 'Medium',
    grandma_note: 'Served with grilled jalapeño and charred scallions.',
    categories: { id: 'cat-tacos', name: 'Tacos & Tortas', display_order: 2 }
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    category_id: 'cat-tacos',
    name: 'Mexican Torta',
    spanish_name: 'Torta Tradicional en Pan Bollito',
    description: 'Toasted warm bollito roll layered with slow-simmered refried beans, choice of meat, crisp lettuce, ripe tomato, creamy avocado slices, and queso panela.',
    price: 14.99,
    badge: 'Popular',
    is_available: true,
    image_url: IMAGES.streetTacos,
    spice_level: 'Mild',
    grandma_note: 'Crisped on the flat-top with butter until golden and flaky.',
    categories: { id: 'cat-tacos', name: 'Tacos & Tortas', display_order: 2 }
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    category_id: 'cat-soups',
    name: 'Pozole Rojo',
    spanish_name: 'Pozole Tradicional de Puerco',
    description: 'Traditional slow-simmered pork shoulder and white hominy soup in a rich red chili broth, garnished with fresh shredded cabbage, radishes, oregano, and crispy tostadas.',
    price: 14.99,
    badge: "Grandma's Favorite",
    is_available: true,
    image_url: IMAGES.pozole,
    spice_level: 'Warm Spice',
    grandma_note: 'Simmered overnight for 10 hours for maximum richness.',
    categories: { id: 'cat-soups', name: 'Caldos & Soups', display_order: 3 }
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    category_id: 'cat-drinks',
    name: 'House Margaritas',
    spanish_name: 'Margaritas Clásicas de Tequila',
    description: '100% blue agave tequila shaken with fresh lime juice, organic agave nectar, and orange liqueur. Available on the rocks with a salted rim or blended frozen.',
    price: 9.00,
    badge: 'Popular',
    is_available: true,
    image_url: IMAGES.desserts,
    spice_level: 'Refreshing',
    grandma_note: 'Made with fresh-squeezed limes.',
    categories: { id: 'cat-drinks', name: 'Drinks & Desserts', display_order: 4 }
  }
];

const FALLBACK_ORDERS: OrderRecord[] = [
  {
    id: 'ord-denver-782',
    customer_name: 'Carlos Mendoza',
    customer_phone: '(303) 819-4421',
    order_type: 'Takeout',
    total_amount: 33.18,
    status: 'pending',
    notes: 'Extra house green chile on the side please! Smothered rellenos.',
    created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-demo-1',
        order_id: 'ord-denver-782',
        menu_item_id: '11111111-1111-1111-1111-111111111111',
        item_name: 'Crispy Chile Rellenos',
        quantity: 2,
        unit_price: 15.19
      }
    ]
  },
  {
    id: 'ord-denver-641',
    customer_name: 'Elena Vance',
    customer_phone: '(720) 459-8812',
    order_type: 'Dine-In Pickup',
    total_amount: 26.99,
    status: 'preparing',
    notes: 'Corn tortillas, spicy salsa verde.',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-demo-2',
        order_id: 'ord-denver-641',
        menu_item_id: '22222222-2222-2222-2222-222222222222',
        item_name: 'Sizzling Fajitas Skillet',
        quantity: 1,
        unit_price: 17.99,
        selected_option: 'Steak & Chicken Combo'
      },
      {
        id: 'item-demo-3',
        order_id: 'ord-denver-641',
        menu_item_id: '88888888-8888-8888-8888-888888888888',
        item_name: 'House Margaritas & Lime',
        quantity: 1,
        unit_price: 9.00
      }
    ]
  },
  {
    id: 'ord-denver-519',
    customer_name: 'Mateo Ortiz',
    customer_phone: '(303) 555-0199',
    order_type: 'Takeout',
    total_amount: 22.49,
    status: 'ready',
    notes: 'Pickup at counter around 12:30',
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    order_items: [
      {
        id: 'item-demo-4',
        order_id: 'ord-denver-519',
        menu_item_id: '44444444-4444-4444-4444-444444444444',
        item_name: 'Smothered Green Chile Burrito',
        quantity: 1,
        unit_price: 14.99,
        selected_option: 'Carnitas'
      },
      {
        id: 'item-demo-5',
        order_id: 'ord-denver-519',
        menu_item_id: '55555555-5555-5555-5555-555555555555',
        item_name: 'Street Tacos Platter (Al Pastor)',
        quantity: 2,
        unit_price: 3.75
      }
    ]
  }
];

interface CartItem {
  dish: MenuItemRecord;
  quantity: number;
  selectedOption?: string;
}

export default function App() {
  // Navigation Scroll Visibility State
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menu State
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>(FALLBACK_MENU_ITEMS);
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeModalItem, setActiveModalItem] = useState<MenuItemRecord | null>(null);

  // Taste-Inspired Featured Hero Showcase Carousel
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const nextHeroSlide = useCallback(() => {
    setActiveHeroSlide((prev) => (prev + 1) % FEATURED_HERO_SLIDES.length);
  }, []);

  const prevHeroSlide = useCallback(() => {
    setActiveHeroSlide((prev) => (prev - 1 + FEATURED_HERO_SLIDES.length) % FEATURED_HERO_SLIDES.length);
  }, []);

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderRecord | null>(null);

  // Customer Form State with Delivery Support
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('la_pasadita_user_phone') || '' : '';
  });
  const [orderType, setOrderType] = useState<'Takeout' | 'Dine-In Pickup' | 'Delivery'>('Takeout');
  const [deliveryStreet, setDeliveryStreet] = useState('');
  const [deliveryUnit, setDeliveryUnit] = useState('');
  const [deliveryZip, setDeliveryZip] = useState('80205');
  const [orderNotes, setOrderNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Table Reservation Modal State
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPartySize, setResPartySize] = useState(2);
  const [resDate, setResDate] = useState(() => {
    const tmrw = new Date(Date.now() + 86400000);
    return tmrw.toISOString().slice(0, 10);
  });
  const [resTime, setResTime] = useState('18:00');
  const [resNotes, setResNotes] = useState('');
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);
  const [resSuccess, setResSuccess] = useState<ReservationRecord | null>(null);
  const [resError, setResError] = useState<string | null>(null);

  // Kitchen Real-time Admin Modal
  const [isKitchenModalOpen, setIsKitchenModalOpen] = useState(false);
  const [kitchenOrders, setKitchenOrders] = useState<OrderRecord[]>(FALLBACK_ORDERS);
  const [isLoadingKitchen, setIsLoadingKitchen] = useState(false);
  const [kitchenNotification, setKitchenNotification] = useState<string | null>(null);

  // User Modal & Past Orders State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState<'orders' | 'info'>('orders');
  const [pastOrdersPhone, setPastOrdersPhone] = useState(customerPhone);
  const [pastOrders, setPastOrders] = useState<OrderRecord[]>([]);
  const [isLoadingPastOrders, setIsLoadingPastOrders] = useState(false);
  const [hasQueriedPastOrders, setHasQueriedPastOrders] = useState(false);

  // Settings / Supabase Config Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(SUPABASE_URL || '');
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [schemaCopied, setSchemaCopied] = useState(false);

  // Search & Utilities
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [socialToast, setSocialToast] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  // Admin Dashboard State & Live Storefront Settings
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsRecord>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('la_pasadita_site_settings');
      if (saved) {
        try {
          return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(saved) };
        } catch {}
      }
    }
    return DEFAULT_SITE_SETTINGS;
  });

  const handleSiteSettingsChange = (newSettings: SiteSettingsRecord) => {
    setSiteSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('la_pasadita_site_settings', JSON.stringify(newSettings));
    }
  };

  // URL Hash /admin listener
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setIsAdminOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Fetch Live Site Settings from Supabase
  const fetchSiteSettings = useCallback(async () => {
    if (!supabase || !isConfigured) return;
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (!error && data) {
        const mapped: SiteSettingsRecord = {
          id: data.id || 'default',
          primary_accent_color: data.primary_accent_color || '#DDA843',
          dark_theme_background: data.dark_theme_background || '#08080A',
          hero_title: data.hero_title || 'LA PASADITA INN',
          hero_subtext: data.hero_subtext || 'Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking',
          announcement_banner_text: data.announcement_banner_text || '',
          announcement_enabled: data.announcement_enabled !== false,
          open_closed_status: data.open_closed_status || 'auto',
          custom_closed_message: data.custom_closed_message || 'Closed for private family preparation · Opens at 11:00 AM',
          estimated_pickup_minutes: data.estimated_pickup_minutes || '15 – 20',
          delivery_fee: Number(data.delivery_fee) || 3.99,
          delivery_min_order: Number(data.delivery_min_order) || 15.00,
          free_delivery_threshold: Number(data.free_delivery_threshold) || 45.00
        };
        setSiteSettings(mapped);
        if (typeof window !== 'undefined') {
          localStorage.setItem('la_pasadita_site_settings', JSON.stringify(mapped));
        }
      }
    } catch (err: any) {
      console.warn('Supabase site_settings fetch error:', err.message);
    }
  }, []);

  // Real-time listener for site_settings updates
  useEffect(() => {
    fetchSiteSettings();

    if (!supabase || !isConfigured) return;

    const settingsChannel = supabase
      .channel('storefront-site-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          if (payload.new) {
            const d = payload.new as any;
            const updated: SiteSettingsRecord = {
              id: d.id || 'default',
              primary_accent_color: d.primary_accent_color || '#DDA843',
              dark_theme_background: d.dark_theme_background || '#08080A',
              hero_title: d.hero_title || 'LA PASADITA INN',
              hero_subtext: d.hero_subtext || '',
              announcement_banner_text: d.announcement_banner_text || '',
              announcement_enabled: d.announcement_enabled !== false,
              open_closed_status: d.open_closed_status || 'auto',
              custom_closed_message: d.custom_closed_message || '',
              estimated_pickup_minutes: d.estimated_pickup_minutes || '15 – 20',
              delivery_fee: Number(d.delivery_fee) || 3.99,
              delivery_min_order: Number(d.delivery_min_order) || 15.00,
              free_delivery_threshold: Number(d.free_delivery_threshold) || 45.00
            };
            setSiteSettings(updated);
            if (typeof window !== 'undefined') {
              localStorage.setItem('la_pasadita_site_settings', JSON.stringify(updated));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(settingsChannel);
    };
  }, [fetchSiteSettings]);

  // Denver Mountain Time Open/Closed status (respects Site Settings override)
  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; statusText: string }>({
    isOpen: true,
    statusText: 'Opens 11 AM'
  });

  useEffect(() => {
    function checkHours() {
      // Check admin override first
      if (siteSettings.open_closed_status === 'open') {
        setStoreStatus({ isOpen: true, statusText: 'Open Now • Accepting Orders' });
        return;
      }
      if (siteSettings.open_closed_status === 'closed') {
        setStoreStatus({
          isOpen: false,
          statusText: siteSettings.custom_closed_message || 'Closed for Now'
        });
        return;
      }

      try {
        const now = new Date();
        const denverString = now.toLocaleString('en-US', { timeZone: 'America/Denver' });
        const denverDate = new Date(denverString);
        const day = denverDate.getDay();
        const hour = denverDate.getHours();
        const minute = denverDate.getMinutes();
        const currentMins = hour * 60 + minute;
        const openMins = 11 * 60;
        const closeMins = 20 * 60;

        if (day === 0) {
          setStoreStatus({ isOpen: false, statusText: 'Closed Sunday' });
        } else if (currentMins >= openMins && currentMins < closeMins) {
          setStoreStatus({ isOpen: true, statusText: 'Open Today • Closes 8 PM' });
        } else {
          setStoreStatus({ isOpen: false, statusText: 'Opens 11 AM' });
        }
      } catch {
        setStoreStatus({ isOpen: true, statusText: 'Opens 11 AM' });
      }
    }
    checkHours();
    const timer = setInterval(checkHours, 60000);
    return () => clearInterval(timer);
  }, [siteSettings]);

  // Fetch Dynamic Menu from Supabase
  const fetchMenu = useCallback(async () => {
    setIsLoadingMenu(true);

    if (!supabase || !isConfigured) {
      setTimeout(() => {
        setMenuItems(FALLBACK_MENU_ITEMS);
        setIsLoadingMenu(false);
      }, 300);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, categories(*)')
        .eq('is_available', true)
        .order('price', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setMenuItems(data);
      } else {
        setMenuItems(FALLBACK_MENU_ITEMS);
      }
    } catch (err: any) {
      console.warn('Supabase menu query fallback:', err.message);
      setMenuItems(FALLBACK_MENU_ITEMS);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();

    if (!supabase || !isConfigured) return;

    const menuChannel = supabase
      .channel('storefront-menu-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(menuChannel);
    };
  }, [fetchMenu]);

  // Fetch Past Orders by Phone Number from Supabase (Strict 10-Digit Lookup to protect PII)
  const fetchPastOrders = useCallback(async (phoneToSearch: string) => {
    const rawDigits = phoneToSearch.replace(/\D/g, '');
    if (rawDigits.length < 10) {
      alert('Please enter a valid 10-digit phone number (e.g. 303-555-0192) to look up your orders.');
      return;
    }

    setIsLoadingPastOrders(true);
    setHasQueriedPastOrders(true);

    const standardFormatted = `(${rawDigits.slice(0, 3)}) ${rawDigits.slice(3, 6)}-${rawDigits.slice(6, 10)}`;
    const dashedFormatted = `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 6)}-${rawDigits.slice(6, 10)}`;

    if (typeof window !== 'undefined') {
      localStorage.setItem('la_pasadita_user_phone', standardFormatted);
    }

    try {
      if (supabase && isConfigured) {
        // Strict exact phone match (prevents wildcard leaking other customers' tickets)
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .or(`customer_phone.eq.${standardFormatted},customer_phone.eq.${dashedFormatted},customer_phone.eq.${rawDigits}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPastOrders(data || []);
      } else {
        const localMatches = kitchenOrders.filter((o) => {
          const orderDigits = o.customer_phone.replace(/\D/g, '');
          return orderDigits === rawDigits;
        });
        setPastOrders(localMatches);
      }
    } catch (err) {
      console.error('Error querying past orders:', err);
      const localMatches = kitchenOrders.filter((o) => {
        const orderDigits = o.customer_phone.replace(/\D/g, '');
        return orderDigits === rawDigits;
      });
      setPastOrders(localMatches);
    } finally {
      setIsLoadingPastOrders(false);
    }
  }, [kitchenOrders]);

  useEffect(() => {
    if (userModalOpen && customerPhone.trim() && !hasQueriedPastOrders) {
      fetchPastOrders(customerPhone);
    }
  }, [userModalOpen, customerPhone, hasQueriedPastOrders, fetchPastOrders]);

  // Fetch Kitchen Orders & Setup Real-time Listener
  const fetchKitchenOrders = useCallback(async () => {
    if (!supabase || !isConfigured) return;
    setIsLoadingKitchen(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;
      if (data) setKitchenOrders(data);
    } catch (err: any) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setIsLoadingKitchen(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !isConfigured) return;
    fetchKitchenOrders();

    const ordersChannel = supabase
      .channel('kitchen-live-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderRecord;
            setKitchenOrders((prev) => [newOrder, ...prev]);
            setKitchenNotification(`New Order received: #${newOrder.id.slice(0, 6)}!`);
            setTimeout(() => setKitchenNotification(null), 4000);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as OrderRecord;
            setKitchenOrders((prev) =>
              prev.map((ord) => (ord.id === updated.id ? { ...ord, ...updated } : ord))
            );
          } else if (payload.eventType === 'DELETE') {
            setKitchenOrders((prev) => prev.filter((ord) => ord.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(ordersChannel);
    };
  }, [fetchKitchenOrders]);

  const updateOrderStatus = async (orderId: string, nextStatus: OrderRecord['status']) => {
    if (!supabase || !isConfigured) {
      setKitchenOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      setKitchenOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch (err: any) {
      alert(`Could not update order status: ${err.message}`);
    }
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeTab !== 'all') {
      items = items.filter((item) => {
        const catName = item.categories?.name?.toLowerCase() || '';
        if (activeTab === 'specials') return catName.includes('special');
        if (activeTab === 'tacos-tortas') return catName.includes('taco') || catName.includes('torta');
        if (activeTab === 'soups') return catName.includes('caldo') || catName.includes('soup');
        if (activeTab === 'drinks') return catName.includes('drink') || catName.includes('dessert');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q) ||
          (it.spanish_name && it.spanish_name.toLowerCase().includes(q))
      );
    }
    return items;
  }, [menuItems, activeTab, searchQuery]);

  const addToCart = (dish: MenuItemRecord, option?: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id && i.selectedOption === option);
      if (existing) {
        return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { dish, quantity: 1, selectedOption: option }];
    });
  };

  const handleReorder = (order: OrderRecord) => {
    if (!order.order_items || order.order_items.length === 0) return;

    order.order_items.forEach((item) => {
      const matched = menuItems.find((m) => m.id === item.menu_item_id || m.name === item.item_name);
      if (matched) {
        addToCart(matched, item.selected_option || undefined);
      }
    });

    setUserModalOpen(false);
    setIsDrawerOpen(true);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      return prev.map((it, i) => (i === index ? { ...it, quantity: nextQty } : it));
    });
  };

  // Canonical Price Verification against live menuItems database state
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const canonical = menuItems.find((m) => m.id === item.dish.id);
      const verifiedPrice = canonical ? canonical.price : item.dish.price;
      return sum + verifiedPrice * item.quantity;
    }, 0);
  }, [cart, menuItems]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Delivery Fee Calculation (Free over threshold)
  const deliveryFee = useMemo(() => {
    if (orderType !== 'Delivery') return 0;
    const freeThreshold = siteSettings.free_delivery_threshold ?? 45.0;
    if (subtotal >= freeThreshold) return 0;
    return siteSettings.delivery_fee ?? 3.99;
  }, [orderType, subtotal, siteSettings]);

  const denverTax = useMemo(() => {
    return Number((subtotal * 0.0881).toFixed(2));
  }, [subtotal]);

  const finalTotal = useMemo(() => {
    return Number((subtotal + denverTax + deliveryFee).toFixed(2));
  }, [subtotal, denverTax, deliveryFee]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (cart.length === 0) return;

    const trimmedName = customerName.trim();
    const phoneDigits = customerPhone.replace(/\D/g, '');

    // 1. Validate Customer Name
    if (!trimmedName || trimmedName.length < 2) {
      setCheckoutError('Please enter your full name (at least 2 characters).');
      return;
    }

    // 2. Validate Phone Number (Strict 10-Digit US standard)
    if (phoneDigits.length < 10) {
      setCheckoutError('Please enter a valid 10-digit phone number (e.g. 303-555-0192).');
      return;
    }

    const formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;

    // 3. Validate Delivery Requirements if orderType === 'Delivery'
    let fullDeliveryAddress: string | null = null;
    if (orderType === 'Delivery') {
      const minDelivery = siteSettings.delivery_min_order ?? 15.0;
      if (subtotal < minDelivery) {
        setCheckoutError(`Minimum order for delivery is $${minDelivery.toFixed(2)}. Current subtotal: $${subtotal.toFixed(2)}.`);
        return;
      }
      if (!deliveryStreet.trim()) {
        setCheckoutError('Please provide your street address for delivery.');
        return;
      }
      const zipTrim = deliveryZip.trim();
      if (!zipTrim || zipTrim.length < 5) {
        setCheckoutError('Please enter a valid 5-digit ZIP code.');
        return;
      }
      fullDeliveryAddress = `${deliveryStreet.trim()}${deliveryUnit.trim() ? ` ${deliveryUnit.trim()}` : ''}, Denver, CO ${zipTrim}`;
    }

    setIsSubmittingOrder(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('la_pasadita_user_phone', formattedPhone);
    }
    setPastOrdersPhone(formattedPhone);

    try {
      if (supabase && isConfigured) {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .insert({
            customer_name: trimmedName,
            customer_phone: formattedPhone,
            order_type: orderType,
            delivery_address: fullDeliveryAddress,
            delivery_fee: deliveryFee,
            total_amount: finalTotal,
            status: 'pending',
            notes: orderNotes.trim() || null
          })
          .select()
          .single();

        if (orderErr) throw orderErr;

        const orderItemsPayload = cart.map((item) => {
          const canonical = menuItems.find((m) => m.id === item.dish.id);
          const verifiedUnitPrice = canonical ? canonical.price : item.dish.price;
          return {
            order_id: orderData.id,
            menu_item_id: item.dish.id,
            item_name: canonical ? canonical.name : item.dish.name,
            quantity: item.quantity,
            unit_price: verifiedUnitPrice,
            selected_option: item.selectedOption || null
          };
        });

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItemsPayload);

        if (itemsErr) throw itemsErr;
        setOrderSuccess({ ...orderData, order_items: orderItemsPayload as any });
      } else {
        const demoOrder: OrderRecord = {
          id: `demo-${Math.random().toString(36).substring(2, 9)}`,
          customer_name: trimmedName,
          customer_phone: formattedPhone,
          order_type: orderType,
          delivery_address: fullDeliveryAddress,
          delivery_fee: deliveryFee,
          total_amount: finalTotal,
          status: 'pending',
          notes: orderNotes.trim() || null,
          created_at: new Date().toISOString(),
          order_items: cart.map((item, idx) => ({
            id: `item-demo-${idx}`,
            order_id: `demo`,
            menu_item_id: item.dish.id,
            item_name: item.dish.name,
            quantity: item.quantity,
            unit_price: item.dish.price,
            selected_option: item.selectedOption || null
          }))
        };
        setKitchenOrders((prev) => [demoOrder, ...prev]);
        setOrderSuccess(demoOrder);
      }

      setCart([]);
      setOrderNotes('');
      setDeliveryStreet('');
      setDeliveryUnit('');
    } catch (err: any) {
      console.error('Order submission error:', err);
      setCheckoutError(`Order placement failed: ${err.message || 'Please check connection.'}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Submit Table Reservation
  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setResError(null);

    const nameTrim = resName.trim();
    const phoneDigits = resPhone.replace(/\D/g, '');

    if (!nameTrim || nameTrim.length < 2) {
      setResError('Please provide your full name.');
      return;
    }
    if (phoneDigits.length < 10) {
      setResError('Please provide a valid 10-digit phone number.');
      return;
    }

    const formattedPhone = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6, 10)}`;
    setIsSubmittingRes(true);

    const resRecord: ReservationRecord = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `res-${Date.now()}`,
      customer_name: nameTrim,
      customer_phone: formattedPhone,
      customer_email: resEmail.trim() || undefined,
      party_size: Number(resPartySize),
      reservation_date: resDate,
      reservation_time: resTime,
      special_requests: resNotes.trim() || undefined,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    try {
      if (supabase && isConfigured) {
        const { error } = await supabase.from('reservations').insert([{
          id: resRecord.id,
          customer_name: resRecord.customer_name,
          customer_phone: resRecord.customer_phone,
          customer_email: resRecord.customer_email || null,
          party_size: resRecord.party_size,
          reservation_date: resRecord.reservation_date,
          reservation_time: resRecord.reservation_time,
          special_requests: resRecord.special_requests || null,
          status: 'confirmed'
        }]);
        if (error) throw error;
      }
      setResSuccess(resRecord);
      setResName('');
      setResPhone('');
      setResEmail('');
      setResNotes('');
    } catch (err: any) {
      console.error('Reservation submission error:', err);
      setResError(`Failed to submit reservation: ${err.message || 'Connection error'}`);
    } finally {
      setIsSubmittingRes(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText('1959 Park Ave W, Denver, CO 80205');
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const triggerSocialToast = (platform: string) => {
    setSocialToast(`Follow La Pasadita Inn on ${platform} @lapasaditainn`);
    setTimeout(() => setSocialToast(null), 2500);
  };

  const copySqlSchema = () => {
    fetch('/supabase/schema.sql')
      .then((res) => res.text())
      .then((sql) => {
        navigator.clipboard.writeText(sql);
        setSchemaCopied(true);
        setTimeout(() => setSchemaCopied(false), 2500);
      })
      .catch(() => {
        navigator.clipboard.writeText('-- See /supabase/schema.sql in codebase');
        setSchemaCopied(true);
        setTimeout(() => setSchemaCopied(false), 2500);
      });
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F1F2F6] flex flex-col font-sans selection:bg-[#DDA843] selection:text-black overflow-x-hidden">
      
      {/* =========================================================================
          ANCHORED ARCHITECTURAL TOP HEADER (SOLID MATTE #08080A)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#08080A] border-b border-[#22242D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          
          {/* Brand Identity: Left-aligned emblem and Denver landmark wordmark */}
          <a
            href="#hero"
            className="flex items-center gap-3 group focus:outline-none shrink-0"
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-black font-serif italic font-black text-sm sm:text-base flex items-center justify-center shadow transition-transform group-hover:scale-105"
              style={{ backgroundColor: siteSettings.primary_accent_color }}
            >
              Lp
            </div>
            <div>
              <div className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight">
                La Pasadita Inn
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#8E92A0] font-mono tracking-wider uppercase">
                Historic Comal Kitchen · Denver 1959
              </div>
            </div>
          </a>

          {/* Nav Links: Menu, Story, Location, Reserve, Admin - Desktop Only */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-bold tracking-wider uppercase text-[#9A9EAB]">
            <a href="#menu" className="hover:text-white transition-colors">
              Menu
            </a>
            <a href="#story" className="hover:text-white transition-colors">
              Comal Heritage
            </a>
            <a href="#location" className="hover:text-white transition-colors">
              Park Ave Location
            </a>
            <button
              onClick={() => setIsReservationOpen(true)}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#DDA843]" />
              <span>Reserve Table</span>
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
              style={{ color: siteSettings.primary_accent_color }}
              title="Admin Dashboard (/admin)"
            >
              <Shield className="w-3.5 h-3.5" style={{ color: siteSettings.primary_accent_color }} />
              <span>Admin</span>
            </button>
          </nav>

          {/* Action Row: Live Hours, Phone, Order Button & Past Orders */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Operational Status */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121318] border border-[#22242D] text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: storeStatus.isOpen ? '#22C55E' : '#EF4444' }}
              />
              <span className="text-[#B5B9C5] font-medium">{storeStatus.statusText}</span>
            </div>

            {/* Direct Phone Order */}
            <a
              href="tel:+13038321785"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121318] hover:bg-[#181A20] border border-[#22242D] text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" style={{ color: siteSettings.primary_accent_color }} />
              <span>(303) 832-1785</span>
            </a>

            {/* Online Order / Cart Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-black text-xs font-extrabold shadow transition-all hover:brightness-110 cursor-pointer"
              style={{ backgroundColor: siteSettings.primary_accent_color }}
              title="View Online Order Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Order</span>
              <span>({totalItemCount})</span>
            </button>

            {/* Customer Past Orders */}
            <button
              onClick={() => {
                setUserModalOpen(true);
                setUserModalTab('orders');
              }}
              className="w-9 h-9 rounded-lg bg-[#121318] hover:bg-[#181A20] border border-[#22242D] text-[#9A9EAB] hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Past Orders & Receipts"
            >
              <Receipt className="w-4 h-4" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg bg-[#121318] hover:bg-[#181A20] border border-[#22242D] text-[#9A9EAB] hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* =========================================================================
          MOBILE NAVIGATION DRAWER (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[280px] sm:max-w-xs h-full bg-[#121318] border-l border-[#22242D] shadow-2xl p-5 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-[#22242D]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white text-black font-serif italic font-black text-sm flex items-center justify-center shadow">
                      Lp
                    </div>
                    <div>
                      <div className="font-display font-extrabold text-sm text-white">La Pasadita Inn</div>
                      <div className="text-[10px] text-[#DDA843] font-bold">Denver Landmark</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Pill */}
                <div className="mt-4 p-2.5 rounded-xl bg-[#181A20] border border-[#22242D] flex items-center gap-2 text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-[#DDA843]" />
                  <span>{storeStatus.statusText}</span>
                </div>

                {/* Navigation Links */}
                <nav className="mt-6 space-y-1">
                  <a
                    href="#menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#F1F2F6] hover:bg-[#181A20] hover:text-[#DDA843] transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-[#DDA843]" />
                    <span>Curated Menu</span>
                  </a>

                  <a
                    href="#story"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#F1F2F6] hover:bg-[#181A20] hover:text-[#DDA843] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#DDA843]" />
                    <span>Story & Heritage</span>
                  </a>

                  <a
                    href="#location"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#F1F2F6] hover:bg-[#181A20] hover:text-[#DDA843] transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#DDA843]" />
                    <span>Location & Hours</span>
                  </a>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsReservationOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#F1F2F6] hover:bg-[#181A20] hover:text-[#DDA843] transition-colors text-left cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#DDA843]" />
                    <span>Reserve a Table</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setUserModalOpen(true);
                      setUserModalTab('orders');
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#F1F2F6] hover:bg-[#181A20] hover:text-[#DDA843] transition-colors text-left cursor-pointer"
                  >
                    <Receipt className="w-4 h-4 text-[#DDA843]" />
                    <span>My Past Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsKitchenModalOpen(true);
                      fetchKitchenOrders();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#9A9EAB] hover:bg-[#181A20] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-[#6A6E7C]" />
                    <span>Kitchen Display</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAdminOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-[#DDA843] hover:bg-[#181A20] transition-colors text-left cursor-pointer border border-[#DDA843]/20 bg-[#181A20]/50"
                  >
                    <Shield className="w-4 h-4 text-[#DDA843]" />
                    <span>Admin Dashboard (/admin)</span>
                  </button>
                </nav>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-[#22242D] space-y-3">
                <a
                  href="tel:+13038321785"
                  className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call (303) 832-1785</span>
                </a>

                {totalItemCount > 0 && (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full py-3 rounded-xl bg-[#DDA843] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Cart ({totalItemCount})</span>
                  </button>
                )}

                <div className="text-[11px] text-[#6A6E7C] text-center pt-1">
                  1959 Park Ave W, Denver, CO 80205
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {/* =========================================================================
            GROUNDED EDITORIAL SHOWCASE (SOLID MATTE SURFACES · ZERO AI GIMMICKS)
           ========================================================================= */}
        <section
          id="hero"
          className="relative pt-8 sm:pt-12 pb-14 sm:pb-20 bg-[#08080A] transition-colors duration-300"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            
            {/* Live Operational Announcement (if enabled) */}
            {siteSettings.announcement_enabled && siteSettings.announcement_banner_text && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-xl bg-[#121318] border border-[#22242D] flex items-center gap-3 text-xs sm:text-sm shadow-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: siteSettings.primary_accent_color }}
                />
                <span className="font-medium text-[#F1F2F6]">
                  {siteSettings.announcement_banner_text}
                </span>
              </motion.div>
            )}

            {/* THE SOLID MATTE HERO CONTAINER */}
            <div className="relative w-full rounded-2xl sm:rounded-3xl bg-[#121318] border border-[#22242D] p-6 sm:p-10 lg:p-12 overflow-hidden shadow-xl">
              
              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                
                {/* LEFT COLUMN: EDITORIAL GROUNDED COPY & SPECS */}
                <div className="lg:col-span-7 space-y-6 text-left">
                  
                  {/* Landmark Provenance Kicker */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded text-[11px] font-mono font-bold tracking-wider uppercase text-black"
                      style={{ backgroundColor: siteSettings.primary_accent_color }}
                    >
                      Denver Landmark
                    </span>
                    <span className="text-xs text-[#8E92A0] font-mono">
                      1959 Park Ave W · Historic Triangle
                    </span>
                  </div>

                  {/* 3-LINE HEADLINE WITH CRISP LEFT ACCENT */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={FEATURED_HERO_SLIDES[activeHeroSlide].id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-stretch gap-4"
                    >
                      <div
                        className="w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: siteSettings.primary_accent_color }}
                      />

                      <h1 className="font-display font-black text-2xl sm:text-4xl lg:text-5xl text-white leading-[1.1] tracking-tight">
                        {FEATURED_HERO_SLIDES[activeHeroSlide].lines.map((line, idx) => (
                          <span key={idx} className="block">
                            {line}
                          </span>
                        ))}
                      </h1>
                    </motion.div>
                  </AnimatePresence>

                  {/* Authentic Grounded Description (No marketing buzzwords) */}
                  <p className="text-sm sm:text-base text-[#9A9EAB] leading-relaxed max-w-xl">
                    {FEATURED_HERO_SLIDES[activeHeroSlide].description}
                  </p>

                  {/* Grounded Kitchen Specs Row */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#22242D] max-w-md">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6A6E7C]">Portion</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        {FEATURED_HERO_SLIDES[activeHeroSlide].servings}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6A6E7C]">Comal Cook Time</div>
                      <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                        {FEATURED_HERO_SLIDES[activeHeroSlide].cookTime}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6A6E7C]">Plate Price</div>
                      <div
                        className="text-xs sm:text-sm font-mono font-bold mt-0.5"
                        style={{ color: siteSettings.primary_accent_color }}
                      >
                        ${FEATURED_HERO_SLIDES[activeHeroSlide].price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Watch Grandma's Kitchen Story Card */}
                  <div className="pt-1">
                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="inline-flex items-center gap-3 p-2 pr-4 rounded-xl bg-[#181A20] hover:bg-[#20232B] border border-[#22242D] transition-colors text-left cursor-pointer group"
                    >
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-[#22242D]">
                        <img
                          src={IMAGES.kitchenStory}
                          alt="Kitchen Comal"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Grandma's Comal Tradition</span>
                          <span className="text-[10px] text-[#6A6E7C] font-mono">01:45</span>
                        </div>
                        <p className="text-[11px] text-[#8E92A0]">
                          Scratch-roasted poblanos & hand-pressed masa
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Call-to-Action Row */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        const targetDish = menuItems.find(m => m.id === FEATURED_HERO_SLIDES[activeHeroSlide].dishRefId) || menuItems[0];
                        addToCart(targetDish);
                        setIsDrawerOpen(true);
                      }}
                      className="px-6 py-3 rounded-xl text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: siteSettings.primary_accent_color }}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Order This Plate · ${FEATURED_HERO_SLIDES[activeHeroSlide].price.toFixed(2)}</span>
                    </button>

                    <a
                      href="#menu"
                      className="px-5 py-3 rounded-xl bg-[#181A20] hover:bg-[#20232B] text-white border border-[#22242D] text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Explore Menu
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsReservationOpen(true)}
                      className="px-5 py-3 rounded-xl bg-[#181A20] hover:bg-[#20232B] text-[#DDA843] border border-[#DDA843]/40 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book a Table</span>
                    </button>
                  </div>

                </div>

                {/* RIGHT COLUMN: REAL FOOD PHOTOGRAPHY IN CLEAN FRAMED SURFACE */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  
                  <div className="w-full rounded-2xl overflow-hidden bg-[#181A20] border border-[#22242D] shadow-xl group">
                    <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden bg-[#101116]">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={FEATURED_HERO_SLIDES[activeHeroSlide].id}
                          src={FEATURED_HERO_SLIDES[activeHeroSlide].image}
                          alt={FEATURED_HERO_SLIDES[activeHeroSlide].lines[0]}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </AnimatePresence>

                      {/* Plate Badge */}
                      <div className="absolute top-3 left-3 px-3 py-1 rounded bg-[#08080A]/90 border border-[#22242D] text-[11px] font-bold text-white uppercase tracking-wider">
                        {FEATURED_HERO_SLIDES[activeHeroSlide].badge}
                      </div>

                      {/* Price Tag */}
                      <div
                        className="absolute bottom-3 right-3 px-3 py-1 rounded bg-[#08080A]/90 border border-[#22242D] font-mono text-sm font-bold"
                        style={{ color: siteSettings.primary_accent_color }}
                      >
                        ${FEATURED_HERO_SLIDES[activeHeroSlide].price.toFixed(2)}
                      </div>
                    </div>

                    {/* Image Caption Bar */}
                    <div className="p-4 bg-[#121318] border-t border-[#22242D] flex items-center justify-between text-xs text-[#8E92A0]">
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">
                          {FEATURED_HERO_SLIDES[activeHeroSlide].lines[0]}
                        </div>
                        <div className="text-[11px] text-[#8E92A0] mt-0.5">
                          Plate #{activeHeroSlide + 1} of {FEATURED_HERO_SLIDES.length} · Denver Comal Special
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const targetDish = menuItems.find(m => m.id === FEATURED_HERO_SLIDES[activeHeroSlide].dishRefId) || menuItems[0];
                          setActiveModalItem(targetDish);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] text-white border border-[#22242D] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {/* CAROUSEL CONTROLS */}
                  <div className="w-full mt-4 flex items-center justify-between text-xs text-[#8E92A0]">
                    <button
                      onClick={prevHeroSlide}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#22242D] text-white font-bold transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Plate</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {FEATURED_HERO_SLIDES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveHeroSlide(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                            activeHeroSlide === i
                              ? 'w-6'
                              : 'bg-[#22242D] hover:bg-[#323644]'
                          }`}
                          style={activeHeroSlide === i ? { backgroundColor: siteSettings.primary_accent_color } : {}}
                          title={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={nextHeroSlide}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] border border-[#22242D] text-white font-bold transition-colors cursor-pointer"
                    >
                      <span>Next Plate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =========================================================================
            MENU SECTION: ASYMMETRICAL GROUNDED GRID ON SOLID MATTE SURFACES
           ========================================================================= */}
        <section id="menu" className="py-14 sm:py-20 md:py-24 bg-[#08080A] border-t border-[#22242D] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header: Left-Aligned Editorial Style (No centering) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 pb-6 border-b border-[#22242D]">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: siteSettings.primary_accent_color }}
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#8E92A0]">
                    Denver Scratch Comal Kitchen
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
                  Kitchen Specials & Comal Plates
                </h2>
                <p className="text-[#8E92A0] text-xs sm:text-sm mt-1 max-w-xl">
                  Hand-rolled tamales, fire-roasted rellenos, and 4-hour simmered pork green chile cooked daily at 1959 Park Ave W.
                </p>
              </div>

              {/* Status Indicator & Live Sync */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121318] border border-[#22242D] text-[11px] text-[#DDA843]">
                  <Database className="w-3 h-3" />
                  <span>
                    {isConfigured ? 'Supabase Live Sync' : 'Catalog Active'}
                  </span>
                  <button
                    onClick={fetchMenu}
                    className="ml-1 hover:text-white transition-colors cursor-pointer"
                    title="Refetch menu"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingMenu ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Tabs: Left-aligned solid matte buttons */}
            <div className="flex items-center gap-2 mb-8 sm:mb-10 overflow-x-auto no-scrollbar pb-2">
              {[
                { id: 'all', label: 'All Plates' },
                { id: 'specials', label: 'Comal Specials' },
                { id: 'tacos-tortas', label: 'Tacos & Tortas' },
                { id: 'soups', label: 'Traditional Soups' },
                { id: 'drinks', label: 'Drinks & Desserts' }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'text-black shadow'
                        : 'bg-[#121318] hover:bg-[#181A20] text-[#9A9EAB] hover:text-white border border-[#22242D]'
                    }`}
                    style={isActive ? { backgroundColor: siteSettings.primary_accent_color } : {}}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Menu Layout: Asymmetrical Design */}
            {isLoadingMenu ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4].map((sk) => (
                  <div
                    key={sk}
                    className="h-80 rounded-2xl bg-[#121318] border border-[#22242D] p-5 animate-pulse flex flex-col justify-between"
                  >
                    <div className="w-full h-40 bg-white/5 rounded-xl" />
                    <div className="space-y-2 mt-4">
                      <div className="w-3/4 h-5 bg-white/5 rounded" />
                      <div className="w-full h-3 bg-white/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-left py-12 px-6 rounded-2xl bg-[#121318] border border-[#22242D] text-[#8E92A0] space-y-2">
                <ChefHat className="w-8 h-8 text-[#6A6E7C] mb-2" />
                <h3 className="text-white font-bold text-base">No items found in this section</h3>
                <p className="text-xs">Select another category or clear your search query to see more comal plates.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. ASYMMETRICAL FEATURED PLATE BANNER (The #1 Signature Plate) */}
                {filteredItems.length > 0 && (
                  <div className="rounded-2xl sm:rounded-3xl bg-[#121318] border border-[#22242D] p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-lg">
                    <div className="lg:col-span-5 relative rounded-xl overflow-hidden aspect-[16/10] bg-[#101116] border border-[#22242D] group">
                      <img
                        src={filteredItems[0].image_url || IMAGES.heroRelleno}
                        alt={filteredItems[0].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider text-black font-mono shadow"
                        style={{ backgroundColor: siteSettings.primary_accent_color }}
                      >
                        Featured Comal Signature
                      </div>
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#08080A]/90 border border-[#22242D] font-mono text-xs font-bold text-white">
                        ${Number(filteredItems[0].price).toFixed(2)}
                      </div>
                    </div>

                    <div className="lg:col-span-7 space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        {filteredItems[0].badge && (
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DDA843]">
                            {filteredItems[0].badge}
                          </span>
                        )}
                        {filteredItems[0].spice_level && (
                          <span className="text-[11px] font-mono text-[#8E92A0]">
                            · {filteredItems[0].spice_level} Spice
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                        {filteredItems[0].name}
                      </h3>

                      {filteredItems[0].spanish_name && (
                        <div className="text-xs text-[#8E92A0] italic">
                          {filteredItems[0].spanish_name}
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-[#9A9EAB] leading-relaxed">
                        {filteredItems[0].description}
                      </p>

                      {filteredItems[0].grandma_note && (
                        <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D] text-xs text-[#DDA843] flex items-start gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{filteredItems[0].grandma_note}</span>
                        </div>
                      )}

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={() => {
                            addToCart(filteredItems[0]);
                            setIsDrawerOpen(true);
                          }}
                          className="px-5 py-2.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:brightness-110 flex items-center gap-2 cursor-pointer shadow"
                          style={{ backgroundColor: siteSettings.primary_accent_color }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order · ${Number(filteredItems[0].price).toFixed(2)}</span>
                        </button>

                        <button
                          onClick={() => setActiveModalItem(filteredItems[0])}
                          className="px-4 py-2.5 rounded-xl bg-[#181A20] hover:bg-[#20232B] text-white border border-[#22242D] text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. THE REMAINING ITEMS IN ASYMMETRICAL SOLID MATTE CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredItems.slice(1).map((dish) => (
                    <div
                      key={dish.id}
                      className="rounded-2xl bg-[#121318] border border-[#22242D] hover:border-[#323644] p-5 flex flex-col justify-between group transition-all"
                    >
                      <div>
                        {/* Dish Image Banner */}
                        <div className="relative h-44 w-full rounded-xl overflow-hidden mb-4 bg-[#101116] border border-[#22242D]">
                          <img
                            src={dish.image_url || IMAGES.heroRelleno}
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          
                          {/* Badge */}
                          {dish.badge && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#08080A]/90 border border-[#22242D] text-[10px] font-bold uppercase tracking-wider text-white">
                              {dish.badge}
                            </div>
                          )}

                          {/* Crisp Price Badge */}
                          <div
                            className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded bg-[#08080A]/90 border border-[#22242D] font-mono text-xs font-bold"
                            style={{ color: siteSettings.primary_accent_color }}
                          >
                            ${Number(dish.price).toFixed(2)}
                          </div>
                        </div>

                        {/* Title & Notes */}
                        <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                          {dish.name}
                        </h3>
                        {dish.spanish_name && (
                          <div className="text-[11px] text-[#8E92A0] italic mb-1.5">
                            {dish.spanish_name}
                          </div>
                        )}
                        <p className="text-xs text-[#9A9EAB] leading-relaxed mb-3 line-clamp-2">
                          {dish.description}
                        </p>

                        {dish.grandma_note && (
                          <div className="text-[11px] mb-3 flex items-center gap-1.5 p-2 rounded-lg bg-[#181A20] border border-[#22242D] text-[#DDA843]">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span className="truncate">{dish.grandma_note}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-[#22242D] flex items-center justify-between">
                        <button
                          onClick={() => setActiveModalItem(dish)}
                          className="text-xs text-[#8E92A0] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-[#DDA843]" />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => {
                            addToCart(dish);
                            setIsDrawerOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#181A20] hover:bg-white text-white hover:text-black border border-[#22242D] font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Order Banner: Solid Matte Surface */}
            <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#121318] border border-[#22242D] flex flex-col sm:flex-row items-center justify-between gap-6 text-left shadow-lg">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#DDA843] mb-1">
                  Connected to Supabase Live Ordering
                </div>
                <h4 className="font-display font-extrabold text-white text-lg sm:text-xl">
                  Order Direct for Curbside or Counter Pickup
                </h4>
                <p className="text-xs text-[#8E92A0] mt-1 max-w-lg">
                  Tickets stream directly to our kitchen screen in real time. Track past orders using your phone number without creating an account.
                </p>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-start sm:justify-end">
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider transition-transform hover:scale-105 flex items-center justify-center gap-2 shadow cursor-pointer whitespace-nowrap"
                  style={{ backgroundColor: siteSettings.primary_accent_color }}
                >
                  <ShoppingBag className="w-4 h-4 fill-black" />
                  <span>View Order ({totalItemCount})</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            STORY & HERITAGE SECTION: SOLID MATTE ARCHITECTURAL CONTAINER
           ========================================================================= */}
        <section id="story" className="py-14 sm:py-20 bg-[#08080A] border-t border-[#22242D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="rounded-2xl sm:rounded-3xl bg-[#121318] border border-[#22242D] p-6 sm:p-10 lg:p-12 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                <div className="lg:col-span-7 space-y-4 text-left">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: siteSettings.primary_accent_color }}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#DDA843]">
                      Historic Triangle Landmark · Since 1959
                    </span>
                  </div>

                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                    An Authentic Denver Sanctuary Guided by Grandma’s Comal
                  </h3>

                  <p className="text-[#9A9EAB] text-xs sm:text-sm leading-relaxed">
                    Housed in an architecturally distinctive triangular block in Denver at Park Ave West and 20th Street, <strong className="text-white">La Pasadita Inn</strong> has operated continuously as a homey neighborhood kitchen for over six decades.
                  </p>

                  <p className="text-[#9A9EAB] text-xs sm:text-sm leading-relaxed">
                    Every morning starts with fire-roasted poblanos, copper pots of Colorado pork green chile simmered for hours, and stone-ground corn tortillas pressed fresh on the flat comal. There are no corporate shortcuts or frozen pre-mixes here — just honest, unpretentious cooking.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#22242D] text-left">
                    <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D]">
                      <div className="font-display font-bold text-base sm:text-lg text-[#DDA843]">4.7 ★</div>
                      <div className="text-[10px] sm:text-[11px] text-[#8E92A0]">Google Rating (700+)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D]">
                      <div className="font-display font-bold text-base sm:text-lg text-white">1959</div>
                      <div className="text-[10px] sm:text-[11px] text-[#8E92A0]">Year Established</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D]">
                      <div className="font-display font-bold text-base sm:text-lg text-white">100%</div>
                      <div className="text-[10px] sm:text-[11px] text-[#8E92A0]">Scratch Kitchen</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="rounded-2xl overflow-hidden border border-[#22242D] bg-[#181A20] shadow-xl group">
                    <img
                      src={IMAGES.kitchenStory}
                      alt="Grandmother preparing authentic tortillas in historic kitchen"
                      className="w-full h-64 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="p-3 bg-[#121318] border-t border-[#22242D] text-[11px] text-[#8E92A0] text-left">
                      Morning masa preparation at the 1959 Park Ave W comal
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            LOCATION & HOURS: SOLID MATTE SURFACES
           ========================================================================= */}
        <section id="location" className="py-14 sm:py-20 bg-[#08080A] border-t border-[#22242D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
              
              <div className="lg:col-span-5 space-y-4 text-left">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#DDA843]">
                    Denver Landmark Location
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                    Park Ave West & Hours
                  </h3>
                </div>

                {/* Address Box */}
                <div className="p-4 rounded-xl bg-[#121318] border border-[#22242D] space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#DDA843] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-white text-sm">La Pasadita Inn</div>
                      <div className="text-xs text-[#9A9EAB]">1959 Park Ave W</div>
                      <div className="text-xs text-[#6A6E7C]">Denver, CO 80205</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#22242D]">
                    <button
                      onClick={copyAddress}
                      className="flex-1 justify-center px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] text-xs text-[#9A9EAB] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-[#22242D]"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#DDA843]" />
                      <span>{addressCopied ? 'Copied Address!' : 'Copy Address'}</span>
                    </button>
                    
                    <a
                      href="https://maps.google.com/?q=1959+Park+Ave+W,+Denver,+CO+80205"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 justify-center px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#20232B] text-xs text-[#9A9EAB] hover:text-white flex items-center gap-1.5 transition-colors border border-[#22242D]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#DDA843]" />
                      <span>Google Maps</span>
                    </a>
                  </div>
                </div>

                {/* Hours Box */}
                <div className="p-4 rounded-xl bg-[#121318] border border-[#22242D] space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-[#DDA843]" />
                    <span>Kitchen Operating Hours</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#9A9EAB]">
                      <span>Monday – Saturday:</span>
                      <span className="font-mono font-bold text-white">11:00 AM – 8:00 PM</span>
                    </div>
                    <div className="flex justify-between text-[#9A9EAB]">
                      <span>Sunday:</span>
                      <span className="text-rose-400 font-semibold">Closed (Family Day)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href="tel:+13038321785"
                    className="py-3 px-3 rounded-xl bg-[#121318] hover:bg-[#181A20] text-white border border-[#22242D] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#DDA843]" />
                    <span>Call: (303) 832-1785</span>
                  </a>

                  <a
                    href="https://wa.me/13038321785?text=Hello%20La%20Pasadita%20Inn!%20I'd%20like%20to%20inquire%20about%20an%20order%20or%20table%20reservation."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-emerald-400 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.15c-.24.67-1.39 1.29-1.93 1.37-.5.08-1.14.12-3.32-.78-2.6-1.07-4.27-3.71-4.4-3.89-.13-.17-1.05-1.4-1.05-2.67 0-1.27.67-1.89.9-2.14.24-.26.52-.32.69-.32.17 0 .35 0 .5.01.16.01.38-.06.59.45.22.52.74 1.8.8 1.93.07.13.11.29.02.47-.09.18-.13.29-.26.45-.13.15-.28.34-.4.46-.13.13-.27.27-.12.53.15.26.68 1.12 1.46 1.82 1 .89 1.85 1.17 2.11 1.3.26.13.41.11.56-.06.15-.18.66-.77.83-1.03.18-.26.35-.22.59-.13.24.09 1.52.72 1.78.85.26.13.43.2.49.31.06.11.06.66-.18 1.33z" />
                    </svg>
                    <span>WhatsApp Inquiry</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReservationOpen(true)}
                  className="w-full py-3 rounded-xl bg-[#181A20] hover:bg-[#20232B] text-[#DDA843] border border-[#DDA843]/40 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Reserve a Table Online (1–12 Guests)</span>
                </button>

              </div>

              {/* Map Container */}
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden border border-[#22242D] bg-[#121318] h-64 sm:h-80 shadow flex flex-col">
                  <iframe
                    title="La Pasadita Inn Map Location"
                    src="https://maps.google.com/maps?q=1959+Park+Ave+W,+Denver,+CO+80205&t=&z=16&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full border-0 filter invert-[90%] hue-rotate-180 contrast-125 opacity-85"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#121318] border border-[#22242D] text-[11px] text-[#9A9EAB]">
                    Triangular Block Island · Park Ave W & 20th St
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Footer Bar */}
            <div className="pt-8 border-t border-[#22242D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6A6E7C]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white text-black font-serif italic font-bold text-xs flex items-center justify-center shadow">
                  Lp
                </div>
                <span>© {new Date().getFullYear()} La Pasadita Inn · Denver, CO</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                <button
                  onClick={() => {
                    setUserModalOpen(true);
                    setUserModalTab('orders');
                  }}
                  className="hover:text-[#DDA843] transition-colors flex items-center gap-1 cursor-pointer text-[#9A9EAB]"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Past Orders</span>
                </button>
                <span>·</span>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="hover:text-[#DDA843] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Database className="w-3 h-3" />
                  <span>Supabase Config & SQL</span>
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    setIsKitchenModalOpen(true);
                    fetchKitchenOrders();
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Kitchen Display
                </button>
                <span>·</span>
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[#DDA843] font-bold"
                >
                  <Shield className="w-3.5 h-3.5 text-[#DDA843]" />
                  <span>Admin Login</span>
                </button>
                <span>·</span>
                <a href="tel:+13038321785" className="hover:text-white transition-colors">(303) 832-1785</a>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Mobile Floating Quick Action Pill (Appears on scroll down on mobile) */}
      <AnimatePresence>
        {isScrolled && !mobileMenuOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed bottom-4 left-3 right-3 z-40 flex items-center justify-between gap-2 p-2 rounded-full bg-[#121318] border border-[#22242D] shadow-2xl"
          >
            <a
              href="#hero"
              className="flex items-center gap-2 pl-2"
            >
              <div className="w-6 h-6 rounded-full bg-white text-black font-serif italic font-black text-[10px] flex items-center justify-center">
                Lp
              </div>
              <span className="text-xs font-bold text-white">La Pasadita</span>
            </a>

            <div className="flex items-center gap-1.5">
              {totalItemCount > 0 && (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#DDA843] text-black text-xs font-extrabold shadow cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{totalItemCount} (${subtotal.toFixed(0)})</span>
                </button>
              )}

              <a
                href="tel:+13038321785"
                className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>

              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-7 h-7 rounded-full bg-[#181A20] border border-[#22242D] text-[#9A9EAB] hover:text-white flex items-center justify-center cursor-pointer"
                title="Navigation Menu"
              >
                <MenuIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          LIVE CART & CHECKOUT DRAWER (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 cursor-pointer"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full sm:w-screen max-w-full sm:max-w-md bg-[#121318] border-l border-[#22242D] shadow-2xl flex flex-col"
              >
                <div className="p-4 border-b border-[#22242D] flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                    <ShoppingBag className="w-4 h-4 text-[#DDA843]" />
                    <span>Customer Cart & Live Checkout</span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#9A9EAB]">
                      <ShoppingBag className="w-12 h-12 mb-3 text-[#3A3D4A]" />
                      <div className="text-sm font-bold text-white">Your cart is empty</div>
                      <p className="text-xs mt-1 max-w-xs">Browse the menu and click "Add to Order" to place a live ticket.</p>
                      
                      {customerPhone && (
                        <button
                          onClick={() => {
                            setIsDrawerOpen(false);
                            setUserModalOpen(true);
                            setUserModalTab('orders');
                          }}
                          className="mt-4 px-4 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-[#DDA843] text-xs font-bold hover:bg-[#22242D] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Past Orders</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#9A9EAB]">
                          Selected Items ({totalItemCount})
                        </div>
                        {cart.map((item, idx) => (
                          <div
                            key={`${item.dish.id}-${idx}`}
                            className="p-3 rounded-xl bg-[#181A20] border border-[#22242D] flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white truncate">{item.dish.name}</div>
                              {item.selectedOption && (
                                <div className="text-[11px] text-[#DDA843]">{item.selectedOption}</div>
                              )}
                              <div className="text-[#9A9EAB] font-mono">${Number(item.dish.price).toFixed(2)}</div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => updateQuantity(idx, -1)}
                                className="p-1 text-[#9A9EAB] hover:text-white cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-white">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(idx, 1)}
                                className="p-1 text-[#9A9EAB] hover:text-white cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-[#DDA843] ml-2">
                                ${(Number(item.dish.price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-3 pt-3 border-t border-[#22242D]">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#9A9EAB]">
                          Customer & Fulfillment Details
                        </div>

                        {checkoutError && (
                          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span>{checkoutError}</span>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] text-[#9A9EAB] mb-1">Your Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Maria Gonzalez"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-base sm:text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#9A9EAB] mb-1">Phone Number (10 Digits) *</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. (303) 555-0192"
                            value={customerPhone}
                            onChange={(e) => {
                              setCustomerPhone(e.target.value);
                              setPastOrdersPhone(e.target.value);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-base sm:text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-[#9A9EAB] mb-1">Fulfillment Method</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['Takeout', 'Dine-In Pickup', 'Delivery'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setOrderType(type)}
                                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                                  orderType === type
                                    ? 'bg-[#DDA843] text-black shadow'
                                    : 'bg-[#181A20] text-[#9A9EAB] border border-[#22242D]'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Delivery Address Fields */}
                        {orderType === 'Delivery' && (
                          <div className="p-3 rounded-2xl bg-[#181A20] border border-[#DDA843]/30 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#DDA843]" />
                                Denver Delivery Address
                              </span>
                              <span className="text-[10px] text-[#DDA843] font-mono">
                                {subtotal >= 45 ? 'FREE Delivery ($45+)' : '$3.99 Delivery Fee'}
                              </span>
                            </div>

                            <div>
                              <input
                                type="text"
                                required
                                placeholder="Street Address (e.g. 1959 Park Ave W)"
                                value={deliveryStreet}
                                onChange={(e) => setDeliveryStreet(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#121318] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Apt / Suite / Floor (Opt)"
                                value={deliveryUnit}
                                onChange={(e) => setDeliveryUnit(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#121318] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                              />
                              <input
                                type="text"
                                required
                                placeholder="ZIP Code (e.g. 80205)"
                                value={deliveryZip}
                                onChange={(e) => setDeliveryZip(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-[#121318] border border-[#22242D] text-white font-mono text-xs focus:outline-none focus:border-[#DDA843]"
                              />
                            </div>

                            <p className="text-[10px] text-[#8E92A0]">
                              Delivery available within 5 miles of Denver Five Points / downtown core. Min order $15.00.
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] text-[#9A9EAB] mb-1">Kitchen & Delivery Notes (Optional)</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Extra green chile on side, ring front doorbell"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-base sm:text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>
                      </form>
                    </>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t border-[#22242D] bg-[#101116] space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#9A9EAB]">
                        <span>Items Subtotal:</span>
                        <span className="font-mono font-bold text-white">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[#6A6E7C]">
                        <span>Denver Food Tax (8.81%):</span>
                        <span className="font-mono">${denverTax.toFixed(2)}</span>
                      </div>
                      {orderType === 'Delivery' && (
                        <div className="flex justify-between text-[#DDA843]">
                          <span>Delivery Fee:</span>
                          <span className="font-mono font-bold">
                            {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-[#22242D] text-white">
                        <span>Total Due:</span>
                        <span className="font-mono font-bold" style={{ color: siteSettings.primary_accent_color }}>
                          ${finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      form="checkout-form"
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-3.5 rounded-xl text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: siteSettings.primary_accent_color }}
                    >
                      {isSubmittingOrder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending Order to Kitchen...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Order (${finalTotal.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          ORDER SUCCESS CONFIRMATION MODAL: SOLID MATTE #121318
         ========================================================================= */}
      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOrderSuccess(null)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-[#121318] border border-[#22242D] p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div
                className="w-16 h-16 rounded-full bg-[#181A20] border border-[#22242D] mx-auto flex items-center justify-center"
                style={{ color: siteSettings.primary_accent_color }}
              >
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: siteSettings.primary_accent_color }}>
                  Order Placed Successfully
                </span>
                <h3 className="font-display font-black text-2xl text-white mt-1">
                  Ticket Sent to Kitchen
                </h3>
                <p className="text-xs text-[#9A9EAB] mt-1">
                  Thank you, <strong className="text-white">{orderSuccess.customer_name}</strong>! We’ve started preparing your order.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#181A20] border border-[#22242D] text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#9A9EAB]">Order ID:</span>
                  <span className="font-mono text-white font-bold">{orderSuccess.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9A9EAB]">Order Method:</span>
                  <span className="font-bold text-white">{orderSuccess.order_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9A9EAB]">
                    {orderSuccess.order_type === 'Delivery' ? 'Estimated Delivery:' : 'Estimated Pickup:'}
                  </span>
                  <span className="font-bold" style={{ color: siteSettings.primary_accent_color }}>
                    {orderSuccess.order_type === 'Delivery' ? '30 – 45 Mins' : siteSettings.estimated_pickup_minutes}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9A9EAB]">
                    {orderSuccess.order_type === 'Delivery' ? 'Deliver to:' : 'Pickup Location:'}
                  </span>
                  <span className="text-white truncate max-w-[200px]">
                    {orderSuccess.order_type === 'Delivery' && orderSuccess.delivery_address
                      ? orderSuccess.delivery_address
                      : '1959 Park Ave W, Denver'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#22242D] font-bold">
                  <span className="text-[#9A9EAB]">Total:</span>
                  <span className="font-mono text-white">${Number(orderSuccess.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-[#DDA843] transition-colors cursor-pointer"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setOrderSuccess(null);
                    setIsDrawerOpen(false);
                    setUserModalOpen(true);
                    setUserModalTab('orders');
                    fetchPastOrders(customerPhone);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#181A20] text-[#DDA843] border border-[#22242D] font-bold text-xs uppercase tracking-wider hover:bg-[#22242D] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View in Past Orders</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          REALTIME KITCHEN DISPLAY SYSTEM (KDS)
         ========================================================================= */}
      <AnimatePresence>
        {isKitchenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKitchenModalOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl h-[85vh] rounded-3xl bg-[#121318] border border-[#22242D] p-6 shadow-2xl z-10 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#22242D] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#181A20] border border-[#22242D] text-[#DDA843] flex items-center justify-center">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                      <span>Kitchen Display System (KDS)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </h3>
                    <p className="text-xs text-[#9A9EAB]">
                      Live incoming orders synced in real time via Supabase WebSocket channel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchKitchenOrders}
                    className="p-2 rounded-lg bg-[#181A20] hover:bg-[#22242D] text-[#9A9EAB] hover:text-white transition-colors cursor-pointer"
                    title="Refresh orders"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingKitchen ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsKitchenModalOpen(false)}
                    className="p-2 rounded-lg bg-[#181A20] hover:bg-[#22242D] text-[#9A9EAB] hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {kitchenNotification && (
                <div className="my-3 p-3 rounded-xl bg-[#181A20] border border-[#DDA843]/50 text-[#DDA843] text-xs font-bold flex items-center gap-2 shrink-0">
                  <Bell className="w-4 h-4" />
                  <span>{kitchenNotification}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {kitchenOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#9A9EAB]">
                    <ChefHat className="w-12 h-12 mb-3 text-[#3A3D4A]" />
                    <div className="text-base font-bold text-white">No active orders in kitchen queue</div>
                    <p className="text-xs mt-1 max-w-sm">
                      New customer orders placed through the website will appear here in real time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {kitchenOrders.map((ord) => {
                      const isPending = ord.status === 'pending';
                      const isPreparing = ord.status === 'preparing';
                      const isReady = ord.status === 'ready';

                      return (
                        <div
                          key={ord.id}
                          className="rounded-2xl border border-[#22242D] bg-[#181A20] p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2 pb-2 border-b border-[#22242D]">
                              <div>
                                <span className="text-[10px] font-mono text-[#9A9EAB] uppercase">
                                  #{ord.id.slice(0, 6)} · {ord.order_type}
                                </span>
                                <h4 className="font-display font-bold text-white text-base">
                                  {ord.customer_name}
                                </h4>
                                <a href={`tel:${ord.customer_phone}`} className="text-xs text-[#DDA843] hover:underline">
                                  {ord.customer_phone}
                                </a>
                              </div>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-[#DDA843] text-black'
                                    : isPreparing
                                    ? 'bg-blue-400 text-black'
                                    : isReady
                                    ? 'bg-emerald-400 text-black'
                                    : 'bg-[#22242D] text-white'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className="space-y-1.5 py-2 text-xs">
                              {ord.order_items && ord.order_items.length > 0 ? (
                                ord.order_items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-slate-200">
                                    <span>
                                      <strong className="text-[#DDA843] font-mono mr-1.5">{it.quantity}x</strong>
                                      {it.item_name}
                                    </span>
                                    <span className="text-[#9A9EAB] font-mono">${Number(it.unit_price).toFixed(2)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[#9A9EAB] text-[11px] italic">Items being prepared</div>
                              )}
                            </div>

                            {ord.notes && (
                              <div className="mt-2 p-2 rounded-lg bg-[#121318] text-[11px] text-[#DDA843] border border-[#22242D]">
                                <strong>Notes:</strong> {ord.notes}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 mt-3 border-t border-[#22242D] flex items-center justify-between gap-1">
                            <span className="font-mono text-xs font-bold text-white">
                              Total: ${Number(ord.total_amount).toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1">
                              {isPending && (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'preparing')}
                                  className="px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-black font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Start Cooking
                                </button>
                              )}
                              {isPreparing && (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'ready')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {isReady && (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'completed')}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#DDA843] text-black font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Complete Pickup
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          USER MODAL: 'PAST ORDERS' & RESTAURANT INFO (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setUserModalOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl max-h-[90vh] rounded-2xl sm:rounded-3xl bg-[#121318] border border-[#22242D] p-4 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white text-black font-serif italic font-bold text-xs flex items-center justify-center">
                    Lp
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white">Customer Account</h3>
                    <p className="text-[11px] text-[#9A9EAB]">Order history & restaurant contacts</p>
                  </div>
                </div>

                <button
                  onClick={() => setUserModalOpen(false)}
                  className="p-1 rounded-md text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs: Past Orders vs Info */}
              <div className="flex gap-2 pt-3 pb-2 shrink-0">
                <button
                  onClick={() => setUserModalTab('orders')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    userModalTab === 'orders'
                      ? 'bg-white text-black shadow'
                      : 'bg-[#181A20] text-[#9A9EAB] border border-[#22242D] hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>My Past Orders</span>
                </button>
                <button
                  onClick={() => setUserModalTab('info')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    userModalTab === 'info'
                      ? 'bg-white text-black shadow'
                      : 'bg-[#181A20] text-[#9A9EAB] border border-[#22242D] hover:text-white'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Restaurant Details</span>
                </button>
              </div>

              {/* Tab 1: Past Orders Query & History */}
              {userModalTab === 'orders' ? (
                <div className="flex-1 overflow-y-auto pt-2 space-y-4">
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-[#181A20] border border-[#22242D] space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Lookup Orders by Phone Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={pastOrdersPhone}
                        onChange={(e) => setPastOrdersPhone(e.target.value)}
                        placeholder="Enter phone (e.g. 303-555-0192)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-[#121318] border border-[#22242D] text-white font-mono text-base sm:text-xs focus:outline-none focus:border-[#DDA843]"
                      />
                      <button
                        onClick={() => fetchPastOrders(pastOrdersPhone)}
                        disabled={isLoadingPastOrders || !pastOrdersPhone.trim()}
                        className="px-4 py-2 rounded-xl bg-white text-black hover:bg-[#DDA843] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isLoadingPastOrders ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Find</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#9A9EAB]">
                      Queries the Supabase <code className="text-[#DDA843]">orders</code> table for all tickets matching your phone.
                    </p>
                  </div>

                  {isLoadingPastOrders ? (
                    <div className="text-center py-10 text-[#9A9EAB] space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#DDA843]" />
                      <p className="text-xs">Querying your order history from Supabase...</p>
                    </div>
                  ) : pastOrders.length === 0 ? (
                    <div className="text-center py-10 text-[#9A9EAB] space-y-2">
                      <Receipt className="w-10 h-10 mx-auto text-[#3A3D4A] mb-1" />
                      <div className="text-sm font-bold text-white">
                        {hasQueriedPastOrders ? 'No past orders found' : 'Enter your phone number above'}
                      </div>
                      <p className="text-xs max-w-xs mx-auto">
                        {hasQueriedPastOrders
                          ? 'We could not find any previous tickets for this phone number. Place an order to see your history here!'
                          : 'Orders placed on this device or with your phone number will be displayed here in real time.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#9A9EAB]">
                        <span>Found {pastOrders.length} order{pastOrders.length > 1 ? 's' : ''}</span>
                        <span className="text-[#DDA843]">Linked to {pastOrdersPhone}</span>
                      </div>

                      {pastOrders.map((ord) => {
                        const isPending = ord.status === 'pending';
                        const isPreparing = ord.status === 'preparing';
                        const isReady = ord.status === 'ready';

                        return (
                          <div
                            key={ord.id}
                            className="p-4 rounded-2xl bg-[#181A20] border border-[#22242D] space-y-3 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2 border-b border-[#22242D] pb-2">
                              <div>
                                <span className="font-mono text-[10px] text-[#9A9EAB] uppercase">
                                  #{ord.id.slice(0, 8)} · {ord.order_type}
                                </span>
                                <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="w-3 h-3 text-[#DDA843]" />
                                  <span>{new Date(ord.created_at).toLocaleDateString()} at {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-[#DDA843] text-black'
                                    : isPreparing
                                    ? 'bg-blue-400 text-black'
                                    : isReady
                                    ? 'bg-emerald-400 text-black'
                                    : 'bg-[#22242D] text-white'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs">
                              {ord.order_items && ord.order_items.length > 0 ? (
                                ord.order_items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-slate-200">
                                    <span>
                                      <strong className="text-[#DDA843] font-mono mr-1.5">{it.quantity}x</strong>
                                      {it.item_name}
                                      {it.selected_option && (
                                        <span className="text-[11px] text-[#9A9EAB] ml-1">({it.selected_option})</span>
                                      )}
                                    </span>
                                    <span className="text-[#9A9EAB] font-mono">${Number(it.unit_price).toFixed(2)}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[#9A9EAB] text-[11px] italic">Items summary recorded</div>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#22242D] flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-white">
                                Total: <strong className="text-[#DDA843] font-bold">${Number(ord.total_amount).toFixed(2)}</strong>
                              </span>

                              <button
                                onClick={() => handleReorder(ord)}
                                className="px-3 py-1 rounded-lg bg-[#121318] hover:bg-[#DDA843] hover:text-black text-[#DDA843] border border-[#22242D] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reorder Items</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Restaurant Info */
                <div className="flex-1 overflow-y-auto pt-3 space-y-4 text-xs text-[#9A9EAB]">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#DDA843] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Address:</strong> 1959 Park Ave W, Denver, CO 80205
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-[#DDA843] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Phone:</strong> +1 (303) 832-1785
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-[#DDA843] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Operating Hours:</strong> Mon–Sat 11 AM – 8 PM (Closed Sunday)
                      </div>
                    </div>
                  </div>

                  <a
                    href="tel:+13038321785"
                    className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#DDA843] transition-colors cursor-pointer shadow-md"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call +1 (303) 832-1785</span>
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          SUPABASE CONFIG & SQL SETUP MODAL (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-3xl bg-[#121318] border border-[#22242D] p-6 shadow-2xl z-10 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D]">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#DDA843]" />
                  <h3 className="font-display font-extrabold text-lg text-white">
                    Supabase Database Configuration
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#9A9EAB]">
                <p>
                  Connect your live Supabase project to enable real-time order processing and dynamic menu item syncing.
                </p>

                <div className="p-4 rounded-2xl bg-[#181A20] border border-[#22242D] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-[#DDA843]" />
                      Step 1: SQL Schema & Seed Migration
                    </span>
                    <button
                      onClick={copySqlSchema}
                      className="px-3 py-1 rounded-lg bg-[#DDA843] text-black font-bold text-[11px] hover:bg-[#E9B958] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{schemaCopied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9A9EAB]">
                    Execute the schema script in your Supabase project's SQL Editor to create the <code className="text-[#DDA843]">categories</code>, <code className="text-[#DDA843]">menu_items</code>, <code className="text-[#DDA843]">orders</code>, and <code className="text-[#DDA843]">order_items</code> tables with Realtime enabled.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Step 2: Enter Supabase Credentials
                  </div>

                  <div>
                    <label className="block text-[#9A9EAB] mb-1">Supabase Project URL (e.g. https://xyz.supabase.co)</label>
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white font-mono text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#9A9EAB] mb-1">Supabase Anon Public API Key</label>
                    <input
                      type="password"
                      value={inputAnonKey}
                      onChange={(e) => setInputAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white font-mono text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-[#22242D]">
                  <button
                    onClick={() => {
                      if (!inputUrl || !inputAnonKey) {
                        alert('Please provide both your Supabase URL and Anon Key.');
                        return;
                      }
                      saveRuntimeCredentials(inputUrl, inputAnonKey);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white text-black font-extrabold uppercase tracking-wider hover:bg-[#DDA843] transition-colors cursor-pointer"
                  >
                    Save & Connect Supabase
                  </button>

                  {isConfigured && (
                    <button
                      onClick={clearRuntimeCredentials}
                      className="px-4 py-2.5 rounded-xl bg-[#181A20] border border-red-500/30 text-red-400 hover:bg-red-500/20 font-bold transition-colors cursor-pointer"
                    >
                      Reset to Demo
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          ITEM DETAIL MODAL (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalItem(null)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl bg-[#121318] border border-[#22242D] overflow-hidden shadow-2xl z-10 p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    {activeModalItem.name}
                  </h3>
                  {activeModalItem.spanish_name && (
                    <div className="text-xs text-[#DDA843] italic">
                      {activeModalItem.spanish_name}
                    </div>
                  )}
                </div>
                <div className="font-mono font-bold text-base text-[#DDA843]">
                  ${Number(activeModalItem.price).toFixed(2)}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#9A9EAB] leading-relaxed">
                {activeModalItem.description}
              </p>

              {activeModalItem.grandma_note && (
                <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D] text-xs text-[#DDA843] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#DDA843] shrink-0 mt-0.5" />
                  <span>{activeModalItem.grandma_note}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-[#22242D]">
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-3 py-1.5 text-xs text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    addToCart(activeModalItem);
                    setActiveModalItem(null);
                    setIsDrawerOpen(true);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-[#DDA843] text-xs font-bold transition-colors cursor-pointer"
                >
                  Add to Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          WATCH AND COOK / GRANDMA'S KITCHEN HERITAGE VIDEO MODAL
         ========================================================================= */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl bg-[#121318] border border-[#22242D] p-5 sm:p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D]">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#DDA843]" />
                  <h3 className="font-display font-extrabold text-lg text-white">
                    Grandma's Kitchen · Denver Landmark Heritage
                  </h3>
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Preview Presentation */}
              <div className="relative rounded-xl overflow-hidden border border-[#22242D] aspect-video bg-black shadow-xl">
                <img
                  src={IMAGES.kitchenStory}
                  alt="Kitchen cooking presentation"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DDA843] uppercase tracking-widest mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>The Abuela Comal Tradition</span>
                  </div>
                  <h4 className="font-display font-bold text-white text-lg">
                    Roasting Poblanos & Simmering Denver Green Chile
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    Step inside 1959 Park Ave W as grandmother prepares the morning masa, hand-stretches tortillas, and simmers the famous pork green chile.
                  </p>
                </div>
              </div>

              {/* Recipe Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#181A20] border border-[#22242D]">
                  <div className="text-[#8E92A0] text-[10px]">Poblano Pepper</div>
                  <div className="font-bold text-white">Comal Roasted</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#181A20] border border-[#22242D]">
                  <div className="text-[#8E92A0] text-[10px]">Jack Cheese</div>
                  <div className="font-bold text-white">Molten Melt</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#181A20] border border-[#22242D]">
                  <div className="text-[#8E92A0] text-[10px]">Green Chile</div>
                  <div className="font-bold text-white">4-Hr Simmer</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#181A20] border border-[#22242D]">
                  <div className="text-[#8E92A0] text-[10px]">Tortillas</div>
                  <div className="font-bold text-white">Hand Pressed</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#22242D]">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9A9EAB] hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const targetDish = menuItems.find(m => m.id === FEATURED_HERO_SLIDES[activeHeroSlide].dishRefId) || menuItems[0];
                    addToCart(targetDish);
                    setIsVideoModalOpen(false);
                    setIsDrawerOpen(true);
                  }}
                  className="px-5 py-2 rounded-xl bg-white text-black hover:bg-amber-400 font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow"
                >
                  Order This Dish Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Toast Notification */}
      <AnimatePresence>
        {socialToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#121318] border border-[#22242D] text-white text-xs shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#DDA843]" />
            <span>{socialToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          TABLE RESERVATIONS & PRIVATE DINING MODAL (SOLID MATTE #121318)
         ========================================================================= */}
      <AnimatePresence>
        {isReservationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsReservationOpen(false);
                setResSuccess(null);
              }}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-3xl bg-[#121318] border border-[#22242D] p-5 sm:p-7 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#181A20] border border-[#22242D] text-[#DDA843] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-base sm:text-lg text-white">
                      Table Reservation
                    </h3>
                    <p className="text-[11px] text-[#9A9EAB]">
                      1959 Park Ave W · Denver Historic Landmark
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsReservationOpen(false);
                    setResSuccess(null);
                  }}
                  className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {resSuccess ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#DDA843]">
                      Reservation Confirmed
                    </span>
                    <h4 className="font-display font-extrabold text-xl text-white mt-1">
                      Table Held for {resSuccess.customer_name}
                    </h4>
                    <p className="text-xs text-[#9A9EAB] mt-1">
                      Confirmation ticket #{resSuccess.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#181A20] border border-[#22242D] text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#9A9EAB]">Party Size:</span>
                      <span className="font-bold text-white">{resSuccess.party_size} Guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9A9EAB]">Date:</span>
                      <span className="font-bold text-[#DDA843]">{resSuccess.reservation_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9A9EAB]">Time:</span>
                      <span className="font-bold text-white">{resSuccess.reservation_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9A9EAB]">Contact Phone:</span>
                      <span className="font-mono text-white">{resSuccess.customer_phone}</span>
                    </div>
                    {resSuccess.special_requests && (
                      <div className="pt-2 border-t border-[#22242D]">
                        <span className="text-[#9A9EAB]">Requests:</span>
                        <p className="text-white mt-0.5">{resSuccess.special_requests}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[#8E92A0]">
                    We hold tables for 15 minutes past reservation time. Call (303) 832-1785 for modifications.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setIsReservationOpen(false);
                      setResSuccess(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#DDA843] transition-colors cursor-pointer shadow"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReservation} className="space-y-3.5">
                  {resError && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <span>{resError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mateo Ortiz"
                        value={resName}
                        onChange={(e) => setResName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                        Phone (10 Digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. (303) 555-0199"
                        value={resPhone}
                        onChange={(e) => setResPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. mateo@example.com"
                      value={resEmail}
                      onChange={(e) => setResEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                        Party Size
                      </label>
                      <select
                        value={resPartySize}
                        onChange={(e) => setResPartySize(Number(e.target.value))}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num} className="bg-[#181A20] text-white">
                            {num} {num === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().slice(0, 10)}
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                        Time Slot
                      </label>
                      <select
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                      >
                        {[
                          '11:30 AM',
                          '12:00 PM',
                          '12:30 PM',
                          '1:00 PM',
                          '1:30 PM',
                          '5:00 PM',
                          '5:30 PM',
                          '6:00 PM',
                          '6:30 PM',
                          '7:00 PM',
                          '7:30 PM'
                        ].map((t) => (
                          <option key={t} value={t} className="bg-[#181A20] text-white">
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Seating Preferences / Occasion (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Booth preferred, anniversary dinner, high chair needed"
                      value={resNotes}
                      onChange={(e) => setResNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#22242D]">
                    <button
                      type="button"
                      onClick={() => setIsReservationOpen(false)}
                      className="px-4 py-2 text-xs text-[#9A9EAB] hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRes}
                      className="px-5 py-2.5 rounded-xl bg-[#DDA843] hover:bg-[#E9B958] text-black font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmittingRes ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Booking...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Confirm Table Booking</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Dashboard Component (Live Orders, Menu CRUD, Operational Settings) */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        menuItems={menuItems}
        onMenuItemsChange={(updatedItems) => setMenuItems(updatedItems)}
        orders={kitchenOrders}
        onOrdersChange={(updatedOrders) => setKitchenOrders(updatedOrders)}
        siteSettings={siteSettings}
        onSiteSettingsChange={handleSiteSettingsChange}
      />

    </div>
  );
}
