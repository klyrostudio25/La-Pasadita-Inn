/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Shield,
  LogOut,
  ShoppingBag,
  Clock,
  Phone,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  ChefHat,
  Sparkles,
  X,
  Check,
  Megaphone,
  Store,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Palette,
  Type,
  Copy,
  Code,
  UploadCloud,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  Camera,
  MapPin
} from 'lucide-react';
import {
  supabase,
  isConfigured,
  MenuItemRecord,
  OrderRecord,
  Category,
  SiteSettingsRecord,
  DEFAULT_SITE_SETTINGS
} from '../lib/supabase';
import { AdminAnalytics } from './AdminAnalytics';
import { processAndUploadImage } from '../lib/imageUpload';

// Web Audio API Synthesized Restaurant Chime for live orders
function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (E5: 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Second harmonic chime (B5: 987.77Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.14);
    gain2.gain.setValueAtTime(0.35, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

// Re-export for compatibility
export type SiteSettings = SiteSettingsRecord;

const PRESET_IMAGE_OPTIONS = [
  { label: 'Crispy Chile Relleno', url: '/src/assets/images/hero_chile_relleno_1792550221170.jpg' },
  { label: 'Sizzling Fajitas Skillet', url: '/src/assets/images/sizzling_fajitas_skillet_1792550222395.jpg' },
  { label: 'Pozole Rojo Traditional', url: '/src/assets/images/pozole_rojo_bowl_1792550223047.jpg' },
  { label: 'Street Tacos Platter', url: '/src/assets/images/street_tacos_platter_1792550349202.jpg' },
  { label: 'Churros & House Flan', url: '/src/assets/images/churros_and_flan_dessert_1792550348343.jpg' },
  { label: 'Kitchen Story Comal', url: '/src/assets/images/la_pasadita_story_kitchen_1792550223270.jpg' }
];

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItemRecord[];
  onMenuItemsChange: (items: MenuItemRecord[]) => void;
  orders: OrderRecord[];
  onOrdersChange: (orders: OrderRecord[]) => void;
  siteSettings: SiteSettingsRecord;
  onSiteSettingsChange: (settings: SiteSettingsRecord) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  menuItems,
  onMenuItemsChange,
  orders,
  onOrdersChange,
  siteSettings,
  onSiteSettingsChange
}) => {
  // Authentication State with 4-Hour Session Expiry Check
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isAuth = localStorage.getItem('la_pasadita_admin_auth') === 'true';
    const expiresStr = localStorage.getItem('la_pasadita_admin_session_expires');
    if (!isAuth) return false;
    if (expiresStr) {
      const expires = parseInt(expiresStr, 10);
      if (!isNaN(expires) && Date.now() > expires) {
        localStorage.removeItem('la_pasadita_admin_auth');
        localStorage.removeItem('la_pasadita_admin_session_expires');
        return false;
      }
    }
    return isAuth;
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('la_pasadita_admin_email') || 'admin@lapasadita.com' : 'admin@lapasadita.com';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Active Admin Tab: 'orders' | 'analytics' | 'menu' | 'settings'
  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'menu' | 'settings'>('orders');

  // Order Sound Alert Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  // Orders Tab Filter & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');

  // Menu Tab Search & Category Filter
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');

  // Menu CRUD Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRecord | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItemRecord | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formSpanishName, setFormSpanishName] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('cat-specials');
  const [formCategoryName, setFormCategoryName] = useState('Signature Specials');
  const [formPrice, setFormPrice] = useState('14.99');
  const [formBadge, setFormBadge] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formSpiceLevel, setFormSpiceLevel] = useState('Medium');
  const [formGrandmaNote, setFormGrandmaNote] = useState('');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_IMAGE_OPTIONS[0].url);
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [isSavingItem, setIsSavingItem] = useState(false);

  // Device / PC / Phone Gallery Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle Image File Upload (Phone Gallery or PC File)
  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const result = await processAndUploadImage(file);
      setFormImageUrl(result.url);
      setUploadedFileName(`${result.fileName} (${result.fileSizeKb} KB)`);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'Failed to process image file.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Settings Local Copy & State
  const [localSettings, setLocalSettings] = useState<SiteSettingsRecord>(siteSettings);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Sync settings when prop updates
  useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  // Listen to Supabase Auth State changes if Supabase is connected
  useEffect(() => {
    if (supabase && isConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.email) {
          setIsAuthenticated(true);
          setAdminEmail(session.user.email);
          localStorage.setItem('la_pasadita_admin_auth', 'true');
          localStorage.setItem('la_pasadita_admin_email', session.user.email);
        }
      }).catch(err => console.warn('Supabase auth session check:', err));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user?.email) {
          setIsAuthenticated(true);
          setAdminEmail(session.user.email);
          localStorage.setItem('la_pasadita_admin_auth', 'true');
          localStorage.setItem('la_pasadita_admin_email', session.user.email);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Real-time listener for incoming orders
  useEffect(() => {
    if (!supabase || !isConfigured) return;

    const channel = supabase
      .channel('admin-dashboard-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as OrderRecord;
            onOrdersChange([newOrder, ...orders.filter(o => o.id !== newOrder.id)]);
            
            if (soundEnabled) {
              playOrderChime();
            }
            setOrderNotification(`🔔 New order #${newOrder.id.slice(0, 8)} from ${newOrder.customer_name}!`);
            setTimeout(() => setOrderNotification(null), 5000);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as OrderRecord;
            onOrdersChange(orders.map(o => o.id === updated.id ? { ...o, ...updated } : o));
          } else if (payload.eventType === 'DELETE') {
            onOrdersChange(orders.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [orders, onOrdersChange, soundEnabled]);

  // Real-time listener for site_settings
  useEffect(() => {
    if (!supabase || !isConfigured) return;

    const settingsChannel = supabase
      .channel('admin-dashboard-site-settings')
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
            onSiteSettingsChange(updated);
            setLocalSettings(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(settingsChannel);
    };
  }, [onSiteSettingsChange]);

  // Real-time listener for menu_items CRUD updates
  useEffect(() => {
    if (!supabase || !isConfigured) return;

    const menuChannel = supabase
      .channel('admin-dashboard-menu-items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as MenuItemRecord;
            onMenuItemsChange([newItem, ...menuItems.filter(m => m.id !== newItem.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MenuItemRecord;
            onMenuItemsChange(menuItems.map(m => m.id === updated.id ? { ...m, ...updated } : m));
          } else if (payload.eventType === 'DELETE') {
            onMenuItemsChange(menuItems.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(menuChannel);
    };
  }, [menuItems, onMenuItemsChange]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    const emailTrim = loginEmail.trim();
    const passTrim = loginPassword.trim();

    if (!emailTrim || !passTrim) {
      setIsAuthenticating(false);
      setAuthError('Please enter both email and password.');
      return;
    }

    // 1. If Supabase is configured with Auth, attempt real Supabase sign-in
    if (supabase && isConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password: passTrim
        });

        if (error) {
          setIsAuthenticating(false);
          setAuthError(`Supabase Auth failed: ${error.message}`);
          return;
        }

        if (data.user) {
          setIsAuthenticated(true);
          setAdminEmail(data.user.email || emailTrim);
          const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
          localStorage.setItem('la_pasadita_admin_auth', 'true');
          localStorage.setItem('la_pasadita_admin_email', data.user.email || emailTrim);
          localStorage.setItem('la_pasadita_admin_session_expires', expiresAt.toString());
          setIsAuthenticating(false);
          return;
        }
      } catch (err: any) {
        setIsAuthenticating(false);
        setAuthError(`Auth error: ${err.message || 'Connection failure'}`);
        return;
      }
    }

    // 2. Strict Offline / Sandbox Fallback (Only active when Supabase is disconnected)
    if (!isConfigured) {
      if (emailTrim.toLowerCase() === 'admin@lapasadita.com' && passTrim === 'denver1959') {
        setIsAuthenticated(true);
        setAdminEmail(emailTrim);
        const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
        localStorage.setItem('la_pasadita_admin_auth', 'true');
        localStorage.setItem('la_pasadita_admin_email', emailTrim);
        localStorage.setItem('la_pasadita_admin_session_expires', expiresAt.toString());
        setIsAuthenticating(false);
        return;
      } else {
        setIsAuthenticating(false);
        setAuthError('Invalid credentials. Local sandbox demo requires admin@lapasadita.com / denver1959');
        return;
      }
    }

    setIsAuthenticating(false);
    setAuthError('Authentication failed. Check your Supabase Auth user credentials.');
  };

  const handleLogout = async () => {
    if (supabase && isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Signout note:', err);
      }
    }
    setIsAuthenticated(false);
    localStorage.removeItem('la_pasadita_admin_auth');
    localStorage.removeItem('la_pasadita_admin_email');
    localStorage.removeItem('la_pasadita_admin_session_expires');
  };

  // Quick action: update order status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderRecord['status']) => {
    // 1. Optimistic local update
    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, status: nextStatus, updated_at: new Date().toISOString() } : o
    );
    onOrdersChange(updatedOrders);

    // 2. Supabase update if connected
    if (supabase && isConfigured) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);

        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to update order status in Supabase:', err);
      }
    }
  };

  // Quick Action: Toggle Menu Item availability (In Stock / Out of Stock)
  const handleToggleAvailability = async (item: MenuItemRecord) => {
    const nextState = !item.is_available;
    const updatedList = menuItems.map(m => m.id === item.id ? { ...m, is_available: nextState } : m);
    onMenuItemsChange(updatedList);

    if (supabase && isConfigured) {
      try {
        const { error } = await supabase
          .from('menu_items')
          .update({ is_available: nextState })
          .eq('id', item.id);

        if (error) throw error;
      } catch (err: any) {
        console.error('Failed to toggle item availability in Supabase:', err);
      }
    }
  };

  // Open Edit Modal for a dish
  const openEditModal = (item: MenuItemRecord) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSpanishName(item.spanish_name || '');
    setFormCategoryId(item.category_id || 'cat-specials');
    setFormCategoryName(item.categories?.name || 'Signature Specials');
    setFormPrice(item.price.toString());
    setFormBadge(item.badge || '');
    setFormDescription(item.description);
    setFormSpiceLevel(item.spice_level || 'Medium');
    setFormGrandmaNote(item.grandma_note || '');
    setFormImageUrl(item.image_url);
    setFormIsAvailable(item.is_available);
    setUploadError(null);
    setUploadedFileName(null);
    setIsDragOver(false);
    setIsAddModalOpen(true);
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormSpanishName('');
    setFormCategoryId('cat-specials');
    setFormCategoryName('Signature Specials');
    setFormPrice('14.99');
    setFormBadge("Grandma's Favorite");
    setFormDescription('');
    setFormSpiceLevel('Medium');
    setFormGrandmaNote('Traditional scratch preparation with roasted chiles.');
    setFormImageUrl(PRESET_IMAGE_OPTIONS[0].url);
    setFormIsAvailable(true);
    setUploadError(null);
    setUploadedFileName(null);
    setIsDragOver(false);
    setIsAddModalOpen(true);
  };

  // Submit Add or Edit Form
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    setIsSavingItem(true);
    const parsedPrice = parseFloat(formPrice) || 0;

    const payload: Partial<MenuItemRecord> = {
      name: formName.trim(),
      spanish_name: formSpanishName.trim() || null,
      category_id: formCategoryId,
      price: parsedPrice,
      badge: formBadge.trim() || null,
      description: formDescription.trim(),
      spice_level: formSpiceLevel || null,
      grandma_note: formGrandmaNote.trim() || null,
      image_url: formImageUrl.trim(),
      is_available: formIsAvailable,
      categories: { id: formCategoryId, name: formCategoryName, display_order: 1 }
    };

    try {
      if (editingItem) {
        // Edit existing
        const updatedList = menuItems.map(m =>
          m.id === editingItem.id ? { ...m, ...payload, id: editingItem.id } : m
        );
        onMenuItemsChange(updatedList);

        if (supabase && isConfigured) {
          const { error } = await supabase
            .from('menu_items')
            .update({
              name: payload.name,
              spanish_name: payload.spanish_name,
              category_id: payload.category_id,
              price: payload.price,
              badge: payload.badge,
              description: payload.description,
              spice_level: payload.spice_level,
              grandma_note: payload.grandma_note,
              image_url: payload.image_url,
              is_available: payload.is_available
            })
            .eq('id', editingItem.id);

          if (error) console.warn('Supabase menu update note:', error.message);
        }
      } else {
        // Add new
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `item-${Date.now()}`;
        const newRecord: MenuItemRecord = {
          id: newId,
          ...(payload as any),
          created_at: new Date().toISOString()
        };
        onMenuItemsChange([newRecord, ...menuItems]);

        if (supabase && isConfigured) {
          const { error } = await supabase
            .from('menu_items')
            .insert([{
              id: newId,
              name: payload.name,
              spanish_name: payload.spanish_name,
              category_id: payload.category_id,
              price: payload.price,
              badge: payload.badge,
              description: payload.description,
              spice_level: payload.spice_level,
              grandma_note: payload.grandma_note,
              image_url: payload.image_url,
              is_available: payload.is_available
            }]);

          if (error) console.warn('Supabase menu insert note:', error.message);
        }
      }

      setIsAddModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error('Error saving menu item:', err);
    } finally {
      setIsSavingItem(false);
    }
  };

  // Delete Menu Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id;

    onMenuItemsChange(menuItems.filter(m => m.id !== targetId));
    setItemToDelete(null);

    if (supabase && isConfigured) {
      try {
        const { error } = await supabase
          .from('menu_items')
          .delete()
          .eq('id', targetId);

        if (error) console.warn('Supabase menu delete note:', error.message);
      } catch (err: any) {
        console.error('Error deleting menu item in Supabase:', err);
      }
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchesName = ord.customer_name?.toLowerCase().includes(q);
        const matchesPhone = ord.customer_phone?.includes(q);
        const matchesId = ord.id?.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // Order Counts
  const orderCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0)
    };
  }, [orders]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (menuCategoryFilter !== 'all') {
        const cat = item.categories?.name?.toLowerCase() || '';
        if (menuCategoryFilter === 'specials' && !cat.includes('special')) return false;
        if (menuCategoryFilter === 'tacos' && !cat.includes('taco') && !cat.includes('torta')) return false;
        if (menuCategoryFilter === 'soups' && !cat.includes('caldo') && !cat.includes('soup')) return false;
        if (menuCategoryFilter === 'drinks' && !cat.includes('drink') && !cat.includes('dessert')) return false;
      }
      if (menuSearchQuery.trim()) {
        const q = menuSearchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          (item.spanish_name && item.spanish_name.toLowerCase().includes(q)) ||
          (item.badge && item.badge.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [menuItems, menuCategoryFilter, menuSearchQuery]);

  // Save Site Settings to Supabase and Local State
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);

    // 1. Optimistic local update
    onSiteSettingsChange(localSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('la_pasadita_site_settings', JSON.stringify(localSettings));
    }

    // 2. Persist to Supabase site_settings table
    if (supabase && isConfigured) {
      try {
        const { error } = await supabase
          .from('site_settings')
          .upsert({
            id: 'default',
            primary_accent_color: localSettings.primary_accent_color,
            dark_theme_background: localSettings.dark_theme_background,
            hero_title: localSettings.hero_title,
            hero_subtext: localSettings.hero_subtext,
            announcement_banner_text: localSettings.announcement_banner_text,
            announcement_enabled: localSettings.announcement_enabled,
            open_closed_status: localSettings.open_closed_status,
            custom_closed_message: localSettings.custom_closed_message,
            estimated_pickup_minutes: localSettings.estimated_pickup_minutes,
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.warn('Supabase site_settings upsert error:', error.message);
        }
      } catch (err: any) {
        console.error('Failed to save settings to Supabase:', err);
      }
    }

    setIsSavingSettings(false);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Quick Seed Test Order with live Supabase persistence
  const handleAddSampleOrder = async () => {
    const sampleNames = ['Carlos Mendoza', 'Elena Vance', 'Mateo Ortiz', 'Sarah Jenkins', 'Diego Ramirez'];
    const samplePhone = `(303) ${Math.floor(200 + Math.random() * 700)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomTotal = Number((18 + Math.random() * 35).toFixed(2));
    const randomId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `ord-${Math.random().toString(36).substring(2, 8)}`;

    const randType = Math.random() > 0.6 ? 'Delivery' : Math.random() > 0.3 ? 'Takeout' : 'Dine-In Pickup';
    const sampleAddresses = [
      '2105 Champa St #302, Denver, CO 80205',
      '1820 22nd St, Denver, CO 80205',
      '2401 Larimer St, Denver, CO 80205'
    ];

    const newSample: OrderRecord = {
      id: randomId,
      customer_name: randomName,
      customer_phone: samplePhone,
      order_type: randType,
      delivery_address: randType === 'Delivery' ? sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)] : null,
      delivery_fee: randType === 'Delivery' ? (randomTotal >= 45 ? 0 : 3.99) : 0,
      total_amount: randomTotal,
      status: 'pending',
      notes: 'Please add extra house green chile and warm corn tortillas',
      created_at: new Date().toISOString(),
      order_items: [
        {
          id: `item-${Date.now()}-1`,
          order_id: randomId,
          menu_item_id: menuItems[0]?.id || '1',
          item_name: menuItems[0]?.name || 'Crispy Chile Rellenos',
          quantity: 1,
          unit_price: menuItems[0]?.price || 15.19
        },
        {
          id: `item-${Date.now()}-2`,
          order_id: randomId,
          menu_item_id: menuItems[4]?.id || '5',
          item_name: menuItems[4]?.name || 'Street Tacos (Al Pastor)',
          quantity: 2,
          unit_price: menuItems[4]?.price || 3.75
        }
      ]
    };

    onOrdersChange([newSample, ...orders]);
    if (soundEnabled) playOrderChime();

    // If Supabase is connected, write directly to database so it broadcasts across tabs & storefront
    if (supabase && isConfigured) {
      try {
        const { error: ordErr } = await supabase.from('orders').insert([{
          id: newSample.id,
          customer_name: newSample.customer_name,
          customer_phone: newSample.customer_phone,
          order_type: newSample.order_type,
          delivery_address: newSample.delivery_address,
          delivery_fee: newSample.delivery_fee,
          total_amount: newSample.total_amount,
          status: newSample.status,
          notes: newSample.notes,
          created_at: newSample.created_at
        }]);

        if (!ordErr && newSample.order_items) {
          await supabase.from('order_items').insert(
            newSample.order_items.map(it => ({
              order_id: newSample.id,
              menu_item_id: it.menu_item_id,
              item_name: it.item_name,
              quantity: it.quantity,
              unit_price: it.unit_price
            }))
          );
        }
      } catch (err: any) {
        console.warn('Sample order database insert note:', err.message);
      }
    }
  };

  const copySqlMigration = () => {
    fetch('/supabase/schema.sql')
      .then(res => res.text())
      .then(sql => {
        navigator.clipboard.writeText(sql);
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2500);
      })
      .catch(() => {
        navigator.clipboard.writeText('-- Run /supabase/schema.sql in Supabase SQL editor');
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2500);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 flex items-center justify-center p-2 sm:p-4 md:p-6">
      
      {/* Sound / Live Order Toast */}
      <AnimatePresence>
        {orderNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-full bg-[#DDA843] text-black font-extrabold text-xs sm:text-sm shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>{orderNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-6xl h-[94vh] rounded-3xl bg-[#08080A] border border-[#22242D] shadow-2xl flex flex-col overflow-hidden text-[#F1F2F6]"
      >
        
        {/* =========================================================================
            TOP ADMIN HEADER BAR
           ========================================================================= */}
        <header className="p-4 sm:px-6 sm:py-4 bg-[#121318] border-b border-[#22242D] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white text-black font-serif italic font-black text-sm flex items-center justify-center shadow">
              Lp
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-base sm:text-lg text-white tracking-tight">
                  La Pasadita Inn
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#181A20] border border-[#22242D] text-[#DDA843] text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[#9A9EAB] hidden sm:block">
                Supabase Live Management & Kitchen Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    if (!soundEnabled) playOrderChime();
                  }}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    soundEnabled
                      ? 'bg-[#181A20] text-[#DDA843] border-[#22242D]'
                      : 'bg-[#181A20] text-[#6A6E7C] border-[#22242D]'
                  }`}
                  title={soundEnabled ? 'Order sound alert ON (click to mute)' : 'Order sound alert MUTED'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="hidden md:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
                </button>

                <button
                  onClick={() => setIsSqlModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#22242D] bg-[#181A20] hover:bg-[#22242D] text-[#DDA843] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="View / Copy Supabase SQL Migration Script"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SQL Script</span>
                </button>

                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181A20] border border-[#22242D] text-xs text-[#9A9EAB]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[140px] font-mono text-[11px]">{adminEmail}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-[#181A20] hover:bg-red-500/20 text-[#9A9EAB] hover:text-red-400 border border-[#22242D] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#181A20] hover:bg-[#22242D] text-[#9A9EAB] hover:text-white border border-[#22242D] transition-colors cursor-pointer"
              title="Close Admin Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* =========================================================================
            LOGIN VIEW (IF NOT AUTHENTICATED)
           ========================================================================= */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl bg-[#121318] border border-[#22242D] p-6 sm:p-8 shadow-2xl space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#181A20] border border-[#22242D] text-[#DDA843] mx-auto flex items-center justify-center shadow">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  Admin Sign In
                </h3>
                <p className="text-xs text-[#9A9EAB]">
                  Access live orders, update menu items, and control restaurant operations.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1.5">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@lapasadita.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-sm focus:outline-none focus:border-[#DDA843]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-sm focus:outline-none focus:border-[#DDA843] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6A6E7C] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181A20] border border-[#22242D] text-[11px] text-[#9A9EAB] space-y-1">
                  {!isConfigured ? (
                    <>
                      <div className="font-bold text-white flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[#DDA843]">
                          <Shield className="w-3.5 h-3.5" />
                          Offline Sandbox Mode
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail('admin@lapasadita.com');
                            setLoginPassword('denver1959');
                          }}
                          className="text-[10px] text-[#DDA843] hover:underline cursor-pointer"
                        >
                          Fill Demo Credentials
                        </button>
                      </div>
                      <p className="text-[10px] text-[#8E92A0]">
                        Connect Supabase in settings to enable live multi-user authenticated staff accounts.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Supabase Live Auth Active</span>
                      </div>
                      <p className="text-[10px] text-[#8E92A0]">
                        Sign in with your restaurant manager or staff credentials registered in your Supabase Auth dashboard.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-xl bg-[#DDA843] hover:bg-[#E9B958] text-black font-extrabold text-xs uppercase tracking-wider transition-colors shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Sign In to Dashboard</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        ) : (
          /* =========================================================================
              AUTHENTICATED DASHBOARD CONTENT (ORDERS / MENU / SETTINGS)
             ========================================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Navigation Tabs Bar */}
            <div className="px-4 sm:px-6 pt-3 bg-[#121318] border-b border-[#22242D] flex items-center justify-between gap-4 overflow-x-auto no-scrollbar shrink-0">
              <div className="flex items-center gap-2">
                
                {/* Tab: Orders */}
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-[#08080A] text-white border-[#DDA843]'
                      : 'text-[#9A9EAB] border-transparent hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#DDA843]" />
                  <span>Live Orders</span>
                  {orderCounts.pending > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#DDA843] text-black font-mono font-bold text-[10px]">
                      {orderCounts.pending}
                    </span>
                  )}
                </button>

                {/* Tab: 30-Day Trends & Analytics */}
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-[#08080A] text-white border-[#DDA843]'
                      : 'text-[#9A9EAB] border-transparent hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#DDA843]" />
                  <span>30-Day Trends & Analytics</span>
                </button>

                {/* Tab: Menu Management */}
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                    activeTab === 'menu'
                      ? 'bg-[#08080A] text-white border-[#DDA843]'
                      : 'text-[#9A9EAB] border-transparent hover:text-white'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-[#DDA843]" />
                  <span>Menu Editor (CRUD)</span>
                  <span className="text-[10px] text-[#6A6E7C]">({menuItems.length})</span>
                </button>

                {/* Tab: Website Settings */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#08080A] text-white border-[#DDA843]'
                      : 'text-[#9A9EAB] border-transparent hover:text-white'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-[#DDA843]" />
                  <span>Website Settings</span>
                </button>

              </div>

              {/* Status summary pill */}
              <div className="hidden md:flex items-center gap-3 text-xs text-[#9A9EAB] pb-2">
                <span>Revenue: <strong className="text-white font-mono">${orderCounts.totalRevenue.toFixed(2)}</strong></span>
                <span>·</span>
                <span>Total Orders: <strong className="text-[#DDA843] font-mono">{orderCounts.all}</strong></span>
              </div>
            </div>

            {/* TAB CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#08080A]">

              {/* =========================================================================
                  TAB 1: LIVE ORDERS MANAGEMENT
                 ========================================================================= */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  
                  {/* Orders KPI Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9EAB]">Total Orders</span>
                      <div className="font-display font-black text-2xl text-white">{orderCounts.all}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Pending</span>
                      <div className="font-display font-black text-2xl text-amber-400">{orderCounts.pending}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Preparing</span>
                      <div className="font-display font-black text-2xl text-blue-400">{orderCounts.preparing}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Ready</span>
                      <div className="font-display font-black text-2xl text-emerald-400">{orderCounts.ready}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9EAB]">Completed</span>
                      <div className="font-display font-black text-2xl text-white">{orderCounts.completed}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Cancelled</span>
                      <div className="font-display font-black text-2xl text-red-400">{orderCounts.cancelled}</div>
                    </div>
                  </div>

                  {/* Filter & Action Toolbar */}
                  <div className="p-4 rounded-2xl bg-[#121318] border border-[#22242D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    
                    {/* Status segmented filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                      {[
                        { id: 'all', label: 'All Orders' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'preparing', label: 'Preparing' },
                        { id: 'ready', label: 'Ready' },
                        { id: 'completed', label: 'Completed' },
                        { id: 'cancelled', label: 'Cancelled' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setOrderStatusFilter(f.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                            orderStatusFilter === f.id
                              ? 'bg-white text-black shadow'
                              : 'bg-[#181A20] text-[#9A9EAB] hover:text-white border border-[#22242D]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Search & Sample test order button */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 md:w-60">
                        <Search className="w-3.5 h-3.5 text-[#6A6E7C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          placeholder="Search customer, phone, ID..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                        />
                      </div>

                      <button
                        onClick={handleAddSampleOrder}
                        className="px-3 py-1.5 rounded-xl bg-[#181A20] hover:bg-[#22242D] border border-[#22242D] text-[#DDA843] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                        title="Simulate incoming order for testing"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simulate Order</span>
                      </button>
                    </div>

                  </div>

                  {/* Orders Cards Grid */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 rounded-2xl bg-[#121318] border border-[#22242D] space-y-2">
                      <ShoppingBag className="w-10 h-10 text-[#3A3D4A] mx-auto mb-1" />
                      <h4 className="font-bold text-white text-sm">No orders matching filter</h4>
                      <p className="text-xs text-[#9A9EAB]">Orders placed via the online cart will automatically appear here with a chime sound.</p>
                      <button
                        onClick={handleAddSampleOrder}
                        className="mt-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-[#DDA843] transition-colors cursor-pointer"
                      >
                        Generate Sample Test Order
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredOrders.map((ord) => {
                        const isPending = ord.status === 'pending';
                        const isPreparing = ord.status === 'preparing';
                        const isReady = ord.status === 'ready';
                        const isCompleted = ord.status === 'completed';
                        const isCancelled = ord.status === 'cancelled';

                        return (
                          <div
                            key={ord.id}
                            className={`rounded-2xl bg-[#121318] border p-4 space-y-3 shadow-lg transition-all ${
                              isPending
                                ? 'border-[#DDA843]/60 ring-1 ring-[#DDA843]/30'
                                : isPreparing
                                ? 'border-blue-500/40'
                                : isReady
                                ? 'border-emerald-500/40'
                                : 'border-[#22242D]'
                            }`}
                          >
                            {/* Order Header */}
                            <div className="flex items-start justify-between gap-2 border-b border-[#22242D] pb-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-extrabold text-white">
                                    #{ord.id.slice(0, 8)}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.order_type === 'Delivery'
                                      ? 'bg-amber-950/70 border border-[#DDA843]/40 text-[#DDA843]'
                                      : 'bg-[#181A20] border border-[#22242D] text-[#9A9EAB]'
                                  }`}>
                                    {ord.order_type}
                                  </span>
                                </div>
                                <div className="font-bold text-white text-sm mt-1">{ord.customer_name}</div>
                                {ord.delivery_address && (
                                  <div className="text-[11px] text-amber-200/90 flex items-start gap-1 mt-0.5 font-medium">
                                    <MapPin className="w-3 h-3 text-[#DDA843] shrink-0 mt-0.5" />
                                    <span>{ord.delivery_address}</span>
                                  </div>
                                )}
                                <a
                                  href={`tel:${ord.customer_phone}`}
                                  className="text-xs text-[#DDA843] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{ord.customer_phone}</span>
                                </a>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider block ${
                                    isPending
                                      ? 'bg-[#DDA843] text-black animate-pulse'
                                      : isPreparing
                                      ? 'bg-blue-400 text-black'
                                      : isReady
                                      ? 'bg-emerald-400 text-black'
                                      : isCompleted
                                      ? 'bg-[#181A20] text-[#9A9EAB] border border-[#22242D]'
                                      : 'bg-red-900/60 text-red-300'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                                <span className="text-[10px] text-[#6A6E7C] block mt-1">
                                  {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-1.5 text-xs">
                              {ord.order_items && ord.order_items.length > 0 ? (
                                ord.order_items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-[#F1F2F6]">
                                    <span>
                                      <strong className="text-[#DDA843] font-mono mr-1.5">{item.quantity}x</strong>
                                      {item.item_name}
                                    </span>
                                    <span className="font-mono text-[#9A9EAB]">
                                      ${Number(item.unit_price).toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-[11px] text-[#9A9EAB] italic">Itemized ticket recorded</div>
                              )}
                            </div>

                            {/* Kitchen Notes */}
                            {ord.notes && (
                              <div className="p-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-[11px] text-amber-200/90 space-y-0.5">
                                <span className="font-bold uppercase tracking-wider text-[9px] text-[#DDA843] block">Customer Note</span>
                                <p>{ord.notes}</p>
                              </div>
                            )}

                            {/* Total Due & Status Progression Actions */}
                            <div className="pt-2 border-t border-[#22242D] flex items-center justify-between">
                              <span className="font-mono font-bold text-sm text-white">
                                Total: <strong className="text-[#DDA843]">${Number(ord.total_amount).toFixed(2)}</strong>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {isPending && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'preparing')}
                                    className="px-3 py-1 rounded-lg bg-blue-500 hover:bg-blue-400 text-black text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Cook
                                  </button>
                                )}
                                {isPreparing && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'ready')}
                                    className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Ready
                                  </button>
                                )}
                                {isReady && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'completed')}
                                    className="px-3 py-1 rounded-lg bg-white text-black hover:bg-[#DDA843] text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Done
                                  </button>
                                )}
                                {!isCancelled && !isCompleted && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord.id, 'cancelled')}
                                    className="px-2 py-1 rounded-lg bg-[#181A20] hover:bg-red-500/20 text-red-400 border border-[#22242D] text-[11px] transition-colors cursor-pointer"
                                    title="Cancel Order"
                                  >
                                    ✕
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
              )}

              {/* =========================================================================
                  TAB: 30-DAY TRENDS & REVENUE ANALYTICS (RECHARTS)
                 ========================================================================= */}
              {activeTab === 'analytics' && (
                <AdminAnalytics
                  orders={orders}
                  menuItems={menuItems}
                  primaryAccentColor={localSettings.primary_accent_color}
                  onOrdersChange={onOrdersChange}
                />
              )}

              {/* =========================================================================
                  TAB 2: MENU EDITOR (CRUD)
                 ========================================================================= */}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  
                  {/* Menu Toolbar */}
                  <div className="p-4 rounded-2xl bg-[#121318] border border-[#22242D] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    
                    {/* Category tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                      {[
                        { id: 'all', label: 'All Dishes' },
                        { id: 'specials', label: 'Specials' },
                        { id: 'tacos', label: 'Tacos / Tortas' },
                        { id: 'soups', label: 'Soups' },
                        { id: 'drinks', label: 'Drinks & Desserts' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setMenuCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                            menuCategoryFilter === cat.id
                              ? 'bg-white text-black shadow'
                              : 'bg-[#181A20] text-[#9A9EAB] hover:text-white border border-[#22242D]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Search & Add New Item Button */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 md:w-56">
                        <Search className="w-3.5 h-3.5 text-[#6A6E7C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={menuSearchQuery}
                          onChange={(e) => setMenuSearchQuery(e.target.value)}
                          placeholder="Search dish name, note..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                        />
                      </div>

                      <button
                        onClick={openAddModal}
                        className="px-4 py-1.5 rounded-xl bg-[#DDA843] hover:bg-[#E9B958] text-black text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Item</span>
                      </button>
                    </div>

                  </div>

                  {/* Menu Table / Cards List */}
                  <div className="space-y-3">
                    {filteredMenuItems.map((dish) => (
                      <div
                        key={dish.id}
                        className={`p-4 rounded-2xl bg-[#121318] border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow ${
                          dish.is_available ? 'border-[#22242D]' : 'border-red-500/20 opacity-70'
                        }`}
                      >
                        {/* Thumbnail & Dish Details */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <img
                            src={dish.image_url}
                            alt={dish.name}
                            className="w-16 h-16 rounded-xl object-cover border border-[#22242D] shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-display font-extrabold text-sm sm:text-base text-white truncate">
                                {dish.name}
                              </h4>
                              {dish.badge && (
                                <span className="px-2 py-0.5 rounded-full bg-[#181A20] border border-[#22242D] text-[10px] font-bold text-[#DDA843]">
                                  {dish.badge}
                                </span>
                              )}
                              <span className="text-[10px] text-[#6A6E7C]">
                                {dish.categories?.name || 'Main'}
                              </span>
                            </div>

                            {dish.spanish_name && (
                              <p className="text-[11px] text-[#9A9EAB] italic">{dish.spanish_name}</p>
                            )}
                            <p className="text-xs text-[#9A9EAB] line-clamp-1 mt-0.5">{dish.description}</p>
                          </div>
                        </div>

                        {/* Price & In-Stock Switch & CRUD Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#22242D]">
                          <div className="font-mono font-black text-sm text-[#DDA843]">
                            ${Number(dish.price).toFixed(2)}
                          </div>

                          {/* In-Stock / Out of stock toggle */}
                          <button
                            onClick={() => handleToggleAvailability(dish)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                              dish.is_available
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-950/60 text-red-400 border border-red-500/30'
                            }`}
                            title="Click to toggle availability on live customer site"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${dish.is_available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span>{dish.is_available ? 'In Stock' : 'Out of Stock'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(dish)}
                            className="p-2 rounded-xl bg-[#181A20] hover:bg-[#22242D] text-[#9A9EAB] hover:text-white border border-[#22242D] transition-colors cursor-pointer"
                            title="Edit dish details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setItemToDelete(dish)}
                            className="p-2 rounded-xl bg-[#181A20] hover:bg-red-500/20 text-[#9A9EAB] hover:text-red-400 border border-[#22242D] transition-colors cursor-pointer"
                            title="Delete dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* =========================================================================
                  TAB 3: LIVE STOREFRONT CUSTOMIZER (SUPABASE site_settings TABLE)
                 ========================================================================= */}
              {activeTab === 'settings' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  
                  {settingsSavedToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold">Storefront Settings Broadcast Live!</p>
                        <p className="text-[11px] text-emerald-300/80 font-normal">
                          Saved to Supabase <code className="font-mono text-emerald-200">site_settings</code> table and synchronized across all active customer browsers in real-time.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    
                    {/* 1. BRAND COLORS & THEME CUSTOMIZER */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-5">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-[#22242D]">
                        <Palette className="w-5 h-5 text-[#DDA843]" />
                        <div>
                          <h3 className="font-display font-extrabold text-base text-white">
                            Storefront Color Palette & Dark Theme
                          </h3>
                          <p className="text-xs text-[#9A9EAB]">
                            Live customizer: primary accent color & background theme broadcast instantly to customer storefront.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Primary Accent Color */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                              <span>Primary Accent Color</span>
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                                style={{ backgroundColor: localSettings.primary_accent_color }}
                              />
                            </label>
                            <span className="text-[11px] font-mono text-[#DDA843] font-bold">
                              {localSettings.primary_accent_color}
                            </span>
                          </div>

                          {/* Preset Accent Swatches */}
                          <div className="grid grid-cols-7 gap-1.5">
                            {[
                              { label: 'Gold', color: '#DDA843' },
                              { label: 'Amber', color: '#D97706' },
                              { label: 'Copper', color: '#D97736' },
                              { label: 'Terracotta', color: '#C0392B' },
                              { label: 'Emerald', color: '#10B981' },
                              { label: 'Turquoise', color: '#06B6D4' },
                              { label: 'Violet', color: '#8B5CF6' }
                            ].map((preset) => (
                              <button
                                key={preset.color}
                                type="button"
                                onClick={() => setLocalSettings(prev => ({ ...prev, primary_accent_color: preset.color }))}
                                className={`h-8 rounded-xl transition-transform cursor-pointer relative flex items-center justify-center border ${
                                  localSettings.primary_accent_color.toLowerCase() === preset.color.toLowerCase()
                                    ? 'scale-110 border-white ring-2 ring-white/40 z-10 shadow-lg'
                                    : 'border-white/10 hover:scale-105'
                                }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.label}
                              >
                                {localSettings.primary_accent_color.toLowerCase() === preset.color.toLowerCase() && (
                                  <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Custom Hex Picker Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={localSettings.primary_accent_color}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, primary_accent_color: e.target.value }))}
                                placeholder="#DDA843"
                                className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white font-mono text-xs focus:outline-none focus:border-[#DDA843]"
                              />
                            </div>
                            <input
                              type="color"
                              value={localSettings.primary_accent_color.startsWith('#') && localSettings.primary_accent_color.length === 7 ? localSettings.primary_accent_color : '#DDA843'}
                              onChange={(e) => setLocalSettings(prev => ({ ...prev, primary_accent_color: e.target.value }))}
                              className="w-10 h-8 rounded-xl bg-[#181A20] border border-[#22242D] cursor-pointer p-0.5"
                              title="Pick native color"
                            />
                          </div>
                        </div>

                        {/* Dark Theme Background */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                              <span>Dark Theme Background</span>
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 inline-block shadow-sm"
                                style={{ backgroundColor: localSettings.dark_theme_background }}
                              />
                            </label>
                            <span className="text-[11px] font-mono text-[#9A9EAB] font-bold">
                              {localSettings.dark_theme_background}
                            </span>
                          </div>

                          {/* Preset Background Swatches */}
                          <div className="grid grid-cols-5 gap-1.5">
                            {[
                              { label: 'Obsidian', color: '#08080A' },
                              { label: 'Slate', color: '#0B0F19' },
                              { label: 'Charcoal', color: '#121316' },
                              { label: 'Espresso', color: '#140E0C' },
                              { label: 'Onyx', color: '#000000' }
                            ].map((preset) => (
                              <button
                                key={preset.color}
                                type="button"
                                onClick={() => setLocalSettings(prev => ({ ...prev, dark_theme_background: preset.color }))}
                                className={`h-8 rounded-xl transition-transform cursor-pointer relative flex items-center justify-center border ${
                                  localSettings.dark_theme_background.toLowerCase() === preset.color.toLowerCase()
                                    ? 'scale-110 border-[#DDA843] ring-2 ring-[#DDA843]/40 z-10 shadow-lg'
                                    : 'border-white/10 hover:scale-105'
                                }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.label}
                              >
                                {localSettings.dark_theme_background.toLowerCase() === preset.color.toLowerCase() && (
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Custom Hex Background Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={localSettings.dark_theme_background}
                                onChange={(e) => setLocalSettings(prev => ({ ...prev, dark_theme_background: e.target.value }))}
                                placeholder="#08080A"
                                className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white font-mono text-xs focus:outline-none focus:border-[#DDA843]"
                              />
                            </div>
                            <input
                              type="color"
                              value={localSettings.dark_theme_background.startsWith('#') && localSettings.dark_theme_background.length === 7 ? localSettings.dark_theme_background : '#08080A'}
                              onChange={(e) => setLocalSettings(prev => ({ ...prev, dark_theme_background: e.target.value }))}
                              className="w-10 h-8 rounded-xl bg-[#181A20] border border-[#22242D] cursor-pointer p-0.5"
                              title="Pick native background color"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. HERO HEADLINE & SUBTEXT CUSTOMIZER */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-[#22242D]">
                        <Type className="w-5 h-5 text-[#DDA843]" />
                        <div>
                          <h3 className="font-display font-extrabold text-base text-white">
                            Storefront Hero Typography & Taglines
                          </h3>
                          <p className="text-xs text-[#9A9EAB]">
                            Configures the giant luxury typography and subtitle on the landing page hero.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                            Hero Title Headline (Main Brand Name) *
                          </label>
                          <input
                            type="text"
                            required
                            value={localSettings.hero_title}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                            placeholder="e.g. LA PASADITA INN"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                            Hero Subtext / Historic Tagline *
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={localSettings.hero_subtext}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, hero_subtext: e.target.value }))}
                            placeholder="e.g. Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. OPERATIONAL ANNOUNCEMENT BANNER */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#22242D]">
                        <div className="flex items-center gap-2.5">
                          <Megaphone className="w-5 h-5 text-[#DDA843]" />
                          <div>
                            <h3 className="font-display font-extrabold text-base text-white">
                              Live Operational Announcement Banner
                            </h3>
                            <p className="text-xs text-[#9A9EAB]">
                              Display special announcements, Denver events, or daily kitchen specials.
                            </p>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <button
                          type="button"
                          onClick={() => setLocalSettings(prev => ({ ...prev, announcement_enabled: !prev.announcement_enabled }))}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            localSettings.announcement_enabled
                              ? 'text-black shadow'
                              : 'bg-[#181A20] text-[#6A6E7C] border border-[#22242D]'
                          }`}
                          style={localSettings.announcement_enabled ? { backgroundColor: localSettings.primary_accent_color } : {}}
                        >
                          {localSettings.announcement_enabled ? 'Active / Visible' : 'Disabled'}
                        </button>
                      </div>

                      {localSettings.announcement_enabled && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                            Announcement Text
                          </label>
                          <textarea
                            rows={2}
                            value={localSettings.announcement_banner_text}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, announcement_banner_text: e.target.value }))}
                            placeholder="e.g. 🔥 Fresh Hatch Green Chile Rellenos simmering today! Walk-ins & Takeout open."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>
                      )}
                    </div>

                    {/* 4. RESTAURANT OPEN / CLOSED OPERATIONAL STATUS */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-[#22242D]">
                        <Store className="w-5 h-5 text-[#DDA843]" />
                        <div>
                          <h3 className="font-display font-extrabold text-base text-white">
                            Store Operational Status & Pickup Hours
                          </h3>
                          <p className="text-xs text-[#9A9EAB]">
                            Control live open/closed indicators and customer order acceptance.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'auto', label: 'Automatic (Denver MT)' },
                          { id: 'open', label: 'Force Open Now' },
                          { id: 'closed', label: 'Force Closed (Holiday)' }
                        ].map(mode => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setLocalSettings(prev => ({ ...prev, open_closed_status: mode.id as any }))}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              localSettings.open_closed_status === mode.id
                                ? 'bg-white text-black shadow'
                                : 'bg-[#181A20] text-[#9A9EAB] border border-[#22242D]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {localSettings.open_closed_status === 'closed' && (
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                            Custom Closed Notice
                          </label>
                          <input
                            type="text"
                            value={localSettings.custom_closed_message}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, custom_closed_message: e.target.value }))}
                            placeholder="e.g. Closed for holiday celebration · Reopening Monday 11 AM"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                          Estimated Pickup Preparation Time
                        </label>
                        <input
                          type="text"
                          value={localSettings.estimated_pickup_minutes}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, estimated_pickup_minutes: e.target.value }))}
                          placeholder="e.g. 15 – 20 Minutes"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                        />
                      </div>
                    </div>

                    {/* 5. INTERACTIVE LIVE STOREFRONT PREVIEW CARD */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-[#0F1014] border border-[#22242D] space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#9A9EAB]">
                        <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#DDA843]" />
                          Real-time Storefront Preview (What Customers See)
                        </span>
                        <span className="text-[10px] bg-[#181A20] px-2 py-0.5 rounded text-[#DDA843] font-mono">
                          Live UI Preview
                        </span>
                      </div>

                      <div
                        className="p-5 rounded-2xl border border-white/10 transition-colors shadow-inner space-y-3 overflow-hidden relative"
                        style={{ backgroundColor: localSettings.dark_theme_background }}
                      >
                        {/* Simulated Announcement */}
                        {localSettings.announcement_enabled && localSettings.announcement_banner_text && (
                          <div
                            className="p-2 rounded-xl text-center text-[11px] font-semibold flex items-center justify-center gap-2 border bg-black/40"
                            style={{
                              borderColor: `${localSettings.primary_accent_color}50`,
                              color: localSettings.primary_accent_color
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full animate-pulse"
                              style={{ backgroundColor: localSettings.primary_accent_color }}
                            />
                            <span className="truncate">{localSettings.announcement_banner_text}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <div className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-display">
                              {localSettings.hero_title}
                            </div>
                            <p className="text-[11px] text-[#9A9EAB] max-w-md line-clamp-1">
                              {localSettings.hero_subtext}
                            </p>
                          </div>

                          <div
                            className="px-3 py-1.5 rounded-full text-xs font-bold text-black uppercase tracking-wider shadow"
                            style={{ backgroundColor: localSettings.primary_accent_color }}
                          >
                            Call Order
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1 text-[11px]">
                          <span
                            className="px-2.5 py-1 rounded-full border text-white font-medium bg-[#121318]"
                            style={{ borderColor: `${localSettings.primary_accent_color}40` }}
                          >
                            ⭐ 4.7 ★ Denver Landmark
                          </span>
                          <span className="px-2.5 py-1 rounded-full border border-white/10 text-white font-medium bg-[#121318] flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: localSettings.open_closed_status === 'closed' ? '#EF4444' : localSettings.primary_accent_color
                              }}
                            />
                            <span>
                              {localSettings.open_closed_status === 'open'
                                ? 'Open Now'
                                : localSettings.open_closed_status === 'closed'
                                ? localSettings.custom_closed_message || 'Closed'
                                : 'Opens 11 AM'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="w-full py-4 rounded-2xl text-black font-extrabold text-xs uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      style={{ backgroundColor: localSettings.primary_accent_color }}
                    >
                      {isSavingSettings ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin stroke-[3]" />
                          <span>Syncing with Supabase Realtime...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Save & Apply Settings Live to Storefront</span>
                        </>
                      )}
                    </button>

                  </form>
                </div>
              )}

            </div>

          </div>
        )}

      </motion.div>

      {/* =========================================================================
          ADD / EDIT MENU ITEM MODAL
         ========================================================================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl max-h-[90vh] rounded-3xl bg-[#121318] border border-[#22242D] p-5 sm:p-6 shadow-2xl z-10 flex flex-col overflow-hidden space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D] shrink-0">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-[#DDA843]" />
                  <h3 className="font-display font-extrabold text-lg text-white">
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-[#9A9EAB] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveMenuItem} className="flex-1 overflow-y-auto space-y-4 pr-1">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Dish Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Crispy Chile Relleno"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Spanish Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formSpanishName}
                      onChange={(e) => setFormSpanishName(e.target.value)}
                      placeholder="e.g. Relleno Crujiente"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        setFormCategoryId(e.target.value);
                        const selectedOption = e.target.options[e.target.selectedIndex].text;
                        setFormCategoryName(selectedOption);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    >
                      <option value="cat-specials">Signature Specials</option>
                      <option value="cat-tacos">Tacos & Tortas</option>
                      <option value="cat-soups">Caldos & Soups</option>
                      <option value="cat-drinks">Drinks & Desserts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Price ($ USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="15.19"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs font-mono focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Badge Label
                    </label>
                    <select
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    >
                      <option value="">None</option>
                      <option value="Grandma's Favorite">Grandma's Favorite</option>
                      <option value="Signature Dish">Signature Dish</option>
                      <option value="Popular">Popular</option>
                      <option value="House Special">House Special</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                    Dish Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Fresh roasted poblano stuffed with Monterey Jack cheese..."
                    className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Spice Level
                    </label>
                    <select
                      value={formSpiceLevel}
                      onChange={(e) => setFormSpiceLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    >
                      <option value="Mild">Mild</option>
                      <option value="Medium">Medium</option>
                      <option value="Fiery">Fiery</option>
                      <option value="Refreshing">Refreshing (Drinks)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB] mb-1">
                      Grandma's Note
                    </label>
                    <input
                      type="text"
                      value={formGrandmaNote}
                      onChange={(e) => setFormGrandmaNote(e.target.value)}
                      placeholder="e.g. Denver-style crispy fried on the comal"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>
                </div>

                {/* Image Upload from Phone Gallery or PC Files */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9A9EAB]">
                      Dish Photo (Phone Gallery or PC Upload) *
                    </label>
                    {uploadedFileName && (
                      <span className="text-[10px] text-emerald-400 font-mono truncate max-w-[200px]">
                        ✓ {uploadedFileName}
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input for Phone Gallery / Camera / PC */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFileSelect(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Upload Error Notice */}
                  {uploadError && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Upload Dropzone & Live Preview Container */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFileSelect(file);
                    }}
                    className={`relative rounded-2xl border-2 border-dashed p-4 transition-all text-center ${
                      isDragOver
                        ? 'border-[#DDA843] bg-[#DDA843]/10'
                        : 'border-[#22242D] bg-[#181A20] hover:border-[#3A3D4D]'
                    }`}
                  >
                    {isUploadingImage ? (
                      <div className="py-6 flex flex-col items-center justify-center space-y-2">
                        <RefreshCw className="w-8 h-8 text-[#DDA843] animate-spin" />
                        <div className="text-xs font-bold text-white">Compressing & Preparing Photo...</div>
                        <p className="text-[11px] text-[#8E92A0]">Optimizing image dimensions for mobile and web delivery</p>
                      </div>
                    ) : formImageUrl ? (
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                        {/* Live Image Preview Thumbnail */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-black/60 border border-[#22242D] shrink-0 group">
                          <img
                            src={formImageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold bg-black/70 px-2 py-0.5 rounded">
                              Current Photo
                            </span>
                          </div>
                        </div>

                        {/* Image Metadata & Quick Action */}
                        <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                              ✓ Image Loaded
                            </span>
                            {uploadedFileName && (
                              <span className="text-[11px] text-[#8E92A0] font-mono truncate">
                                {uploadedFileName}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#9A9EAB] truncate">
                            {formImageUrl.startsWith('data:') ? 'Custom photo from device storage' : formImageUrl}
                          </p>

                          <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg bg-[#22242D] hover:bg-[#2C303B] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-[#DDA843]" />
                              <span>Upload Different Photo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormImageUrl('');
                                setUploadedFileName(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Empty State: Call to upload */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="py-5 cursor-pointer flex flex-col items-center justify-center space-y-2 group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#121318] border border-[#22242D] text-[#DDA843] flex items-center justify-center transition-transform group-hover:scale-105 shadow">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-[#DDA843] transition-colors">
                            Click to Upload Photo from Phone Gallery or PC
                          </div>
                          <p className="text-[11px] text-[#8E92A0] mt-0.5">
                            Supports JPG, PNG, WebP or Camera Capture from smartphone
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Secondary Preset Carousel & Manual URL option */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] text-[#8E92A0] mb-1.5">
                      <span>Or choose from kitchen photo presets:</span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                      {PRESET_IMAGE_OPTIONS.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setFormImageUrl(opt.url);
                            setUploadedFileName(null);
                          }}
                          className={`rounded-xl overflow-hidden border p-0.5 cursor-pointer transition-all ${
                            formImageUrl === opt.url
                              ? 'border-[#DDA843] ring-2 ring-[#DDA843]/40'
                              : 'border-[#22242D] opacity-60 hover:opacity-100'
                          }`}
                          title={opt.label}
                        >
                          <img src={opt.url} alt={opt.label} className="w-full h-12 object-cover rounded-lg" />
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => {
                        setFormImageUrl(e.target.value);
                        setUploadedFileName(null);
                      }}
                      placeholder="Or enter direct image URL (https://...)"
                      className="w-full px-3 py-2 rounded-xl bg-[#181A20] border border-[#22242D] text-white text-xs font-mono focus:outline-none focus:border-[#DDA843]"
                    />
                  </div>
                </div>

                {/* Availability Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="formIsAvailable"
                    checked={formIsAvailable}
                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                    className="rounded bg-[#181A20] border-[#22242D] text-[#DDA843] focus:ring-0"
                  />
                  <label htmlFor="formIsAvailable" className="text-xs text-white font-bold cursor-pointer">
                    In Stock (Item visible and orderable on customer menu)
                  </label>
                </div>

                <div className="pt-3 border-t border-[#22242D] flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs text-[#9A9EAB] hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="px-5 py-2 rounded-xl bg-white text-black hover:bg-[#DDA843] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow disabled:opacity-50"
                  >
                    {isSavingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          DELETE ITEM CONFIRMATION MODAL
         ========================================================================= */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#121318] border border-[#22242D] p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-950/60 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="font-display font-extrabold text-lg text-white">Delete Dish?</h4>
                <p className="text-xs text-[#9A9EAB] mt-1">
                  Are you sure you want to remove <strong className="text-white">"{itemToDelete.name}"</strong>? This will permanently delete it from the live menu.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#181A20] text-[#9A9EAB] hover:text-white border border-[#22242D] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer shadow"
                >
                  Delete Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          SQL MIGRATION & SETUP SCRIPT MODAL
         ========================================================================= */}
      <AnimatePresence>
        {isSqlModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSqlModalOpen(false)}
              className="absolute inset-0 bg-black/85 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[88vh] rounded-3xl bg-[#121318] border border-[#22242D] p-5 sm:p-6 shadow-2xl z-10 flex flex-col space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#22242D] shrink-0">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#DDA843]" />
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white">
                      Supabase SQL Schema & Realtime Migration
                    </h3>
                    <p className="text-[11px] text-[#9A9EAB]">
                      Copy and run this migration in your Supabase SQL Editor.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="p-1 rounded-lg text-[#9A9EAB] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181A20] border border-[#22242D] flex items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-[#9A9EAB]">
                  Creates tables: <code className="text-[#DDA843]">site_settings</code>, <code className="text-[#DDA843]">menu_items</code>, <code className="text-[#DDA843]">orders</code>, <code className="text-[#DDA843]">order_items</code>, RLS policies, and realtime broadcast publications.
                </div>
                <button
                  type="button"
                  onClick={copySqlMigration}
                  className="px-4 py-2 rounded-xl bg-[#DDA843] hover:bg-[#E9B958] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl bg-[#090A0D] border border-[#22242D] p-4 text-[11px] font-mono text-emerald-300 leading-relaxed select-all">
                <pre className="whitespace-pre-wrap">
{`-- Execute in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Site Settings (Live Storefront Customizer)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    primary_accent_color TEXT NOT NULL DEFAULT '#DDA843',
    dark_theme_background TEXT NOT NULL DEFAULT '#08080A',
    hero_title TEXT NOT NULL DEFAULT 'LA PASADITA INN',
    hero_subtext TEXT NOT NULL DEFAULT 'Denver Historic Triangular Landmark • Grandma-Led Authentic Mexican Cooking',
    announcement_banner_text TEXT NOT NULL DEFAULT '🔥 Denver Historic Landmark · Scratch Grandma-Led Mexican Cooking · Walk-Ins & Phone Orders Welcome!',
    announcement_enabled BOOLEAN NOT NULL DEFAULT true,
    open_closed_status TEXT NOT NULL DEFAULT 'auto',
    custom_closed_message TEXT DEFAULT 'Closed for private family preparation · Opens at 11:00 AM',
    estimated_pickup_minutes TEXT DEFAULT '15 – 20',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Menu Items & Orders
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    spanish_name TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    badge TEXT,
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    spice_level TEXT,
    grandma_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    order_type TEXT NOT NULL DEFAULT 'Takeout',
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    selected_option TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Realtime
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public upsert site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Admin write menu_items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Orders read/write" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Order_items read/write" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;`}
                </pre>
              </div>

              <div className="pt-2 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181A20] hover:bg-[#22242D] text-[#9A9EAB] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
