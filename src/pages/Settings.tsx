import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Palette, Lock, Type } from 'lucide-react';

const Settings = () => {
  const { settings, refreshSettings } = useSettings();
  const { toast } = useToast();

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Colors state
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [accentColor, setAccentColor] = useState(settings.accent_color);
  const [sidebarColor, setSidebarColor] = useState(settings.sidebar_color);
  const [savingColors, setSavingColors] = useState(false);

  // Name state
  const [systemName, setSystemName] = useState(settings.system_name);
  const [savingName, setSavingName] = useState(false);

  // Logo state
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Senha alterada com sucesso!' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPassword(false);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);

    const ext = file.name.split('.').pop();
    const filePath = `logo.${ext}`;

    // Remove old logo
    await supabase.storage.from('logos').remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erro ao fazer upload', description: uploadError.message, variant: 'destructive' });
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);

    await supabase
      .from('system_settings')
      .update({ value: urlData.publicUrl })
      .eq('key', 'logo_url');

    await refreshSettings();
    toast({ title: 'Logo atualizada com sucesso!' });
    setUploadingLogo(false);
  };

  const handleRemoveLogo = async () => {
    await supabase.from('system_settings').update({ value: '' }).eq('key', 'logo_url');
    await refreshSettings();
    toast({ title: 'Logo removida.' });
  };

  const handleSaveColors = async () => {
    setSavingColors(true);
    await Promise.all([
      supabase.from('system_settings').update({ value: primaryColor }).eq('key', 'primary_color'),
      supabase.from('system_settings').update({ value: accentColor }).eq('key', 'accent_color'),
      supabase.from('system_settings').update({ value: sidebarColor }).eq('key', 'sidebar_color'),
    ]);
    await refreshSettings();
    toast({ title: 'Cores atualizadas com sucesso!' });
    setSavingColors(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    await supabase.from('system_settings').update({ value: systemName }).eq('key', 'system_name');
    await refreshSettings();
    toast({ title: 'Nome do sistema atualizado!' });
    setSavingName(false);
  };

  const colorPresets = [
    { label: 'Navy (Padrão)', primary: '215 70% 28%', accent: '160 60% 38%', sidebar: '215 70% 22%' },
    { label: 'Azul Royal', primary: '220 80% 45%', accent: '45 90% 50%', sidebar: '220 75% 25%' },
    { label: 'Verde Floresta', primary: '150 60% 30%', accent: '30 80% 50%', sidebar: '150 55% 20%' },
    { label: 'Roxo Profundo', primary: '270 60% 35%', accent: '320 70% 50%', sidebar: '270 55% 22%' },
    { label: 'Vermelho Corporativo', primary: '0 65% 40%', accent: '210 70% 50%', sidebar: '0 60% 25%' },
    { label: 'Cinza Moderno', primary: '220 15% 35%', accent: '200 70% 50%', sidebar: '220 15% 18%' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Personalize o sistema</p>
      </div>

      {/* System Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Type className="w-5 h-5" /> Nome do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder="Nome do sistema" />
            <Button onClick={handleSaveName} disabled={savingName}>
              {savingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Logo</CardTitle>
          <CardDescription>Faça upload da logo da sua empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.logo_url && (
            <div className="flex items-center gap-4">
              <img src={settings.logo_url} alt="Logo" className="h-16 w-auto object-contain rounded-lg border bg-card p-2" />
              <Button variant="outline" size="sm" onClick={handleRemoveLogo}>Remover</Button>
            </div>
          )}
          <div>
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadingLogo ? 'Enviando...' : 'Clique para fazer upload (PNG, JPG, SVG)'}
                </p>
              </div>
            </Label>
            <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={uploadingLogo} />
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Cores do Sistema</CardTitle>
          <CardDescription>Escolha um tema ou personalize as cores (formato HSL: "H S% L%")</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => { setPrimaryColor(preset.primary); setAccentColor(preset.accent); setSidebarColor(preset.sidebar); }}
                className="border rounded-lg p-3 text-left hover:border-primary/50 transition-colors text-sm"
              >
                <div className="flex gap-1 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${preset.primary})` }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${preset.accent})` }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${preset.sidebar})` }} />
                </div>
                <span className="text-foreground font-medium">{preset.label}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label>Cor Primária</Label>
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: `hsl(${primaryColor})` }} />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="215 70% 28%" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cor de Destaque</Label>
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: `hsl(${accentColor})` }} />
                <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="160 60% 38%" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Cor da Sidebar</Label>
              <div className="flex gap-2 items-center">
                <div className="w-8 h-8 rounded border" style={{ backgroundColor: `hsl(${sidebarColor})` }} />
                <Input value={sidebarColor} onChange={(e) => setSidebarColor(e.target.value)} placeholder="215 70% 22%" />
              </div>
            </div>
          </div>
          <Button onClick={handleSaveColors} disabled={savingColors}>
            {savingColors && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Cores
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Alterar Senha</CardTitle>
          <CardDescription>Altere sua senha de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" minLength={6} required />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
