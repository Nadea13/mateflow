"use client"

import * as React from "react"
import { Send, Paperclip, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getMessages, sendMessage } from "@/lib/actions/chat"

interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    created_at: string
}

export function ChatInterface() {
    const [messages, setMessages] = React.useState<Message[]>([])
    const [inputValue, setInputValue] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        const fetchMessages = async () => {
            const history = await getMessages()
            setMessages(history as Message[])
        }
        fetchMessages()
    }, [])

    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSendMessage = async () => {
        if (!inputValue.trim() && !selectedFile) return
        if (isLoading) return

        const userMsg = inputValue
        setInputValue("")
        setIsLoading(true)

        // Optimistic update
        const tempId = Date.now().toString()
        const optimisticMsg: Message = {
            id: tempId,
            role: "user",
            content: userMsg,
            created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, optimisticMsg])

        const formData = new FormData()
        formData.append("content", userMsg)
        if (selectedFile) {
            formData.append("file", selectedFile)
        }

        setSelectedFile(null)

        try {
            await sendMessage(formData)
            const history = await getMessages()
            setMessages(history as Message[])
        } catch (error) {
            console.error("Failed to send message", error)
            // Rollback on error would go here
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSendMessage()
        }
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center p-4 border-b bg-card z-10">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src="/avatars/ai.png" />
                            <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">MateFlow Assistant</h3>
                        <p className="text-sm text-muted-foreground">Always here to help</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background scroll-smooth">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex w-full",
                            message.role === "user" ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                message.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                    : "bg-card text-foreground border border-border rounded-tl-none"
                            )}
                        >
                            <p className="whitespace-pre-wrap">
                                {(() => {
                                    const content = message.content;
                                    const billTagMatch = content.match(/\[VIEW_BILL:(.*?)\]/);
                                    if (billTagMatch) {
                                        const billId = billTagMatch[1];
                                        const cleanContent = content.replace(/\[VIEW_BILL:.*?\]/, "").trim();
                                        return (
                                            <>
                                                {cleanContent}
                                                <div className="mt-3 pt-3 border-t border-border/50">
                                                    <a
                                                        href={`/dashboard/bills/${billId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
                                                    >
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        View & Print Bill
                                                    </a>
                                                </div>
                                            </>
                                        );
                                    }
                                    return content;
                                })()}
                            </p>
                            <span
                                className={cn(
                                    "text-[10px] mt-1 block opacity-70",
                                    message.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
                                )}
                            >
                                {formatTime(message.created_at)}
                            </span>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex w-full justify-start">
                        <div className="bg-card text-foreground border border-border rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm">
                            <span className="flex space-x-1">
                                <span className="animate-bounce delay-0">.</span>
                                <span className="animate-bounce delay-150">.</span>
                                <span className="animate-bounce delay-300">.</span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) setSelectedFile(file)
                }}
            />

            {/* Input Area */}
            <div className="p-4 bg-card border-t">
                {selectedFile && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-muted rounded-lg border border-border w-fit">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground max-w-[200px] truncate">{selectedFile.name}</span>
                        <button
                            onClick={() => {
                                setSelectedFile(null)
                                if (fileInputRef.current) fileInputRef.current.value = ""
                            }}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-full h-10 w-10 shrink-0"
                    >
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tell me what to do..."
                        disabled={isLoading}
                        className="flex-1 h-12 rounded-full border-border focus-visible:ring-primary bg-muted focus:bg-card transition-colors"
                    />
                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={isLoading || (!inputValue.trim() && !selectedFile)}
                        className="h-12 w-12 rounded-full shadow-md shrink-0 bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-5 w-5 ml-0.5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
