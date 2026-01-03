'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { OwnerPageShell } from '@/components/dashboard/owner/owner-page-shell';
import { OwnerPageHeader } from '@/components/owner/owner-page-header';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, File, Calendar, Trash, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function OwnerArticlesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [viewDrawer, setViewDrawer] = useState(false);
  const [viewEntity, setViewEntity] = useState<any>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const result = await api.get('/api/owner/articles', {
        search,
        status: statusFilter,
      });
      setArticles(result.data || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load articles', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/owner/articles/new');
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/owner/articles/${id}`);
  };

  const handlePublish = async (id: number) => {
    try {
      await api.post('/api/owner/articles/publish-now', {
        articleId: id,
        placement: 'home',
        featured: false,
      });
      toast({ title: 'Article Published', description: 'Article has been published successfully.' });
      await fetchArticles();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to publish', description: error.message });
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingIds([...deletingIds, id]);
    try {
      await api.delete(`/api/owner/articles/${id}`);
      toast({ title: 'Article Deleted', description: 'Article has been deleted.' });
      await fetchArticles();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    } finally {
      setDeletingIds(deletingIds.filter(x => x !== id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(deletingIds.map(id => api.delete(`/api/owner/articles/${id}`)));
      toast({ title: 'Articles Deleted', description: `${deletingIds.length} articles deleted.` });
      setDeletingIds([]);
      await fetchArticles();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete', description: error.message });
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [search, statusFilter]);

  const filteredArticles = articles.filter((a: any) => statusFilter === 'ALL' || a.status === statusFilter);

  return (
    <OwnerPageShell title="Articles" subtitle={`${filteredArticles.length} articles`}>
      <OwnerPageHeader
        title="Articles"
        subtitle={`${filteredArticles.length} articles`}
        actionLabel="Create New"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={handleCreateNew}
      />

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {deletingIds.length > 0 && (
        <div className="flex gap-2 mb-4 bg-blue-50 p-2 rounded border border-blue-200">
          <span className="text-sm font-semibold text-blue-900">{deletingIds.length} selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeletingIds([])}>
            Cancel
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredArticles.map((article: any) => (
          <div key={article.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={article.status === 'PUBLISHED' ? 'default' : 'secondary'}>{article.status}</Badge>
                  <span className="text-xs text-muted-foreground">ID: {article.id}</span>
                </div>
                <h3 className="text-xl font-bold">{article.title}</h3>
                <p className="text-muted-foreground line-clamp-2">
                  {article.excerpt || 'No excerpt available.'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Locale: {article.localeCode || 'en'}</span>
                  <span>Author: {article.authorId || 'Unknown'}</span>
                  <span>Created: {new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(article.id)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="default" size="sm" onClick={() => handlePublish(article.id)} disabled={article.status === 'PUBLISHED'}>
                <Calendar className="h-4 w-4 mr-2" /> Publish
              </Button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Loading articles...</p>
        </div>
      )}

      {filteredArticles.length === 0 && !loading && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
          <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or create a new article.</p>
          <Button onClick={handleCreateNew} className="mt-4">
            <Plus className="h-4 w-4 mr-2" /> Create First Article
          </Button>
        </div>
      )}

      <EntityDrawer
        isOpen={viewDrawer}
        entity={viewEntity}
        entityType="Article"
        title="Article Details"
        onClose={() => {
          setViewDrawer(false);
          setViewEntity(null);
        }}
      />
    </OwnerPageShell>
  );
}
