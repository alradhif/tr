

import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Copy, Upload } from 'lucide-react';
import { dashboardAssets } from '@/assets';
import '../assistant/assistant.css';

interface Suggestion {
  id: string;
  label: string;
  prompt: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: ReactNode;
  copyText?: string;
}

const SENIOR_PROFILE = {
  name: 'الإدارة العليا',
};

const suggestions: Suggestion[] = [
  { id: 's1', label: 'كم مستأجر نشط حالياً؟', prompt: 'كم مستأجر نشط حالياً؟' },
  { id: 's2', label: 'ما إجمالي الإيرادات هذا الشهر؟', prompt: 'ما إجمالي الإيرادات هذا الشهر؟' },
  { id: 's3', label: 'لخص حالة الاشتراكات', prompt: 'لخص حالة الاشتراكات' },
];

const tenantsAnswer = (
  <>
    <p>
      لديك حالياً <strong>128</strong> مستأجراً نشطاً موزعين كالتالي:
    </p>
    <ul>
      <li>🟢 نشط: 112 مستأجر</li>
      <li>🟡 تجريبي: 10 مستأجرين</li>
      <li>🔴 موقوف: 6 مستأجرين</li>
    </ul>
  </>
);

const revenueAnswer = (
  <>
    <p>
      إجمالي الإيرادات هذا الشهر: <strong>48,750 ريال</strong>
    </p>
    <ul>
      <li>💼 باقة الأعمال: 28,000 ريال</li>
      <li>🏢 الباقة المؤسسية: 20,750 ريال</li>
    </ul>
  </>
);

const subscriptionsAnswer = (
  <>
    <p>
      لديك <strong>94</strong> اشتراكاً نشطاً، منها <strong>8</strong> تنتهي خلال 30 يوماً.
    </p>
    <ul>
      <li>✅ مجددة تلقائياً: 72 اشتراك</li>
      <li>⚠️ بحاجة إلى تجديد يدوي: 22 اشتراك</li>
    </ul>
  </>
);

const fallbackAnswer = (
  <p>لم أجد بيانات كافية للإجابة على هذا السؤال بدقة، هل يمكنك إعادة صياغته أو تحديد نطاقاً معيناً؟</p>
);

function answerFor(prompt: string): ReactNode {
  const normalized = prompt.trim();
  if (normalized.includes('مستأجر') || normalized.includes('نشط')) return tenantsAnswer;
  if (normalized.includes('إيراد') || normalized.includes('ايراد') || normalized.includes('مالي')) return revenueAnswer;
  if (normalized.includes('اشتراك') || normalized.includes('باقة')) return subscriptionsAnswer;
  return fallbackAnswer;
}

function plainTextFor(node: ReactNode): string {
  if (node === tenantsAnswer) return 'لديك حالياً 128 مستأجراً نشطاً: 112 نشط، 10 تجريبي، 6 موقوف.';
  if (node === revenueAnswer) return 'إجمالي الإيرادات هذا الشهر: 48,750 ريال. باقة الأعمال: 28,000 ريال، الباقة المؤسسية: 20,750 ريال.';
  if (node === subscriptionsAnswer) return 'لديك 94 اشتراكاً نشطاً، منها 8 تنتهي خلال 30 يوماً.';
  return 'لم أجد بيانات كافية للإجابة على هذا السؤال بدقة.';
}

let messageIdCounter = 0;
function nextId() {
  messageIdCounter += 1;
  return `senior-m${messageIdCounter}`;
}

export function SeniorAIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = SENIOR_PROFILE.name.split(' ')[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function openPanel() {
    setIsOpen(true);
  }

  function closePanel() {
    setIsOpen(false);
  }

  function resetToWelcome() {
    setIsOpen(false);
    setHasStartedChat(false);
    setMessages([]);
    setDraft('');
  }

  function sendPrompt(prompt: string) {
    const text = prompt.trim();
    if (!text) return;

    setHasStartedChat(true);
    setDraft('');

    const userMessage: ChatMessage = { id: nextId(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    window.setTimeout(() => {
      const answer = answerFor(text);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', content: answer, copyText: plainTextFor(answer) },
      ]);
    }, 700);
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      
    }
  }

  if (!isOpen) {
    return (
      <button type="button" className="assistant-fab" onClick={openPanel} aria-label="فتح المساعد الذكي">
        <img src={dashboardAssets.assistantIcon} alt="" />
      </button>
    );
  }

  return (
    <div className="assistant-panel" role="dialog" aria-label="المساعد الذكي">
      {hasStartedChat ? (
        <>
          <div className="assistant-panel__header">
            <button
              type="button"
              className="assistant-panel__header-brand"
              onClick={resetToWelcome}
              aria-label="المساعد الذكي، العودة إلى الشاشة الرئيسية"
            >
              <img src={dashboardAssets.assistantIcon} alt="" className="assistant-panel__header-icon" />
              <span className="assistant-panel__header-title">المساعد الذكي</span>
            </button>
          </div>

          <div className="assistant-conversation">
            <div className="assistant-conversation__messages">
              {messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="assistant-msg assistant-msg--user">
                    <div className="assistant-bubble">{message.content}</div>
                  </div>
                ) : (
                  <div key={message.id} className="assistant-msg assistant-msg--assistant">
                    <div className="assistant-answer">{message.content}</div>
                    <button
                      type="button"
                      className="assistant-answer__copy"
                      onClick={() => handleCopy(message.copyText ?? '')}
                      aria-label="نسخ الإجابة"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                ),
              )}
              {isTyping && (
                <div className="assistant-msg assistant-msg--assistant">
                  <div className="assistant-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="assistant-conversation__composer">
              <SeniorComposer draft={draft} setDraft={setDraft} onSend={() => sendPrompt(draft)} />
            </div>
          </div>
        </>
      ) : (
        <div className="assistant-welcome">
          <div className="assistant-welcome__top">
            <img src={dashboardAssets.assistantIcon} alt="" className="assistant-welcome__icon" onClick={closePanel} />
          </div>

          <div className="assistant-welcome__middle">
            <div className="assistant-welcome__group">
              <div className="assistant-welcome__greeting">
                <p className="assistant-welcome__hello">مرحبا {firstName}</p>
                <p className="assistant-welcome__sub">كيف يمكنني مساعدتك؟</p>
              </div>

              <div className="assistant-welcome__bottom">
                <SeniorComposer draft={draft} setDraft={setDraft} onSend={() => sendPrompt(draft)} />

                <div className="assistant-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="assistant-suggestion"
                      title={suggestion.label}
                      onClick={() => sendPrompt(suggestion.prompt)}
                    >
                      <span>اقتراح</span>
                      <SeniorSuggestionIcon />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
}

function SeniorComposer({ draft, setDraft, onSend }: ComposerProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="assistant-composer">
      <button type="button" className="assistant-composer__icon-btn" aria-label="إرفاق ملف">
        <Upload size={16} />
      </button>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="أكتب رسالة"
        aria-label="أكتب رسالة"
      />
    </div>
  );
}

function SeniorSuggestionIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1.6" y="1.6" width="20.8" height="20.8" rx="7.5" stroke="white" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="1.4" fill="white" />
      <circle cx="12" cy="12" r="1.4" fill="white" />
      <circle cx="16" cy="12" r="1.4" fill="white" />
    </svg>
  );
}
