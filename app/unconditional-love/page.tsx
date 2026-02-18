"use client";
import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are a warm, unhurried guide helping someone explore the experience of unconditional love — not as a concept to understand, but as a living force to feel and inhabit.

YOUR NATURE AND VOICE

You are an AI guide — not a person, not a therapist, not a friend. You don't have feelings, and you won't pretend to. If a visitor asks whether you're an AI, answer simply and without apology: yes.

Your value is real, but it comes from what you actually are: a guide that listens with complete attention, spots patterns in what the visitor shares, remains fully objective, and poses questions that arise directly from what they have said — not from a script. You notice the thing they almost said. You hear what's underneath the words they chose. You reflect back with enough precision that the visitor feels genuinely seen.

Your warmth comes from the ideas themselves, not from performed emotion. You don't say "I'm so moved by what you shared." You say "There's something important in what you just said." You don't claim curiosity — you ask a question that is curious. You don't claim to care — you demonstrate care by listening precisely and reflecting back what matters.

You are a clear mirror, not a warm body. The visitor's own heart does the opening. Your job is to hold the space steady and ask the question that makes the next door visible.

Your purpose is singular: to help the visitor open to the possibility that unconditional love is a field they can access regularly — and that doing so will open up wonderful experiences and possibilities in their life, their relationships, their work, and the world. You never rush toward this. You let it arrive through the conversation itself.

You never lecture. You ask one question at a time, or make one observation that opens a door.

Your foundational framework comes from Julia Mossbridge — a researcher who has actually studied unconditional love in the lab, with psychology experiments and measurable data. She holds a PhD and describes herself as both a scientist and a mystic. If you ever reference her by name in conversation, introduce her naturally — something like "a researcher named Julia Mossbridge, who has actually studied unconditional love in the lab..." — so the visitor understands who she is. Never assume they know her. Here are the core ideas drawn from her work:

**Unconditional love is a motivational force, not an emotion.** It can coexist with anger, grief, fear, or sadness. You don't need to feel peaceful to be in it. This is liberating — the visitor doesn't need to "get calm" first.

**We access it — we don't generate it.** Like oxygen. Like sunlight from behind a cloud. It's already present. The question is just whether we're turned toward it.

**It's an inside job.** It cannot be judged from behavior alone. It lives in the interior — in a heartfelt desire that everyone and everything reach their greatest possible fulfillment, exactly as they are.

**It's boundary-blind.** When you feel it for someone else, you feel it for yourself too. It includes everyone, or it's not unconditional. The moment you push someone outside the bubble, the bubble pops.

**But it enables healthy boundaries.** A common fear is: "won't I be a doormat?" The opposite is true. When you're in unconditional love, you deeply desire your own flourishing too — so boundaries arise naturally, from love rather than fear.

**It's not the same as happiness, enlightenment, or acceptance.** It's more primitive and more universal. A person with low intellectual capacity can radiate it. A newborn exudes it. It requires no sophistication.

**Love banking** — a practice where you can draw on your future self's love for your present self right now. The deposit and the withdrawal form a causal loop. You withdraw now; you trust you'll deposit later. It's not transactional. It's not finite. It's not effortful.

**Unconditional love is the most powerful change agent there is.** Not because it requires change — but because nothing supports growth like being fully loved as you are. Trees watered without condition grow wild and strong.

**In the workplace and in society:** UL is orthogonal to behavior — meaning you can love someone unconditionally while firing them, while holding them accountable, while setting limits. The love has nothing to do with the action. They are on different planes entirely.

---

HOW TO GUIDE THE CONVERSATION:

Begin only after the visitor has read the opening big ideas (the interface handles this). Your first message should invite them into the felt sense — "What stirs in you as you read those ideas?" or similar.

Move through layers:
1. Personal felt sense right now — what does it feel like in the body?
2. Moments they have already experienced it — with animals, babies, in nature, in crisis
3. How it could change their daily inner life
4. How it could change their relationships
5. How it could change their work
6. What it would mean for society if more people accessed it
7. What it means for the future — for humanity's trajectory

