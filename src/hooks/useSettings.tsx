import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  logo_url: string;
  primary_color: string;
  accent_color: string;
  sidebar_color: string;
  system_name: string;
}

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  logo_url: '',
  primary_color: '215 70% 28%',
  accent_color: '160 60% 38%',
  sidebar_color: '215 70% 22%',
  system_name: 'InventoryPro',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('system_settings').select('key, value');
    if (data) {
      const mapped = { ...defaultSettings };
      data.forEach((row: { key: string; value: string }) => {
        if (row.key in mapped) {
          (mapped as any)[row.key] = row.value;
        }
      });
      setSettings(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply CSS variables whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.primary_color);
    root.style.setProperty('--ring', settings.primary_color);
    root.style.setProperty('--sidebar-background', settings.sidebar_color);
    root.style.setProperty('--accent', settings.accent_color);
    root.style.setProperty('--sidebar-primary', settings.accent_color);
    root.style.setProperty('--sidebar-ring', settings.accent_color);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
