import { useState, useEffect, useRef, useCallback } from 'react';
import loopar from 'loopar';

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let providerPromise = null;
let turnstileScriptPromise = null;
let altchaImportPromise = null;

function resolveProvider() {
  providerPromise ||= (async () => {
    try {
      const r = await loopar.call('Altcha', 'challenge');
      if (r?.challenge) return { mode: 'altcha', firstChallenge: r.challenge };
    } catch (e) { /* Altcha is not integrated */ }

    try {
      const r = await loopar.call('Turnstile', 'siteKey');
      if (r?.site_key) return { mode: 'turnstile', siteKey: r.site_key };
    } catch (e) { /* Turnstile is no integrated */ }

    return { mode: 'none' };
  })();
  return providerPromise;
}

function loadAltcha() {
  altchaImportPromise ||= import('altcha');
  return altchaImportPromise;
}

function loadTurnstileScript() {
  turnstileScriptPromise ||= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    let script = document.querySelector(`script[src="${TURNSTILE_SRC}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = TURNSTILE_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const started = Date.now();
    const poll = setInterval(() => {
      if (window.turnstile) {
        clearInterval(poll);
        resolve(window.turnstile);
      } else if (Date.now() - started > 15000) {
        clearInterval(poll);
        turnstileScriptPromise = null;
        reject(new Error('Turnstile script timeout'));
      }
    }, 100);

    script.addEventListener('error', () => {
      clearInterval(poll);
      turnstileScriptPromise = null;
      reject(new Error('Turnstile script failed to load'));
    });
  });
  return turnstileScriptPromise;
}

export function useCaptcha() {
  const [slotEl, setSlotEl] = useState(null);
  const refCb = useCallback((node) => setSlotEl(node), []);
  const turnstileIdRef = useRef(null);
  const altchaElRef = useRef(null);
  const firstChallengeRef = useRef(null);
  const [mode, setMode] = useState(null); // null (resolving) | 'none' | 'altcha' | 'turnstile'
  const [siteKey, setSiteKey] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    let cancelled = false;
    resolveProvider().then((p) => {
      if (cancelled) return;
      if (p.mode === 'altcha') firstChallengeRef.current = p.firstChallenge;
      if (p.mode === 'turnstile') setSiteKey(p.siteKey);
      setMode(p.mode);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (mode !== 'altcha' || !slotEl) return;

    let cancelled = false;
    let el = null;
    let onState = null;

    setToken('');

    (async () => {
      try {
        await loadAltcha();

        let challenge = firstChallengeRef.current;
        firstChallengeRef.current = null;
        if (!challenge) {
          const r = await loopar.call('Altcha', 'challenge');
          challenge = r?.challenge;
        }
        if (cancelled || !challenge || !slotEl.isConnected) return;

        el = document.createElement('altcha-widget');
        el.setAttribute('name', 'altcha');
        el.setAttribute('auto', 'onload');
        el.setAttribute('challenge', JSON.stringify(challenge));
        el.setAttribute('configuration', JSON.stringify({ debug: true }));
        onState = (ev) => {
          const state = ev?.detail?.state;
          if (state === 'verified') {
            const payload = ev?.detail?.payload || el.querySelector('input[name="altcha"]')?.value || '';
            setToken(payload);
          } else if (state === 'error' || state === 'expired' || state === 'unverified') {
            setToken('');
          }
        };
        el.addEventListener('statechange', onState);
        el.addEventListener('verified', onState);
        slotEl.appendChild(el);
        altchaElRef.current = el;

        if (!window.isSecureContext) {
          console.warn('[captcha-widget] NOT a secure context — ALTCHA requires HTTPS or localhost; verification will always fail here.');
        }
      } catch (err) {
        console.warn('[captcha-widget] altcha init failed:', err.message);
      }
    })();

    return () => {
      cancelled = true;
      if (el) {
        if (onState) {
          el.removeEventListener('statechange', onState);
          el.removeEventListener('verified', onState);
        }
        el.remove();
      }
      altchaElRef.current = null;
    };
  }, [mode, slotEl]);

  useEffect(() => {
    if (mode !== 'turnstile' || !siteKey || !slotEl) return;

    let cancelled = false;
    setToken('');
    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || turnstileIdRef.current !== null || !slotEl.isConnected) return;
        turnstileIdRef.current = turnstile.render(slotEl, {
          sitekey: siteKey,
          callback: (t) => setToken(t),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken('')
        });
      })
      .catch((err) => console.warn('[captcha-widget]', err.message));

    return () => {
      cancelled = true;
      if (turnstileIdRef.current !== null && window.turnstile) {
        try { window.turnstile.remove(turnstileIdRef.current); } catch (e) { /* noop */ }
        turnstileIdRef.current = null;
      }
    };
  }, [mode, siteKey, slotEl]);

  const reset = useCallback(() => {
    setToken('');

    if (turnstileIdRef.current !== null && window.turnstile) {
      try { window.turnstile.reset(turnstileIdRef.current); } catch (e) { /* noop */ }
      return;
    }

    const el = altchaElRef.current;
    if (el) {
      loopar.call('Altcha', 'challenge')
        .then((r) => {
          if (!r?.challenge || !altchaElRef.current) return;
          try {
            altchaElRef.current.setAttribute('challenge', JSON.stringify(r.challenge));
            altchaElRef.current.reset?.();
          } catch (e) {}
        })
        .catch(() => {});
    }
  }, []);

  const required = mode === 'altcha' || mode === 'turnstile';

  return {
    ref: refCb,
    token,
    required,
    ready: !required || !!token,
    reset
  };
}

export function CaptchaSlot({ captcha, className = '' }) {
  if (!captcha?.required) return null;
  return <div ref={captcha.ref} className={`captcha-slot ${className}`.trim()} />;
}
