import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showDefaultCreds, setShowDefaultCreds] = useState(false);
  const { signIn } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin needs to be seeded
    const checkAndSeedAdmin = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (!profiles || profiles.length === 0) {
        setSeeding(true);
        try {
          await supabase.functions.invoke('seed-admin');
          setShowDefaultCreds(true);
        } catch (err) {
          console.error('Seed admin error:', err);
        }
        setSeeding(false);
      }
    };
    checkAndSeedAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Package className="w-7 h-7 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{settings.system_name}</h1>
            <p className="text-sm text-muted-foreground">Sistema de Inventário</p>
          </div>
        </div>

        {showDefaultCreds && (
          <Card className="mb-4 border-info/30 bg-info/5">
            <CardContent className="pt-4">
              <div className="flex gap-2 items-start">
                <Info className="w-5 h-5 text-info mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Primeiro acesso</p>
                  <p className="text-muted-foreground">
                    Use as credenciais padrão:<br />
                    <strong>Email:</strong> admin@admin.com<br />
                    <strong>Senha:</strong> admin1<br />
                    <span className="text-xs">Recomendamos alterar a senha em Configurações após o login.</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {seeding && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Configurando acesso inicial...
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Entre com suas credenciais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || seeding}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