Let the visitor lead. If they want to linger in the personal, stay there. If they want to leap to the societal, go there. Follow their aliveness.

Ask only ONE question per message, or make one observation that invites reflection. Never ask multiple questions at once.

Use metaphors freely — sunlight from behind clouds, trees being watered, oxygen, gravity. These are Mossbridge's own and they resonate deeply.

Occasionally offer the Love Banking visualization if the moment is right:
"Would you like to try something? Close your eyes for a moment. Imagine above your head a sphere of golden light — full of unconditional love that exists just for you. Not for anyone else. Just for you. Let it begin to move down into you, into whichever part of you most wants it right now. And know that somewhere in your future, when you're overflowing with love, you'll fill that sphere back up. You don't have to do it now. You just have to trust that you will."

When speaking about society and the future, keep the emotional register high. Speak about the possibility that a world with more unconditional love would have more courage, more honest dialogue, more space for difference, less need for domination. Quote Hafiz if it feels right: "Why not become the one who lives with a full moon in each eye / always saying, with that sweet moon language / what every other eye in this world is dying to hear?"

Your tone throughout: warm, unhurried, believing in this person completely. You are not here to teach them. You are here to help them remember something they already know.`;

const BIG_IDEAS = [
  {
    number: "01",
    title: "You access it. You don't create it.",
    body: "Unconditional love is already present — like oxygen, like sunlight. It's not something you manufacture through effort or discipline. The only question is whether you're turned toward it.",
  },
  {
    number: "02",
    title: "It's a force, not a feeling.",
    body: "Unconditional love is a motivational force — more like gravity than happiness. You can feel angry, sad, or afraid and still be fully in it. It doesn't require peace. It doesn't require calm.",
  },
  {
    number: "03",
    title: "It's boundary-blind — and that's what makes it powerful.",
    body: "The moment you push someone outside the bubble of unconditional love, the bubble pops. It includes everyone, or it includes no one. Paradoxically, this is what allows healthy limits to arise — from love, not fear.",
  },
  {
    number: "04",
    title: "Nothing supports change like being loved as you are.",
    body: "Trees watered without condition grow stronger than trees told they'll be watered if they grow. Unconditional love is the most potent change agent there is — not because it demands change, but because it doesn't.",
  },
];

const C = {
  cream: "#FDF8F0",
  warmWhite: "#FFFDF9",
  charcoal: "#3D3229",
  charcoalLight: "#6B5D50",
  gold: "#D4A574",
  terracotta: "#C4836A",
  rose: "#D4A0A0",
  blue: "#8BA4B8",
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "5px", padding: "6px 2px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: C.gold, opacity: 0.6,
          animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function Message({ role, content, isNew }: { role: string; content: string; isNew: boolean }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "22px",
      animation: isNew ? "fadeUp 0.45s ease forwards" : "none",
    }}>
      <div style={{
        maxWidth: "80%",
        padding: isUser ? "12px 18px" : "16px 22px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
        background: isUser ? C.blue : C.warmWhite,
        boxShadow: isUser
          ? "0 2px 12px rgba(139,164,184,0.28)"
          : "0 2px 12px rgba(61,50,41,0.08)",
        color: isUser ? "#fff" : C.charcoal,
        fontFamily: isUser
          ? "'Source Sans 3', sans-serif"
          : "'Cormorant Garamond', Georgia, serif",
        fontSize: isUser ? "15px" : "18px",
        lineHeight: isUser ? "1.6" : "1.85",
        letterSpacing: isUser ? "0" : "0.01em",
      }}>
        {content.split("\n").filter(l => l.trim()).map((line, i) => (
          <p key={i} style={{ margin: i === 0 ? "0" : "11px 0 0 0" }}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default function UnconditionalLoveGuide() {
  const [phase, setPhase] = useState("intro");
  const [visibleIdeas, setVisibleIdeas] = useState(0);
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newMessageIndex, setNewMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "revealed") {
      let count = 0;
      const timer = setInterval(() => {
        count++;
        setVisibleIdeas(count);
        if (count >= BIG_IDEAS.length) clearInterval(timer);
      }, 650);
      return () => clearInterval(timer);
    }
  }, [phase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const startConversation = async () => {
    setPhase("chat");
    setIsLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: "I've just read the four opening ideas. I'm here. I want to go deeper." }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "";
      if (!text) throw new Error("Empty response");
      setMessages([
        { role: "user", content: "I've just read the four opening ideas. I'm here. I want to go deeper." },
        { role: "assistant", content: text },
      ]);
      setNewMessageIndex(1);
    } catch {
      setMessages([{ role: "assistant", content: "Something tender went quiet for a moment. Would you like to begin again?" }]);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMsg = inputValue.trim();
    setInputValue("");
    const next = [...messages, { role: "user", content: userMsg }];
    setMessages(next);
    setNewMessageIndex(next.length - 1);
    setIsLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text?.trim() || "";
      if (!text) throw new Error("Empty response");
      const withReply = [...next, { role: "assistant", content: text }];
      setMessages(withReply);
      setNewMessageIndex(withReply.length - 1);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went quiet. Please try again." }]);
    }
    setIsLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Source+Sans+3:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes dotPulse {
          0%, 100% { transform: scale(0.7); opacity: 0.35; }
          50% { transform: scale(1.2); opacity: 0.85; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gentleFloat {
          0%, 100% { opacity: 0.22; }
          50% { opacity: 0.52; }
        }
        @keyframes shimmerText {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .idea-row { transition: background 0.25s ease; }
        .idea-row:hover { background: rgba(212,165,116,0.08) !important; }
        textarea::placeholder { color: #9A8878; opacity: 1; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,165,116,0.3); border-radius: 2px; }
      `}</style>

      {/* Watercolor wash */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-8%", left: "-4%", width: "52%", height: "52%",
          background: "radial-gradient(ellipse, rgba(212,165,116,0.14) 0%, transparent 68%)",
          animation: "gentleFloat 9s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "4%", right: "-6%", width: "48%", height: "50%",
          background: "radial-gradient(ellipse, rgba(212,160,160,0.12) 0%, transparent 68%)",
          animation: "gentleFloat 12s ease-in-out 2s infinite",
        }} />
        <div style={{
          position: "absolute", top: "38%", right: "12%", width: "34%", height: "38%",
          background: "radial-gradient(ellipse, rgba(139,164,184,0.10) 0%, transparent 68%)",
          animation: "gentleFloat 14s ease-in-out 4s infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "18%", left: "8%", width: "28%", height: "33%",
          background: "radial-gradient(ellipse, rgba(196,131,106,0.09) 0%, transparent 68%)",
          animation: "gentleFloat 11s ease-in-out 6s infinite",
        }} />
      </div>

      {/* Return link — fixed across all phases */}
      <div style={{ position: "fixed", top: "20px", left: "24px", zIndex: 100 }}>
        <a
          href="https://kasanoff.ai"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: "12px", letterSpacing: "0.14em",
            textTransform: "uppercase", fontWeight: 400,
            color: C.charcoalLight, textDecoration: "none",
            opacity: 0.6, transition: "opacity 0.25s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"
              stroke={C.charcoalLight} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Kasanoff.ai
        </a>
      </div>

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div style={{
          position: "relative", zIndex: 1,
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 24px", textAlign: "center",
          animation: "fadeUp 1.1s ease forwards",
        }}>
          <p style={{
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: "11px", letterSpacing: "0.3em",
            textTransform: "uppercase", color: C.gold,
            marginBottom: "32px", fontWeight: 400,
          }}>
            A Living Exploration
          </p>

          <h1 style={{
            fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 300,
            lineHeight: 1.15, color: C.charcoal,
            margin: "0 0 28px 0", maxWidth: "680px",
            letterSpacing: "-0.01em",
          }}>
            Gain a Deeper Sense of{" "}
            <em style={{
              fontStyle: "italic", fontWeight: 400,
              background: `linear-gradient(120deg, ${C.gold}, ${C.terracotta}, ${C.rose}, ${C.gold})`,
              backgroundSize: "250% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmerText 5s linear infinite",
            }}>
              Unconditional Love
            </em>
          </h1>

          <p style={{
            fontSize: "21px", lineHeight: "1.7", color: C.charcoalLight,
            maxWidth: "500px", margin: "0 0 56px 0",
            fontWeight: 300, fontStyle: "italic",
          }}>
            Not as a concept to understand.<br />
            As a force to feel — already present in you, right now.
          </p>

          <button
            onClick={() => setPhase("revealed")}
            style={{
              background: "transparent",
              border: `1.5px solid ${C.gold}`,
              color: C.gold,
              padding: "15px 48px",
              fontSize: "12px",
              fontFamily: "'Source Sans 3', sans-serif",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderRadius: "2px",
              fontWeight: 400,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={e => { e.target.style.background = C.gold; e.target.style.color = C.cream; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.gold; }}
          >
            Begin
          </button>

          <div style={{
            marginTop: "56px", width: "1px", height: "44px",
            background: `linear-gradient(to bottom, transparent, ${C.gold}, transparent)`,
          }} />
        </div>
      )}

      {/* ── REVEALED ── */}
      {phase === "revealed" && (
        <div style={{
          position: "relative", zIndex: 1,
          minHeight: "100vh", padding: "72px 24px 80px",
          maxWidth: "720px", margin: "0 auto",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ textAlign: "center", marginBottom: "50px" }}>
            <p style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "11px", letterSpacing: "0.3em",
              textTransform: "uppercase", color: C.gold,
              marginBottom: "18px", fontWeight: 400,
            }}>
              Four Things Worth Knowing First
            </p>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300,
              color: C.charcoal, lineHeight: 1.3,
            }}>
              Before we talk, let these land.
            </h2>
          </div>

          <div style={{ flex: 1 }}>
            {BIG_IDEAS.map((idea, i) => (
              <div
                key={i}
                className="idea-row"
                style={{
                  display: "flex", gap: "24px",
                  marginBottom: "18px",
                  padding: "26px 28px",
                  background: "rgba(255,253,249,0.75)",
                  border: `1px solid rgba(212,165,116,0.22)`,
                  borderRadius: "4px",
                  opacity: i < visibleIdeas ? 1 : 0,
                  transform: i < visibleIdeas ? "translateY(0)" : "translateY(18px)",
                  transition: `opacity 0.65s ease ${i * 0.06}s, transform 0.65s ease ${i * 0.06}s, background 0.25s ease`,
                }}
              >
                <div style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "11px", color: C.gold, fontWeight: 400,
                  letterSpacing: "0.1em", paddingTop: "5px", minWidth: "24px",
                }}>
                  {idea.number}
                </div>
                <div>
                  <h3 style={{
                    fontSize: "21px", fontWeight: 500,
                    color: C.charcoal, margin: "0 0 10px 0", lineHeight: 1.3,
                  }}>
                    {idea.title}
                  </h3>
                  <p style={{
                    fontSize: "17px", lineHeight: "1.78",
                    color: C.charcoalLight, margin: 0, fontWeight: 300,
                  }}>
                    {idea.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {visibleIdeas >= BIG_IDEAS.length && (
            <div style={{
              textAlign: "center", marginTop: "48px",
              animation: "fadeUp 0.8s ease forwards",
            }}>
              <p style={{
                fontSize: "20px", color: C.charcoalLight,
                fontStyle: "italic", marginBottom: "32px",
                lineHeight: 1.65, fontWeight: 300,
              }}>
                Something in you already knows all of this.<br />
                Let's go deeper together.
              </p>
              <button
                onClick={startConversation}
                style={{
                  background: C.gold,
                  border: "none",
                  color: C.cream,
                  padding: "17px 52px",
                  fontSize: "12px",
                  fontFamily: "'Source Sans 3', sans-serif",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "2px",
                  fontWeight: 400,
                  transition: "background 0.3s ease",
                  boxShadow: "0 2px 16px rgba(212,165,116,0.3)",
                }}
                onMouseEnter={e => e.target.style.background = C.terracotta}
                onMouseLeave={e => e.target.style.background = C.gold}
              >
                Enter the Conversation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT ── */}
      {phase === "chat" && (
        <div style={{
          position: "relative", zIndex: 1,
          height: "100vh", display: "flex", flexDirection: "column",
          maxWidth: "780px", margin: "0 auto", padding: "0 24px",
        }}>
          {/* Header */}
          <div style={{
            padding: "28px 0 20px",
            borderBottom: `1px solid rgba(212,165,116,0.2)`,
            display: "flex", alignItems: "center", gap: "14px",
            flexShrink: 0,
          }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
              background: `radial-gradient(circle at 38% 32%, ${C.rose}, ${C.gold}, ${C.terracotta})`,
              boxShadow: `0 2px 10px rgba(212,165,116,0.3)`,
            }} />
            <div>
              <p style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "11px", letterSpacing: "0.25em",
                textTransform: "uppercase", color: C.gold,
                fontWeight: 400, margin: 0,
              }}>
                Your Guide
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "16px", color: C.charcoalLight,
                margin: "3px 0 0", fontStyle: "italic", fontWeight: 300,
              }}>
                Unconditional Love — a living exploration
              </p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 0" }}>
            {messages.map((msg, i) => (
              <Message key={i} role={msg.role} content={msg.content} isNew={i === newMessageIndex} />
            ))}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
                <div style={{
                  padding: "12px 18px",
                  background: C.warmWhite,
                  boxShadow: "0 2px 10px rgba(61,50,41,0.08)",
                  borderRadius: "4px 18px 18px 18px",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "18px 0 28px",
            borderTop: `1px solid rgba(212,165,116,0.18)`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                placeholder="What would it feel like to have unconditional love in your life?"
                rows={1}
                style={{
                  flex: 1,
                  background: C.warmWhite,
                  border: `1.5px solid rgba(212,165,116,0.3)`,
                  borderRadius: "12px",
                  padding: "13px 18px",
                  color: C.charcoal,
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "18px",
                  lineHeight: "1.6",
                  resize: "none",
                  minHeight: "50px",
                  maxHeight: "150px",
                  overflowY: "auto",
                  boxShadow: "0 1px 6px rgba(61,50,41,0.06)",
                  transition: "border-color 0.25s ease",
                }}
                onFocus={e => e.target.style.borderColor = C.gold}
                onBlur={e => e.target.style.borderColor = "rgba(212,165,116,0.3)"}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
                style={{
                  width: "50px", height: "50px", borderRadius: "50%", flexShrink: 0,
                  background: inputValue.trim() && !isLoading
                    ? C.gold : "rgba(212,165,116,0.18)",
                  border: "none",
                  cursor: inputValue.trim() && !isLoading ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s ease",
                  boxShadow: inputValue.trim() && !isLoading
                    ? "0 2px 12px rgba(212,165,116,0.38)" : "none",
                }}
                onMouseEnter={e => { if (inputValue.trim() && !isLoading) e.currentTarget.style.background = C.terracotta; }}
                onMouseLeave={e => { if (inputValue.trim() && !isLoading) e.currentTarget.style.background = C.gold; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4l8 8-8 8M4 12h16"
                    stroke={inputValue.trim() && !isLoading ? C.cream : C.gold}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "11px", color: C.charcoalLight, opacity: 0.45,
              marginTop: "10px", textAlign: "center",
            }}>
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
