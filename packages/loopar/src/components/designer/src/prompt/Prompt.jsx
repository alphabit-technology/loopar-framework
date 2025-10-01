import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@cn/components/ui/button";
import { Modal } from "@dialog"
import { Scaner } from "./src/Scaner.jsx";
import loopar from "loopar";
import { GeminiSend, GeminiStatus, GeminiContextProvider } from "../AI/local/Gemini.jsx";
import { AIPrompt } from "loopar";

export const Prompt = ({
  onSend,
  onClose,
  onComplete,
  document_type,
  ...props
}) => {
  const [open, setOpen] = useState(props.open);
  const [sendingPrompt, setSendingPrompt] = useState(props.open);
  const [currentPrompt, setCurrentPrompt] = useState(props.defaultPrompt || "");
  const [AI, setAi] = useState("GPT");
  const [copiedStatus, setCopiedStatus] = useState("waiting");

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const handleSetPrompt = (value) => {
    setCurrentPrompt(value);
  }

  useEffect(() => {
    setCurrentPrompt(props.defaultPrompt)
  }, [props.defaultPrompt])

  const handelComplete = (response) => {
    setSendingPrompt(false);
    onComplete && onComplete(response);
  }

  const sendPrompt = (prompt, document_type) => {
    setCurrentPrompt(prompt);
    
    loopar.method("GPT", "prompt", { prompt, document_type }, {
      success: (res) => {
        onComplete && onComplete(res.message);
        onClose && onClose();
      },
      always: () => {
        setSendingPrompt(false);
      },
      freeze: false
    });
  }

  const info = () => {
    if (sendingPrompt) return null
    return (
      <div className="rounded-md border border-gray-100 dark:border-gray-800 p-3 bg-white/60 dark:bg-black/20 transition-all">
        {AI === "GPT" && (
          <div>
            <p className="text-sm text-muted-foreground">
              Powered by <a className="text-blue-500" target="_blank" href="https://openai.com/api/">OpenAI</a>
            </p>
            <ul className="mt-2 ml-4 text-sm list-disc text-muted-foreground">
              <li><a className="text-blue-500" target="_blanck" href="https://platform.openai.com/api-keys">Get your API key</a></li>
              <li><a className="text-blue-500" target="_blanck" href="https://platform.openai.com/docs/guides">Explore the API documentation</a></li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
               Navigate to <a className="text-blue-500" target="_blanck" href="/desk/integrations">Integrations</a>
            </p>
            <ul className="mt-2 ml-4 text-sm list-disc text-muted-foreground">
              <li>Set your OpenAI API key in AI Provider</li>
              <li>Create your OpenAI Models in AI Model</li>
            </ul>
          </div>
        )}
        {AI === "Local" && (
          <div>
            <GeminiStatus />
          </div>
        )}
        {AI === "Browser" && (
          <div>
            <p className="text-sm text-muted-foreground">
              In this mode, you can copy prompt text and paste
              into your preferred AI service in the browser.
            </p>
            <ul className="mt-2 ml-4 text-sm list-disc text-muted-foreground space-y-1">
              <li>
                Click <span className="font-semibold border rounded-sm bg-primary/70 p-1 text-secondary">&Copy Prompt</span> to prepare your custom prompt.
              </li>
              <li>
                Then, paste it into your chosen Chat AI service in the browser:
                <a className="text-blue-500 pl-2 pr-2" href="https://chatgpt.com/?model=auto">GPT,</a>
                <a className="text-blue-500 pr-2" href="https://gemini.google.com/">Gemini,</a>
                <a className="text-blue-500" href="https://grok.com/">Grok</a> ...
              </li>
              <li>
                Click <span className="font-semibold border rounded-sm bg-primary/70 p-1 text-secondary">&Eval</span> to process the response
              </li>
            </ul>
          </div>
        )}
      </div>
    )
  };

  return (
    <Modal
      open={open}
      single={true}
      size="lg"
      title={sendingPrompt ? "Waiting for AI response..." : "Design your model with AI"}
      buttons={[]}
      onClose={() => {
        setOpen(false);
        setSendingPrompt(false);
        onClose && onClose();
      }}
    >
      <GeminiContextProvider>
        <div className="flex-grow space-y-4">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm font-semibold">AI:</label>
              <div className="flex rounded-lg bg-transparent p-1 border border-transparent space-x-2">
                {["GPT", "Local", "Browser"].map((option) => (
                  <button
                    key={option}
                    onClick={() => setAi(option)}
                    disabled={sendingPrompt}
                    aria-pressed={AI === option}
                    className={`px-4 py-1 rounded-md transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-offset-1
                      ${AI === option
                        ? "bg-destructive text-secondary dark:text-primary shadow-md"
                        : " hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted-foreground">
                {sendingPrompt ? "Sending…" : "Ready"}
              </span>
            </div>

            {info()}
          </div>

          {sendingPrompt && <Scaner text={currentPrompt} />}

          {!sendingPrompt && (
            <textarea
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex field-sizing-content min-h-40 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-lg"
              placeholder="Enter your prompt here..."
              value={currentPrompt}
              onChange={(e) => {
                handleSetPrompt(e.target.value);
              }}
            />
          )}
          <div className="flex flex-row pt-4">
            <div className="flex flex-row justify-end w-full">
              <div className="mt-4 text-right space-x-2">
                {sendingPrompt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSendingPrompt(false);
                    }}
                  >
                    Rewrite
                  </Button>
                )}

                {!sendingPrompt && (
                  <>
                    {AI === "GPT" && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSendingPrompt(true);
                          sendPrompt(currentPrompt, document_type);
                        }}
                      >
                        Send to GPT
                      </Button>
                    )}
                    {AI === "Local" && (
                      <GeminiSend
                        inputText={currentPrompt}
                        isUserActivated={AI === "Local"}
                        onStart={() => setSendingPrompt(true)}
                        onComplete={handelComplete}
                      />
                    )}
                    {AI === "Browser" && (
                      <Button
                        variant="primary"
                        onClick={async () => {
                          if (copiedStatus === "waiting") {
                            const promp = AIPrompt(currentPrompt, document_type);
                            navigator.clipboard.writeText(promp.system.content + "\n" + promp.user.content + "\n" + "Respond in a plain JSON code block (```json ...```)");
                            setCopiedStatus("copied");
                            loopar.notify("Prompt copied to clipboard", "success");
                          } else if (copiedStatus === "copied") {
                            const r = loopar.utils.evaluateAIResponse(await navigator.clipboard.readText(), "[", "]");
                            onComplete && onComplete(r);
                            setSendingPrompt(false);
                            onClose && onClose();
                            setCopiedStatus("waiting");
                          }
                        }}
                      >
                        {copiedStatus === "waiting" && "&Copy Prompt"}
                        {copiedStatus === "copied" && "&Eval"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </GeminiContextProvider>
    </Modal>
  );
}