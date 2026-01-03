'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, X } from 'lucide-react';

export function ChatWithNewsButton({ articleId }: { articleId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/articles/${articleId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const result = await res.json();
      setResponse(result.data.answer);
    } catch (err) {
      setResponse('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-2xl border-2 border-background"
        >
          <Bot className="h-6 w-6 mr-2" />
          Ask AI
        </Button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <CardHeader className="flex items-center justify-between pb-4">
              <CardTitle>Ask AI about this Article</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question about this article..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading || !question.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {loading && (
                  <div className="text-center py-4 text-muted-foreground">
                    Asking AI...
                  </div>
                )}

                {response && !loading && (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-muted-foreground">
                      <Bot className="h-4 w-4" />
                      AI Response
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {response}
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
