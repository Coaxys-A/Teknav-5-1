'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calendar, Users } from 'lucide-react';

export default function OwnerAnalyticsRetentionPage() {
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState<'day' | 'week'>('day');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [maxPeriods, setMaxPeriods] = useState(14);

  const fetchCohorts = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/owner/analytics/retention/report', {
        unit,
        from: from || undefined,
        to: to || undefined,
        maxPeriods,
      });
      setCohorts(result.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to load retention data', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    try {
      const result = await api.get('/api/owner/analytics/retention/export', {
        unit,
        from: from || undefined,
        to: to || undefined,
        maxPeriods,
      });
      
      const blob = new Blob([result.data], { type: result.contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || 'retention.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Export successful', description: 'Retention data exported to CSV.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to export', description: error.message });
    }
  };

  useEffect(() => {
    fetchCohorts();
  }, [unit, from, to, maxPeriods]);

  return (
    <OwnerPageShell title="Analytics - Retention" subtitle={`${cohorts.length} cohorts`}>
      <OwnerPageHeader
        title="Retention Analysis"
        subtitle={`${cohorts.length} cohorts analyzed`}
      />

      <div className="flex gap-4 mb-6">
        <Select value={unit} onValueChange={(v: any) => setUnit(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-4 font-semibold">Cohort</th>
              <th className="p-4 font-semibold">Size</th>
              <th className="p-4 font-semibold text-right">
                {unit === 'day' ? 'P0' : 'Week 0'}
              </th>
              {[...Array(maxPeriods).keys()].map(i => (
                <th key={i} className="p-4 font-semibold text-right">
                  {unit === 'day' ? `P${i+1}` : `Week ${i+1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort: any) => (
              <tr key={cohort.cohortIndex} className="border-t">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(cohort.cohortDate).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-4 font-semibold">{cohort.size}</td>
                <td className="p-4 text-right text-green-600">100%</td>
                {cohort.retention.map((p: number, i: number) => (
                  <td key={i} className={`p-4 text-right ${p >= 50 ? 'text-green-600' : p >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {p}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center py-4 text-muted-foreground">
          Loading retention data...
        </div>
      )}
    </OwnerPageShell>
  );
}
