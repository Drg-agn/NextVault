import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "👋 Hi! I'm your NexVault Assistant. Ask me about your balance, transactions, or how to use the app!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Get accountId from localStorage (adjust key to match your app)
    const accountId = localStorage.getItem("accountId");
    const token = localStorage.getItem("token");

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function sendMessage() {
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            // Only send role/content to backend (exclude initial assistant greeting)
            const apiMessages = updatedMessages
                .filter(m => m.role === "user" || (m.role === "assistant" && m !== messages[0]))
                .map(m => ({ role: m.role, content: m.content }));

            const { data } = await axios.post(
                '${process.env.NEXT_PUBLIC_API_URL}/api/chat',
                { messages: apiMessages, accountId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "⚠️ Sorry, I'm having trouble connecting. Please try again."
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <>
            {/* Floating Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed", bottom: "24px", right: "24px",
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", cursor: "pointer", zIndex: 1000,
                    boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
                    fontSize: "24px", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "transform 0.2s"
                }}
                onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.target.style.transform = "scale(1)"}
            >
                {isOpen ? "✕" : "💬"}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div style={{
                    position: "fixed", bottom: "90px", right: "24px",
                    width: "350px", height: "480px",
                    background: "rgba(15, 15, 35, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "16px", zIndex: 1000,
                    display: "flex", flexDirection: "column",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
                    overflow: "hidden"
                }}>
                    {/* Header */}
                    <div style={{
                        padding: "16px",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", gap: "10px"
                    }}>
                        <div style={{
                            width: "36px", height: "36px", borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px"
                        }}>🏦</div>
                        <div>
                            <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>NexVault Assistant</div>
                            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px" }}>● Online</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1, overflowY: "auto", padding: "16px",
                        display: "flex", flexDirection: "column", gap: "10px"
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: "flex",
                                justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                            }}>
                                <div style={{
                                    maxWidth: "80%", padding: "10px 14px",
                                    borderRadius: msg.role === "user"
                                        ? "16px 16px 4px 16px"
                                        : "16px 16px 16px 4px",
                                    background: msg.role === "user"
                                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                                        : "rgba(255,255,255,0.08)",
                                    color: "white", fontSize: "13px",
                                    lineHeight: "1.5",
                                    border: msg.role === "assistant"
                                        ? "1px solid rgba(255,255,255,0.1)" : "none"
                                }}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div style={{
                                    padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
                                    background: "rgba(255,255,255,0.08)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    color: "rgba(255,255,255,0.5)", fontSize: "13px"
                                }}>
                                    ✦ Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: "12px",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        display: "flex", gap: "8px"
                    }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1, padding: "10px 14px",
                                borderRadius: "24px",
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "white", fontSize: "13px", outline: "none"
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            style={{
                                width: "40px", height: "40px", borderRadius: "50%",
                                background: loading || !input.trim()
                                    ? "rgba(99,102,241,0.3)"
                                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                border: "none", cursor: loading ? "not-allowed" : "pointer",
                                color: "white", fontSize: "16px",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}