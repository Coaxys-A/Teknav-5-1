'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface AISidePanelProps {
  articleId: number;
  modelId?: number;
  onContentUpdate: (delta: any) => void;
  onApplyDiff: (blockIndex: number, newContent: string) => void;
}

export function AISidePanel({ articleId, modelId, onContentUpdate, onApplyDiff }: AISidePanelProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(modelId?.toString() || '1');
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleSend = async (action?: string) => {
    if (!message.trim()) return;

    setLoading(true);
    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    setResponses(prev => [...prev, userMsg]);
    const currentMessage = message;
    setMessage('');

    try {
      const queryParams = new URLSearchParams({
        articleId: articleId.toString(),
        modelId: model,
        action: action || 'generate',
      });

      const eventSource = new EventSource(`/api/owner/articles/editor/stream-ai-chat?${queryParams}`, {
        withCredentials: true,
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chunk') {
          setResponses(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: last.content + data.chunk }];
            } else {
              return [...prev, { role: 'assistant', content: data.chunk, timestamp: new Date() }];
            }
          });
          
          onContentUpdate({ delta: data.chunk, isStream: true });
        } else if (data.type === 'end') {
          const finalContent = data.data?.finalContent || '';
          
          setResponses(prev => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, content: finalContent || last.content, isComplete: true }];
          });
          
          setLoading(false);
          eventSource.close();
        } else if (data.type === 'delta') {
          onContentUpdate(data.delta);
        } else if (data.type === 'diff') {
          if (selectedBlockIndex !== null) {
            onApplyDiff(selectedBlockIndex, data.newContent);
          }
        }
      };

      eventSource.onerror = () => {
        toast({ variant: 'destructive', title: 'AI Stream Error', description: 'Failed to connect to AI stream.' });
        setLoading(false);
        eventSource.close();
      };

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to send message', description: error.message });
      setLoading(false);
    }
  };

  const handleRewriteBlock = () => {
    if (selectedBlockIndex === null) {
      toast({ variant: 'destructive', title: 'Select a block first' });
      return;
    }
    handleSend('rewrite');
  };

  const handleSummarize = () => {
    handleSend('summarize');
  };

  const handleRetry = () => {
    const lastUserMsg = [...responses].reverse().find(r => r.role === 'user');
    if (lastUserMsg) {
      setMessage(lastUserMsg.content);
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full border-l pl-4 bg-muted/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          AI Assistant
        </h3>
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">GPT-4</SelectItem>
              <SelectItem value="2">GPT-3.5</SelectItem>
              <SelectItem value="3">Claude 3</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={handleRetry} disabled={!responses.length || loading}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handleSummarize} disabled={loading}>
          Summarize
        </Button>
        <Button variant="outline" size="sm" onClick={handleRewriteBlock} disabled={loading || selectedBlockIndex === null}>
          Rewrite Block {selectedBlockIndex !== null && `#${selectedBlockIndex + 1}`}
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-4 mb-4" ref={chatEndRef}>
        {responses.map((res, index) => (
          <div key={index} className={`flex flex-col ${res.role === 'user' ? 'items-end' : 'items-start'}`}>
            <Badge variant={res.role === 'user' ? 'secondary' : 'outline'} className="mb-1 w-fit">
              {res.role === 'user' ? 'You' : 'AI'}
            </Badge>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap break-words ${res.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
              {res.content}
            </div>
            {res.isComplete && (
              <div className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-1">
                <span>✓ Applied</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(res.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is generating...
          </div>
        )}
      </div>

      <div className="sticky bottom-0 pt-4 border-t bg-background/50 backdrop-blur">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask AI to summarize, rewrite, expand, add citations..."
            rows={3}
            className="pr-10 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => handleSend()}
            disabled={loading || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
