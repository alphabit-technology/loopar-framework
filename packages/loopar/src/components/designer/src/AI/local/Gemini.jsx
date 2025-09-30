import React, { useEffect, useState, useRef, createContext, useContext } from "react";
import {Button} from "@cn/components/ui/button";

import { AIPrompt, loopar } from "loopar";

const GeminiContext = createContext({
  status: "checking"
})

export const GeminiContextProvider = ({children}) => {
  const [status, setStatus] = useState("checking");
  const [downloadprogress, setDownloadprogress] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function check() {
      setStatus("checking");
      try {
        if (!window.LanguageModel || !window.LanguageModel.availability) {
          setStatus("unavailable");
          return;
        }
        const a = await window.LanguageModel.availability();
        if (!mounted) return;
        setStatus(a); // "downloadable", "available", "downloading", "unavailable"
      } catch (err) {
        console.error("availability error", err);
        setStatus("error");
      }
    }
    check();

    return () => (mounted = false);
  }, []);

  const install = async () =>{
    if (navigator.userActivation.isActive) {
      if(window.LanguageModel && window.LanguageModel.create){
        await LanguageModel.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              setDownloadprogress(e.loaded * 100);
              setStatus("downloading");
              console.log(`Downloaded ${e.loaded * 100}%`);
            });
          },
        });

        setStatus("available");
      } else {
        setStatus("unavailable")
        loopar.throw("Gemini Nano is not available in this browser")
      }
    }
  }

  return (
    <GeminiContext.Provider value = {{
      status,
      install,
      downloadprogress
    }}
    >
      {children}
    </GeminiContext.Provider>
  )
}

export const useGeminiContext = () => useContext(GeminiContext)

export function GeminiSend({inputText, isUserActivated, onStart, onComplete,  fallbackUrl = "/api/llm/summarize" }) {
  const [sendingPrompt, setSendingPrompt] = useState(false);
  const {status} = useGeminiContext();

  const doPrompt = async () => {
    onStart && onStart();
    try {
      if(navigator.userActivation.isActive) {
        setSendingPrompt(true);
        const prompt = AIPrompt(inputText, "Entity");
        console.log(["Gemini prompt", prompt]);
        const session = await LanguageModel.create({
          temperature: 0.1,
          topK: 2,
          initialPrompts: [
            {
              role: "system",
              content: prompt.system.content
            }
          ],
        });

        const r = await session.prompt(prompt.user.content);
        
        onComplete && onComplete(loopar.utils.evaluateAIResponse(r, "[", "]"));
      }else{
        loopar.throw("Please interact with the page (click, tap, etc.) before using the AI features.");
      }
    } catch (err) {
      console.error("LLM error", err);
      onComplete && onComplete([]);
      loopar.throw(err.message || err.toString());
    }
  };

  return (
    <Button onClick={doPrompt} disabled={status !== "available" || !isUserActivated || sendingPrompt}>
      {sendingPrompt ? <div className="loader mr-2"/> : null}
      Send
    </Button>
  );
}

export function GeminiStatus(){
  const {status, install, downloadprogress} = useGeminiContext();

  if(status === "unavailable") {
    return (
      <div className="text-sm text-red-500">
        Gemini Nano is not available in this browser
        <br/>
        <a className="text-blue-500" href="https://developer.chrome.com/docs/ai/built-in-apis" target="_blank" rel="noopener noreferrer">Please see documentation for supported browsers</a>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-row items-center space-x-2">
      {status === "checking" ? (
        <div className="loader mr-2"/>
      ) : null}
      {status === "available" ? (
        <div className="text-sm text-success">
          <p>
            Gemini Nano is available and ready to use.
          </p>
          <ul className="mt-2 ml-4 text-sm list-disc text-muted-foreground">
            <li>
              <a href="https://developer.chrome.com/docs/ai/prompt-api" target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">
                Learn more about Gemini Nano
              </a>
            </li>
            <li>This model works offline and does not require an internet connection.</li>
          </ul>
        </div>
      ) : null}
      {status === "downloadable" ? (
        <Button onClick={install}>Install Gemini Nano</Button>
      ) : null}
      {status === "downloading" ? (
        <div className="text-sm text-primary">
          Downloading Gemini Nano... {downloadprogress.toFixed(2)}%
        </div>
      ) : null}
      {status === "error" ? (
        <div className="text-sm text-destructive">
          Error checking Gemini Nano availability. Please try again later.
        </div>
      ) : null}
    </div>
  );
}