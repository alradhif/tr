import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Copy, X } from 'lucide-react';
import { ApiError } from '../../../api/client';
import { askAssistant, tokenForPath } from '../../../api/me';
import { commonAssets, dashboardAssets } from '@/assets';
import { getClientUser } from '../../../auth/clientAuth';
import { getJodaynUser } from '../../../auth/jodaynAuth';
import { getOrgUser } from '../../../auth/orgAuth';
import { getSuperAdminUser } from '../../../auth/superAdminAuth';
import './assistant.css';

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

const suggestions: Suggestion[] = [
  { id: 's1', label: 'كم هدف استراتيجي منجز هالربع؟', prompt: 'كم هدف استراتيجي منجز هالربع؟' },
  { id: 's2', label: 'ما هي المخاطر الحرجة الحالية؟', prompt: 'ما هي المخاطر الحرجة الحالية؟' },
  { id: 's3', label: 'لخص حالة المشاريع النشطة', prompt: 'لخص حالة المشاريع النشطة' },
];

function answerNode(text: string): ReactNode {
  return <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>;
}

function sessionDisplayName() {
  const user = getSuperAdminUser() || getOrgUser() || getClientUser() || getJodaynUser()
  return user?.name?.trim() || ''
}

let messageIdCounter = 0;
function nextId() {
  messageIdCounter += 1;
  return `m${messageIdCounter}`;
}

export function AIAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = sessionDisplayName().split(' ')[0];

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
    setAttachment(null);
  }

  function sendPrompt(prompt: string) {
    const text = prompt.trim();
    const file = attachment;
    if (!text && !file) return;
    if (isTyping) return;

    setHasStartedChat(true);
    setDraft('');
    setAttachment(null);

    const label = file ? `${text || 'لخص هذا الملف'}\n📎 ${file.name}` : text;
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: <span style={{ whiteSpace: 'pre-wrap' }}>{label}</span> }]);
    setIsTyping(true);

    const reply = (answer: string) => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: answerNode(answer), copyText: answer }]);
    };

    const token = tokenForPath(location.pathname);
    if (!token) {
      reply('انتهت الجلسة، سجّل الدخول مرة أخرى لاستخدام المساعد.');
      return;
    }
    askAssistant(token, text, file)
      .then((result) => reply(result.reply))
      .catch((err) => reply(err instanceof ApiError ? err.message : 'تعذر الوصول إلى المساعد حالياً.'));
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      
    }
  }

  const panel = !isOpen ? (
    <button type="button" className="assistant-fab" onClick={openPanel} aria-label="فتح المساعد الذكي">
      <img src={dashboardAssets.assistantIcon} alt="" />
    </button>
  ) : (
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
              <Composer draft={draft} setDraft={setDraft} onSend={() => sendPrompt(draft)} attachment={attachment} setAttachment={setAttachment} disabled={isTyping} />
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
                <Composer draft={draft} setDraft={setDraft} onSend={() => sendPrompt(draft)} attachment={attachment} setAttachment={setAttachment} disabled={isTyping} />

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
                      <SuggestionIcon />
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

  return createPortal(panel, document.body);
}

interface ComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  onSend: () => void;
  attachment: File | null;
  setAttachment: (file: File | null) => void;
  disabled?: boolean;
}

function Composer({ draft, setDraft, onSend, attachment, setAttachment, disabled }: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="assistant-composer">
      <button
        type="button"
        className="assistant-composer__icon-btn"
        aria-label="إرفاق ملف"
        title="إرفاق ملف PDF أو نص"
        onClick={() => fileInputRef.current?.click()}
      >
        <img src={commonAssets.upload} alt="" width={16} height={16} className="asset-icon" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,application/pdf,text/plain"
        hidden
        onChange={(e) => {
          setAttachment(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      {attachment ? (
        <button
          type="button"
          className="assistant-composer__icon-btn"
          title={`إزالة ${attachment.name}`}
          aria-label={`إزالة المرفق ${attachment.name}`}
          onClick={() => setAttachment(null)}
        >
          <X size={14} />
        </button>
      ) : null}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={attachment ? `${attachment.name} · اكتب سؤالك عن الملف` : 'أكتب رسالة'}
        aria-label="أكتب رسالة"
        disabled={disabled}
      />
    </div>
  );
}

function SuggestionIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="1.6" y="1.6" width="20.8" height="20.8" rx="7.5" stroke="white" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="1.4" fill="white" />
      <circle cx="12" cy="12" r="1.4" fill="white" />
      <circle cx="16" cy="12" r="1.4" fill="white" />
    </svg>
  );
}
