import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Download, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type { Tables } from '@/integrations/supabase/types';

type InventoryItem = Tables<'inventory_items'>;
type Collaborator = Tables<'collaborators'>;

const statusLabels: Record<string, string> = {
  available: 'Disponível',
  in_use: 'Em uso',
  maintenance: 'Manutenção',
  decommissioned: 'Desativado',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  in_use: 'secondary',
  maintenance: 'outline',
  decommissioned: 'destructive',
};

const emptyForm = {
  patrimony_number: '',
  name: '',
  description: '',
  category: '',
  quantity: 0,
  minimum_stock: 0,
  location: '',
  collaborator_id: '',
  ticket_number: '',
  status: 'available',
};

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itemsRes, collabRes] = await Promise.all([
      supabase.from('inventory_items').select('*').order('created_at', { ascending: false }),
      supabase.from('collaborators').select('*'),
    ]);
    setItems(itemsRes.data || []);
    setCollaborators(collabRes.data || []);
  };

  const handleSave = async () => {
    const data = {
      ...form,
      quantity: Number(form.quantity),
      minimum_stock: Number(form.minimum_stock),
      collaborator_id: form.collaborator_id || null,
    };

    if (editingId) {
      const { error } = await supabase.from('inventory_items').update(data).eq('id', editingId);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Item atualizado!' });
    } else {
      const { error } = await supabase.from('inventory_items').insert(data);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Item cadastrado!' });
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    loadData();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({
      patrimony_number: item.patrimony_number,
      name: item.name,
      description: item.description || '',
      category: item.category || '',
      quantity: item.quantity,
      minimum_stock: item.minimum_stock,
      location: item.location || '',
      collaborator_id: item.collaborator_id || '',
      ticket_number: item.ticket_number || '',
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Item removido!' });
    loadData();
  };

  const exportToExcel = () => {
    const data = items.map((item) => ({
      'Nº Patrimônio': item.patrimony_number,
      Nome: item.name,
      Categoria: item.category,
      Quantidade: item.quantity,
      'Estoque Mínimo': item.minimum_stock,
      Localização: item.location,
      Status: statusLabels[item.status],
      'Nº Chamado': item.ticket_number,
      Colaborador: collaborators.find((c) => c.id === item.collaborator_id)?.name || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventário');
    XLSX.writeFile(wb, 'inventario.xlsx');
  };

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.patrimony_number.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventário</h1>
          <p className="text-muted-foreground">Gerencie todos os itens do estoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Item' : 'Novo Item'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Patrimônio *</Label>
                    <Input value={form.patrimony_number} onChange={(e) => setForm({ ...form, patrimony_number: e.target.value })} placeholder="PAT-0001" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do item" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do item" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Informática" />
                  </div>
                  <div className="space-y-2">
                    <Label>Localização</Label>
                    <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex: Sala 201" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} min={0} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque Mínimo</Label>
                    <Input type="number" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: Number(e.target.value) })} min={0} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="in_use">Em uso</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="decommissioned">Desativado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Colaborador</Label>
                    <Select value={form.collaborator_id} onValueChange={(v) => setForm({ ...form, collaborator_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {collaborators.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nº do Chamado</Label>
                  <Input value={form.ticket_number} onChange={(e) => setForm({ ...form, ticket_number: e.target.value })} placeholder="Ex: INC-12345" />
                </div>
                <Button onClick={handleSave} className="w-full">{editingId ? 'Atualizar' : 'Cadastrar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nome, patrimônio ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chamado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.patrimony_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.name}
                          {item.quantity <= item.minimum_stock && (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[item.status]}>{statusLabels[item.status]}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.ticket_number}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
