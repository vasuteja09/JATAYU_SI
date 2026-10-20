import React, { useState } from 'react';
import {
  Sparkles, Send, X, Bot, User, CheckCircle2,
  Database, RefreshCw, MessageSquare, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

interface CopilotMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  groundedSources?: string[];
  suggestedFollowups?: string[];
  timestamp: string;
}

const DEFAULT_SUGGESTIONS = [
  'Why is aircraft A101 at high maintenance risk?',
  'Which aircraft need attention first?',
  'Which parts are unavailable?',
  'What is scheduled for the next maintenance window?',
  'How does the simulated schedule affect projected availability?',
];

export const MaintenanceCopilotModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: 'Welcome to the **JATAYU Grounded Maintenance Copilot**. I analyze live telemetry, XGBoost prognostics, spare inventory, and OR-Tools CP-SAT schedules to answer questions strictly grounded in real database records.',
      suggestedFollowups: DEFAULT_SUGGESTIONS,
      timestamp: 'Now',
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || loading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(q);
      const copilotMsg: CopilotMessage = {
        id: `copilot-${Date.now()}`,
        sender: 'copilot',
        text: res.answer,
        groundedSources: res.grounded_sources,
        suggestedFollowups: res.suggested_followups,
        timestamp: res.data_timestamp,
      };
      setMessages(prev => [...prev, copilotMsg]);
    } catch (err: any) {
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        sender: 'copilot',
        text: `Unable to retrieve telemetry from backend: ${err?.message || 'Connection error'}. Please verify backend service is running.`,
        timestamp: 'Now',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="copilot-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-aerospace-900 flex items-center justify-center text-sky-300 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="copilot-title" className="text-sm font-bold text-aerospace-900">
                  JATAYU Grounded Maintenance Copilot
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                  Zero External LLM Leakage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Grounded in live database records, XGBoost inference, and OR-Tools CP-SAT schedule allocations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Copilot"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'copilot' && (
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-aerospace-900 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line font-normal">{m.text}</div>

                {/* Grounded Sources */}
                {m.groundedSources && m.groundedSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500">
                    <Database className="w-3 h-3 text-blue-600" />
                    <span className="font-semibold text-slate-600">Grounded in:</span>
                    {m.groundedSources.map((src, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] border border-slate-200"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested follow-ups */}
                {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Suggested Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestedFollowups.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>{s}</span>
                          <ChevronRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Retrieving telemetry and evaluating predictive models...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(query);
          }}
          className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about aircraft risk, parts shortage, or maintenance schedule..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            aria-label="Send query"
            className="p-2.5 bg-aerospace-900 hover:bg-aerospace-800 disabled:opacity-50 text-white rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
