"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useSocket } from "@/app/providers/socket-provider";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.SOCKET_URL ||
    "https://rendezvous-server-gpmv.onrender.com";

interface ChatMessage {
    _id: string;
    sessionId: string;
    senderId: string;
    senderName: string;
    senderRole: "customer" | "staff";
    message: string;
    createdAt: string;
}

interface CustomerChatProps {
    sessionId: string;
    customerName: string;
    tableId?: string;
}

export function CustomerChat({ sessionId, customerName, tableId }: CustomerChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const { socket } = useSocket();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        socketRef.current = socket;

        // If tableId is present, we use table chat, otherwise fallback to session chat
        const joinEvent = tableId ? "chat:table:join" : "chat:join";
        const historyEvent = tableId ? "chat:table:history" : "chat:history";
        const historyResultEvent = tableId ? "chat:table:history:result" : "chat:history:result";
        const receiveEvent = tableId ? "chat:table:receive" : "chat:receive";
        const leaveEvent = tableId ? "chat:table:leave" : "chat:leave";

        const joinAndFetchHistory = () => {
            // Join chat room
            socket.emit(joinEvent, tableId ? { tableId } : { sessionId });
            // Fetch history
            socket.emit(historyEvent, tableId ? { tableId } : { sessionId });
        };

        // If the socket is already connected when this component mounts, join immediately
        if (socket.connected) {
            joinAndFetchHistory();
        } else {
            // Otherwise, wait for the connect event
            socket.on("connect", joinAndFetchHistory);
        }

        socket.on(historyResultEvent, (data: any) => {
            const idMatch = tableId ? data.tableId === tableId : data.sessionId === sessionId;
            if (idMatch) {
                setMessages(data.messages);
            }
        });

        // Listen for new messages
        socket.on(receiveEvent, (data: any) => {
            const idMatch = tableId ? data.tableId === tableId : data.sessionId === sessionId;
            if (idMatch) {
                setMessages((prev) => [...prev, data.message]);
            }
        });

        return () => {
            if (socket && socket.connected) {
                socket.emit(leaveEvent, tableId ? { tableId } : { sessionId });
            }
            if (socket) {
                socket.off("connect", joinAndFetchHistory);
                socket.off(historyResultEvent);
                socket.off(receiveEvent);
            }
            // Do NOT call socket.disconnect() because this is a shared socket from the SocketProvider!
        };
    }, [sessionId, tableId, socket]);

    const handleSend = () => {
        if (!input.trim() || !socketRef.current) return;

        const sendEvent = tableId ? "chat:table:send" : "chat:send";

        socketRef.current.emit(sendEvent, {
            tableId: tableId || undefined,
            sessionId: tableId ? undefined : sessionId,
            message: input.trim(),
            senderName: customerName,
            senderRole: "customer",
        });

        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="w-full h-[400px] flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl mt-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-black/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm">Chat with Staff</h3>
                    <p className="text-white/40 text-xs text-left">
                        Ask questions about your order
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 text-xs">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                        No messages yet. Say hi! 👋
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex ${msg.senderRole === "customer" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.senderRole === "customer"
                                    ? "bg-primary text-background rounded-br-sm"
                                    : "bg-white/10 text-white rounded-bl-sm"
                                    }`}
                            >
                                <p className="text-[10px] font-bold opacity-60 mb-0.5 tracking-wider uppercase">
                                    {msg.senderName}
                                </p>
                                <p className="text-sm leading-relaxed">{msg.message}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-3 rounded-xl bg-primary text-background hover:bg-white transition-all duration-200 disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
