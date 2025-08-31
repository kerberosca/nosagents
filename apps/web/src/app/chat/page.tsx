import { ChatInterface } from '@/components/chat/chat-interface'

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Chat</h1>
        <p className="text-muted-foreground">
          Discutez avec vos agents IA spécialisés
        </p>
      </div>
      
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  )
}
