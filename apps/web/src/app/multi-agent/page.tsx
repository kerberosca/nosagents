import React from 'react';
import { MultiAgentChat } from '@/components/chat/multi-agent-chat';

export default function MultiAgentPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1">
        <MultiAgentChat />
      </div>
    </div>
  );
}
