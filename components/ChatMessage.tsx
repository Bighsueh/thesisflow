import { Bot, User, Info, AlertCircle, CheckCircle } from 'lucide-react';
import React from 'react';
import { Message as MessageType } from '../types';

interface ChatMessageProps {
  message: MessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const getMessageStyle = () => {
    switch (message.role) {
      case 'system':
        return 'bg-blue-50 text-blue-900 border-blue-200';
      case 'coach':
        return 'bg-purple-50 text-purple-900 border-purple-200';
      case 'status':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'user':
        return 'bg-primary text-primary-content';
      case 'ai':
        return 'bg-base-200 text-base-content';
      default:
        return 'bg-base-200 text-base-content';
    }
  };

  const getIcon = () => {
    switch (message.role) {
      case 'system':
        return <Info size={16} />;
      case 'coach':
        return <Bot size={16} />;
      case 'status':
        return <CheckCircle size={16} />;
      case 'user':
        return <User size={16} />;
      case 'ai':
        return <Bot size={16} />;
      default:
        return null;
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}>
      <div className="chat-header flex items-center gap-2 mb-1">
        {!isUser && getIcon()}
        <span className="text-xs opacity-70">
          {message.role === 'system' && '系統'}
          {message.role === 'coach' && 'AI 教練'}
          {message.role === 'status' && '狀態'}
          {message.role === 'user' && '你'}
          {message.role === 'ai' && 'AI'}
        </span>
        <time className="text-xs opacity-50">
          {new Date(message.timestamp).toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>
      <div
        className={`chat-bubble text-sm shadow-sm whitespace-pre-wrap border ${getMessageStyle()}`}
      >
        {message.content}
      </div>
      {message.evidenceIds && message.evidenceIds.length > 0 && (
        <div className="chat-footer text-xs opacity-50 mt-1">
          引用了 {message.evidenceIds.length} 則標記片段
        </div>
      )}
    </div>
  );
};
