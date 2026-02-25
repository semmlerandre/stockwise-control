import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = [
  'hsl(215, 70%, 28%)',
  'hsl(160, 60%, 38%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(270, 50%, 50%)',
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCollaborators: 0,
    lowStock: 0,
    movements: 0,
  });
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itemsRes, collabRes, movementsRes] = await Promise.all([
      supabase.from('inventory_items').select('*'),
      supabase.from('collaborators').select('id'),
      supabase.from('stock_movements').select('id'),
    ]);

    const items = itemsRes.data || [];
    const lowStock = items.filter((i) => i.quantity <= i.minimum_stock).length;

    setStats({
      totalItems: items.length,
      totalCollaborators: collabRes.data?.length || 0,
      lowStock,
      movements: movementsRes.data?.length || 0,
    });

    // Category data
    const cats: Record<string, number> = {};
    items.forEach((i) => {
      const cat = i.category || 'Sem categoria';
      cats[cat] = (cats[cat] || 0) + 1;
    });
    setCategoryData(Object.entries(cats).map(([name, count]) => ({ name, count })));

    // Status data
    const statusMap: Record<string, string> = {
      available: 'Disponível',
      in_use: 'Em uso',
      maintenance: 'Manutenção',
      decommissioned: 'Desativado',
    };
    const statuses: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusMap[i.status] || i.status;
      statuses[label] = (statuses[label] || 0) + 1;
    });
    setStatusData(Object.entries(statuses).map(([name, value]) => ({ name, value })));
  };

  const statCards = [
    { title: 'Total de Itens', value: stats.totalItems, icon: Package, color: 'text-primary' },
    { title: 'Colaboradores', value: stats.totalCollaborators, icon: Users, color: 'text-accent' },
    { title: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'text-warning' },
    { title: 'Movimentações', value: stats.movements, icon: ArrowUpDown, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu inventário</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <card.icon className={`w-10 h-10 ${card.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(215, 70%, 28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum item cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Itens</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum item cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
