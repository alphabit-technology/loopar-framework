
'use strict';

import {loopar, BaseController} from 'loopar';
import {validatePasswordResetToken, generatePasswordResetToken, resetPassword} from "./recovery.js"
import {sendPasswordResetEmail} from "./recovery-email.js"
import {getProvider, providerKeys, providerLabel, generateState, generateCodeVerifier} from "./oauth-providers.js"
import {setOauthTx, readOauthTx, clearOauthTx, oauthRedirectUri, loadProviderConfig, parseScopes, linkUser} from "./oauth.js"

export default class AuthController extends BaseController {
  static publicActions = ['login', 'register', 'recoveryUser', 'recoveryPassword', 'logout', 'oauthCallback'];
  static actionsEnabled = ['login', 'logout', 'requestReset', 'oauthCallback'];
  
  constructor(props){
    super(props);
  }

  async publicActionLogin() {
    return await this.#makeAction('Login', async (form) => {
      const session = await form.login();

      // In-place login (web modal): no navigation, the client soft-refreshes.
      if (this.query.inModal || this.req.__WORKSPACE_NAME__ === 'web') {
        return this.success('Welcome', { user: session || null, notify: false });
      }

      // Full-page login: safe return URL if given, else land by user type.
      return this.redirect(this.#postLoginDestination(session), { hard: true });
    });
  }

  /** Validated `?redirect=` first, else landing by user type. */
  #postLoginDestination(session) {
    const webLanding = process.env.WEB_LANDING || '/';
    const back = this.#safeReturnUrl(this.query.redirect);
    if (back) return back;
    return session?.user_type === 'Web' ? webLanding : '/desk/Desk/view';
  }

  /** Anti open-redirect: same-origin absolute paths only, never /auth (would loop). */
  #safeReturnUrl(url) {
    if (typeof url !== 'string' || !url) return null;
    if (!url.startsWith('/') || url.startsWith('//')) return null;
    if (url.toLowerCase().startsWith('/auth')) return null;
    return url;
  }

  async publicActionLogout() {
    loopar.auth.logout();

    // POST (web/ajax) → stay on the current page; GET (desk link) → login.
    if (this.method === 'POST') {
      return this.success('Logged out', { notify: false });
    }
    return this.redirect('/auth/login');
  }

  async publicActionRegister() {
    return await this.#makeAction('Register');
  }

  async publicActionRecoveryUser() {
    return await this.#makeAction('Reset User');
  }

  async forgotUsername() {
    const { email } = this.body;
    const { user } = await getUsernameByEmail(email);

    if (user) {
      await sendUsernameReminderEmail(user);
    }

    return this.success('Si el correo existe, recibirás tu nombre de usuario.');
  }

  async publicActionRecoveryPasswordRequest() {
    const self = this;
    return await this.#makeAction('Reset Password Request', async () => {
      const { email } = self.body;
  
      const { ok, user, rawToken } = await generatePasswordResetToken(email);
  
      if (user && rawToken) {
        await sendPasswordResetEmail(user, rawToken);
      }
  
      return `We sent a password reset link to ${email}.`;
    });
  }

  async publicActionRecoveryPassword() {
    return await this.#makeAction('Reset Password', async () => {
      const { token, new_password } = this.body;

      try {
        await resetPassword(token, new_password);
        return this.success('Password reset successful.');
      } catch (e) {
        return this.error(e.message);
      }
    });
  }

  async publicActionValidateResetToken() {
    const { token } = this.query;
    const { valid, reason } = await validatePasswordResetToken(token);

    if (!valid) {
      return { valid: false, reason }
    }

    return  {valid: true }
  }

  /**
   * GET /auth/claim?token=<jwt> — one-time magic-link from the cloud control
   * plane. Verifies the token server→server (CLOUD_VERIFIER_URL +
   * CLOUD_VERIFIER_TOKEN, written to the tenant's .env at provisioning),
   * finds the local user by email and opens a session. Missing env vars =
   * tenant not cloud-provisioned.
   */
  async publicActionClaim() {
    const token = String(this.query?.token || '').trim();
    if (!token) {
      return this.redirect('/auth/login?claim=missing_token');
    }

    const { url: verifierUrl, token: verifierToken } = loopar.cloudVerifier;

    if (!verifierUrl || !verifierToken) {
      console.error('[auth/claim] tenant is not cloud-provisioned (missing CLOUD_VERIFIER_URL / CLOUD_VERIFIER_TOKEN)');
      return this.redirect('/auth/login?claim=not_supported');
    }

    let verifyResp;
    try {
      const r = await fetch(verifierUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Loopar-Tenant-Secret': verifierToken,
          'X-Loopar-Tenant-Id':     loopar.tenantId || '',
        },
        body: JSON.stringify({ token }),
      });
      verifyResp = await r.json();
    } catch (err) {
      // Don't log the JWT — it's user-bound; the URL is enough to debug.
      console.error('[auth/claim] verifier call failed:', err.message, verifierUrl);
      return this.redirect('/auth/login?claim=verifier_unreachable');
    }

    if (!verifyResp?.valid) {
      const reason = encodeURIComponent(verifyResp?.reason || 'invalid');
      return this.redirect(`/auth/login?claim=${reason}`);
    }

    // Usually resolves to `Administrator` (installer sets the customer's email).
    const email = String(verifyResp.email || '').trim().toLowerCase();
    if (!email) {
      return this.redirect('/auth/login?claim=no_email');
    }

    const user = await loopar.db.getDoc('User', { email });
    if (!user) {
      console.warn(`[auth/claim] no User row found for email "${email}"`);
      return this.redirect('/auth/login?claim=user_not_found');
    }

    await loopar.auth.login(user);

    // No forced /auth/set-password — the desk banner (must_change_password)
    // and Profile's "Reset by email" cover it.
    return this.redirect('/desk', { hard: true });
  }

  /**
   * POST /auth/requestReset (authenticated) — Profile's "Reset by email"
   * button; no current password needed. Always answers success to avoid
   * leaking user existence.
   */
  async actionRequestReset() {
    // `loopar.auth.user()` returns the User row's `name`; the email comes from the row.
    const name = loopar.auth?.user?.();
    if (!name) {
      return this.error('You must be logged in to reset your password.');
    }

    const user = await loopar.db.getDoc('User', { name });
    if (!user?.email) {
      return this.success('If your account has an email on file, a reset link is on its way.');
    }

    const { rawToken } = await generatePasswordResetToken(user.email);
    if (rawToken) {
      try {
        await sendPasswordResetEmail(user, rawToken);
      } catch (err) {
        console.error('[auth/requestReset] failed to send email:', err.message);
        return this.error('Could not send the reset email. Please try again in a few minutes.');
      }
    }

    return this.success(`We sent a reset link to ${user.email}.`);
  }

  /**
   * GET /auth/oauth?provider=<google|github> — starts the Authorization Code
   * flow: CSRF `state` (+ PKCE for OIDC) stashed in a signed cookie, then
   * 302 to the provider.
   */
  async publicActionOauth() {
    const providerKey = String(this.query?.provider || '').trim().toLowerCase();
    const provider = getProvider(providerKey);
    if (!provider) return this.redirect('/auth/login?oauth=unknown_provider');

    const cfg = await loadProviderConfig(providerKey);
    if (!cfg) return this.redirect('/auth/login?oauth=not_configured');

    const redirectURI = oauthRedirectUri(this.req);
    const client = provider.client(cfg, redirectURI);
    const state = generateState();
    const scopes = parseScopes(cfg.scopes) || provider.defaultScopes;

    let codeVerifier = null;
    let url;
    if (provider.usesPKCE) {
      codeVerifier = generateCodeVerifier();
      url = provider.authUrl(client, { state, codeVerifier, scopes });
    } else {
      url = provider.authUrl(client, { state, scopes });
    }

    setOauthTx({ provider: providerKey, state, codeVerifier });
    return this.redirect(url.toString(), { hard: true });
  }

  /**
   * GET /auth/oauthCallback?code&state — validates `state` against the tx
   * cookie, exchanges the code, links the verified email to a local User
   * (creates one only with allow_signup) and opens the session.
   */
  async publicActionOauthCallback() {
    const code = this.query?.code;
    const state = this.query?.state;
    const providerError = this.query?.error;
    if (providerError) {
      return this.redirect(`/auth/login?oauth=${encodeURIComponent(providerError)}`);
    }

    const tx = readOauthTx();
    clearOauthTx();

    if (!tx || !code || !state || state !== tx.state) {
      return this.redirect('/auth/login?oauth=invalid_state');
    }

    const provider = getProvider(tx.provider);
    const cfg = await loadProviderConfig(tx.provider);
    if (!provider || !cfg) return this.redirect('/auth/login?oauth=not_configured');

    const client = provider.client(cfg, oauthRedirectUri(this.req));

    let tokens;
    try {
      tokens = await provider.exchange(client, { code, codeVerifier: tx.codeVerifier });
    } catch (err) {
      console.error('[auth/oauth] code exchange failed:', err?.message);
      return this.redirect('/auth/login?oauth=exchange_failed');
    }

    let profile;
    try {
      profile = await provider.profile(tokens);
    } catch (err) {
      console.error('[auth/oauth] profile fetch failed:', err?.message);
      return this.redirect('/auth/login?oauth=profile_failed');
    }

    console.log('[auth/oauth] profile resolved:', {
      provider: tx.provider,
      email: profile?.email,
      email_verified: profile?.email_verified,
      sub: profile?.sub,
    });

    if (!profile?.email || !profile.email_verified) {
      return this.redirect('/auth/login?oauth=email_unverified');
    }

    let user, reason;
    try {
      ({ user, reason } = await linkUser(profile, cfg, tx.provider));
    } catch (err) {
      console.error('[auth/oauth] linking failed:', err?.message);
      return this.redirect('/auth/login?oauth=link_error');
    }
    console.log('[auth/oauth] link result:', { matchedUser: user?.name || null, reason: reason || null });
    if (!user) {
      return this.redirect(`/auth/login?oauth=${reason || 'login_failed'}`);
    }

    await loopar.auth.login(user);
    // System users → desk; Web users (self-signup) → website.
    const landing = user.user_type === 'Web' ? (process.env.WEB_LANDING || '/') : '/desk';
    return this.redirect(landing, { hard: true });
  }

  /**
   * POST /auth/oauthProviders (public) — enabled providers for the login-form
   * buttons; never exposes secrets.
   */
  async publicActionOauthProviders() {
    const providers = [];
    for (const key of providerKeys()) {
      try {
        const cfg = await loadProviderConfig(key);
        if (cfg) providers.push({ provider: key, label: providerLabel(key) });
      } catch (err) {
        console.error(`[auth/oauthProviders] ${key} check failed:`, err?.message);
      }
    }
    return this.success('ok', { providers, notify: false });
  }

  /**
   * POST /auth/me (public) — session display info for the website top-nav.
   * The login JWT is httpOnly, so this is the client's read-only bridge.
   */
  async publicActionMe() {
    let session = null;
    try {
      session = await loopar.auth.award();
    } catch (_e) {
      session = null;
    }

    if (!session?.name) {
      return this.success('ok', { logged: false, notify: false });
    }

    return this.success('ok', {
      logged: true,
      name: session.name,
      email: session.email,
      avatar: session.avatar,
      profile_picture: session.profile_picture || null,
      user_type: session.user_type || null,
      notify: false,
    });
  }

  async #makeAction(form, fn) {
    this.client = "form";
    form = await loopar.newDocument(form, this.data);
    if (this.hasData()) {
      return await fn(form);
    } else {
      return await this.render(await form.__meta__());
    }
  }
}