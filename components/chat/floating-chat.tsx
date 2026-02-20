"use client"

import * as React from "react"
import { MessageSquareText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "./chat-interface"
import { cn } from "@/lib/utils"

export function FloatingChat() {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <>
            {/* Chat Popup Panel */}
            <div
                className={cn(
                    "fixed bottom-38 md:bottom-24 right-6 z-[60] w-[calc(100vw-3rem)] sm:w-[420px] h-[600px] max-h-[70vh] md:max-h-[80vh] transition-all duration-300 ease-in-out origin-bottom-right",
                    isOpen
                        ? "scale-100 opacity-100 pointer-events-auto"
                        : "scale-95 opacity-0 pointer-events-none"
                )}
            >
                <div className="w-full h-full rounded-2xl shadow-2xl border border-border overflow-hidden bg-card">
                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted hover:bg-accent transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {isOpen && <ChatInterface />}
                </div>
            </div>

            {/* Floating Action Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-20 md:bottom-6 right-6 z-[60] h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                    isOpen
                        ? "bg-muted-foreground hover:bg-muted-foreground/90"
                        : "bg-primary hover:bg-primary/90"
                )}
                size="icon"
            >
                {isOpen ? (
                    <X className="h-6 w-6 text-white" />
                ) : (
                    <MessageSquareText className="h-6 w-6 text-white" />
                )}
            </Button>
        </>
    )
}
