'use strict';

import React, {useImperativeHandle, useEffect, useState} from 'react';
import AuthContext from '@context/auth-context';
import {useNavigate} from 'react-router';
import loopar from 'loopar';

/** Inline brand logos, keyed by provider. Avoids any icon-package dependency. */
const ProviderIcons = {
  google: (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  ),
  github: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56v-2.1c-3.34.71-4.04-1.6-4.04-1.6-.55-1.36-1.34-1.72-1.34-1.72-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.3-5.47-5.8 0-1.28.47-2.33 1.24-3.15-.12-.3-.54-1.5.12-3.12 0 0 1.01-.32 3.3 1.2a11.6 11.6 0 0 1 6 0c2.29-1.52 3.3-1.2 3.3-1.2.66 1.62.24 2.82.12 3.12.77.82 1.24 1.87 1.24 3.15 0 4.51-2.81 5.5-5.49 5.79.43.36.81 1.09.81 2.2v3.26c0 .31.21.68.83.56A12.02 12.02 0 0 0 24 12.29C24 5.78 18.63.5 12 .5z" />
    </svg>
  ),
  apple: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M16.36 12.78c.03 3.13 2.75 4.17 2.78 4.18-.02.07-.43 1.49-1.43 2.95-.86 1.27-1.76 2.53-3.18 2.55-1.39.03-1.84-.82-3.43-.82-1.59 0-2.09.8-3.41.85-1.37.05-2.41-1.37-3.28-2.63-1.78-2.58-3.14-7.3-1.31-10.48.91-1.58 2.53-2.58 4.29-2.6 1.35-.03 2.62.92 3.43.92.8 0 2.36-1.13 3.98-.96.68.03 2.58.27 3.8 2.07-.1.06-2.27 1.33-2.24 3.95M13.77 3.5c.72-.87 1.2-2.08 1.07-3.28-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.59 3.03-1.46" />
    </svg>
  ),
};

/**
 * Social-login buttons. Self-contained: asks the Auth controller which
 * providers are enabled and renders a styled button (with brand logo) per
 * provider. Renders nothing when none are configured.
 */
function OAuthButtons() {
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch('/auth/oauthProviders', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then((r) => r.json())
      .then((d) => { if (alive) setProviders(Array.isArray(d?.providers) ? d.providers : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!providers.length) return null;

  return (
    <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.55, fontSize: '0.8rem' }}>
        <span style={{ flex: 1, height: 1, background: 'currentColor', opacity: 0.25 }} />
        or
        <span style={{ flex: 1, height: 1, background: 'currentColor', opacity: 0.25 }} />
      </div>
      {providers.map((p) => (
        <a
          key={p.provider}
          href={`/auth/oauth?provider=${encodeURIComponent(p.provider)}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.6rem 1rem',
            border: '1px solid rgba(127,127,127,0.35)',
            borderRadius: '0.6rem',
            background: 'transparent',
            color: 'inherit',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          {ProviderIcons[p.provider] || null}
          <span>Continue with {p.label}</span>
        </a>
      ))}
    </div>
  );
}

function Login(props){
  const {children, ref} = props;
  const navigate = useNavigate();

  const afterLogin = async () => {
    if (props.inModal) {
      // In-place login: close the modal and flip the session reactively
      // (chrome + comment form switch to logged-in) WITHOUT reloading the
      // document, so anything the user already typed (e.g. a draft comment)
      // is preserved.
      props.onClose?.();
      loopar.emit('auth:changed');
      return;
    }
    // Full-page login: the server returns a hard redirect to the right place
    // (?redirect= or user-type landing); http handles the navigation.
  };

  useImperativeHandle(ref, () => ({
    afterLogin: afterLogin
  }));

  useEffect(() => {
    // Normalize to /auth/login WITHOUT stripping the ?redirect= return URL.
    if (props.inModal) return;
    if (window.location.pathname !== '/auth/login') {
      navigate('/auth/login' + window.location.search, {replace: true});
    }
  }, []);

  return children
}

export default class LoginForm extends AuthContext {
  controller = "Auth";

  constructor(props) {
    super(props);
    this.afterLogin = React.createRef();
  }

  async login() {
    await this.send({
      action: 'login',
      query: this.props.inModal ? { inModal: 1 } : {},
      error: () => {
        setTimeout(() => {
          this.setError("user_name", { message: "Invalid user name or password" });
          this.setError("password", { message: "Invalid user name or password" });
        }, 10);
      },
      success: () => {
        this.afterLogin.current.afterLogin();
      }
    });
  }

  getFormValues() {
    return {
      user_name: this.user_name,
      password: this.password,
    }
  }

  render() {
    return (
      <Login ref={this.afterLogin} {...this.props}>
        {super.render()}
        <OAuthButtons />
      </Login>
    )
  }

  /* makeEvents() {
    super.makeEvents();

    this.formFields.user_name.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0) {
          this.formFields.password.focus();
        } else if (this.formFields.password.val().length == 0) {
          this.formFields.password.focus();
        } else {
          this.login();
        }
      }
    });

    this.formFields.password.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0 || this.formFields.user_name.val().length == 0) {
          this.formFields.user_name.focus();
        } else {
          this.login();
        }
      }
    });
  } */
}