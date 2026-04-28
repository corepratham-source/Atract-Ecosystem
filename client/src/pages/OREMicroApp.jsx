import { useMemo, useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { microApps } from "../data/microApps";

const appById = (id) => microApps.find((a) => a.id === id);

const steps = [
  { key: "fullName", label: "Full Name" },
  { key: "contactNumber", label: "Contact Number" },
  { key: "email", label: "Email Address" },
  { key: "experience", label: "Experience" },
  { key: "expectedSalary", label: "Expected Salary" },
  { key: "functionCategory", label: "Function Category" },
  { key: "subFunction", label: "Sub-function" }
];

const promptsByField = {
  fullName: "Hello! What’s your full name?",
  contactNumber: "Great, what is your contact number?",
  email: "Thanks! What is your email address?",
  experience: "How many years of experience do you have?",
  expectedSalary: "What is your expected salary?",
  functionCategory: "Which function category are you applying for?",
  subFunction: "And what is the sub-function?"
};

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

export default function OREMicroApp({ appId: forcedAppId }) {
  const params = useParams();
  const appId = forcedAppId || params.appId;
  const app = useMemo(() => appById(appId), [appId]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [details, setDetails] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    experience: "",
    expectedSalary: "",
    functionCategory: "",
    subFunction: ""
  });
  const [chatMessages, setChatMessages] = useState(() => [
    {
      id: "bot-1",
      sender: "bot",
      text: promptsByField.fullName,
      timestamp: Date.now()
    }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const progressPercent = Math.min(
    100,
    Math.round((currentStepIndex / steps.length) * 100)
  );
  const isComplete = currentStepIndex >= steps.length;

  const handleSend = () => {
    const value = inputValue.trim();
    if (!value || isComplete) return;

    const currentField = steps[currentStepIndex]?.key;
    const nextStepIndex = currentStepIndex + 1;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: value,
      timestamp: Date.now()
    };

    const botMessage = nextStepIndex < steps.length
      ? {
          id: `bot-${Date.now() + 1}`,
          sender: "bot",
          text: promptsByField[steps[nextStepIndex].key],
          timestamp: Date.now() + 1
        }
      : {
          id: `bot-${Date.now() + 2}`,
          sender: "bot",
          text: "All set! Your application details are saved. You may review the summary on the left.",
          timestamp: Date.now() + 2
        };

    setDetails((prev) => ({
      ...prev,
      [currentField]: value
    }));

    setChatMessages((prev) => [...prev, userMessage, botMessage]);
    setCurrentStepIndex(nextStepIndex);
    setInputValue("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSend();
  };

  const notFoundContent = (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-[#E0E0E0] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#4A4A4A]">
        <h2 className="text-2xl font-semibold text-[#4A4A4A] mb-3">App not found</h2>
        <p className="text-sm leading-relaxed">
          This micro-app does not exist in the ORE ecosystem. Check <code className="bg-[#F5F5F5] px-2 py-1 rounded">src/data/microApps.js</code> and ensure the route id matches.
        </p>
      </div>
    </div>
  );

  if (!app) {
    return notFoundContent;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#4A4A4A]">
      <div className="mx-auto flex min-h-screen max-w-full flex-col">
        <header className="border-b border-[#E0E0E0] bg-white">
          <div className="mx-auto flex w-full items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E53935] text-white text-sm font-bold">ORE</div>
              <div>
                <p className="text-sm font-semibold text-[#4A4A4A]">Core Careers Hiring Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-[#E53935] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#C62828]">
                Candidate Apply
              </button>
              <button className="rounded-lg border border-[#E0E0E0] bg-white px-3 py-1.5 text-xs font-semibold text-[#4A4A4A] transition hover:border-[#E53935] hover:text-[#E53935]">
                Create Job
              </button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden p-3">
          <div className="flex w-full flex-1 gap-3 lg:flex-row">
            <aside className="w-full max-w-[280px] flex-shrink-0">
              <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-[0.15em]">Progress</p>
                    <p className="mt-0.5 text-2xl font-bold text-[#4A4A4A]">{progressPercent}%</p>
                  </div>
                  <div className="text-xs text-[#9E9E9E]">{Math.min(currentStepIndex, steps.length)}/{steps.length}</div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E0E0E0]">
                  <div className="h-full rounded-full bg-[#E53935] transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-3 space-y-2">
                  {steps.map((step, index) => {
                    const completed = index < currentStepIndex;
                    const active = index === currentStepIndex && !isComplete;
                    return (
                      <div key={step.key} className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold">
                          {completed ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E53935] text-white">✓</span>
                          ) : (
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${active ? "border-[#E53935] bg-[#FFEBEE] text-[#E53935]" : "border-[#E0E0E0] bg-[#F5F5F5] text-[#9E9E9E]"}`}>
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${active ? "text-[#E53935]" : "text-[#9E9E9E]"}`}>{step.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-[#E0E0E0] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-[0.15em]">Details</p>
                <div className="mt-2 space-y-1.5 text-xs text-[#9E9E9E]">
                  <div><span className="font-medium text-[#4A4A4A]">Name:</span> {details.fullName || "—"}</div>
                  <div><span className="font-medium text-[#4A4A4A]">Phone:</span> {details.contactNumber || "—"}</div>
                  <div><span className="font-medium text-[#4A4A4A]">Email:</span> {details.email || "—"}</div>
                  <div><span className="font-medium text-[#4A4A4A]">Function:</span> {details.functionCategory || "—"}</div>
                  <div><span className="font-medium text-[#4A4A4A]">Sub-func:</span> {details.subFunction || "—"}</div>
                </div>
              </div>
            </aside>

            <section className="flex min-h-[calc(100vh-140px)] flex-1 flex-col overflow-hidden rounded-2xl bg-[#F5F5F5] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#E0E0E0]">
              <div className="flex items-center justify-between border-b border-[#E0E0E0] bg-white px-4 py-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9E9E9E]">Application</p>
                </div>
                <div className="rounded-lg bg-[#E53935] px-2 py-0.5 text-xs font-semibold text-white">Live</div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-2">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[65%] rounded-2xl px-3 py-2 ${message.sender === "user" ? "bg-[#E53935] text-white" : "bg-white text-[#4A4A4A] border border-[#E0E0E0]"}`}>
                        <p className="text-sm leading-snug">{message.text}</p>
                        <p className={`mt-1 text-[10px] ${message.sender === "user" ? "text-red-200" : "text-[#9E9E9E]"}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="border-t border-[#E0E0E0] bg-white px-3 py-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    disabled={isComplete}
                    placeholder={isComplete ? "Complete" : "Type..."}
                    className="flex-1 rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] px-3 py-2 text-sm text-[#4A4A4A] focus:border-[#E53935] focus:outline-none focus:ring-1 focus:ring-[#E53935] disabled:cursor-not-allowed disabled:bg-[#F5F5F5]"
                  />
                  <button
                    type="submit"
                    disabled={isComplete}
                    className="rounded-lg bg-[#E53935] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C62828] disabled:cursor-not-allowed disabled:bg-[#9E9E9E]"
                  >
                    Send
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
