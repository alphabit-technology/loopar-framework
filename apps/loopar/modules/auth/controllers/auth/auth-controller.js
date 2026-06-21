
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
      await form.login();
      return this.redirect('/desk/Desk/view', { hard: true });
    });
  }

  async publicActionLogout() {
    loopar.auth.logout();
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
        // Possible messages: 'Link expired' / 'Invalid Link'.
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
   * GET /auth/claim?token=<jwt>
   *
   * Receives a one-time magic-link from the cloud control plane. Verifies the
   * token by calling back to the control plane (server→server, authenticated
   * by the per-tenant CLOUD_VERIFIER_TOKEN shared secret), looks up the local
   * user by email, opens a session, and lands the user in the desk.
   *
   * Configured via env (written into the tenant's .env at provisioning time):
   *   CLOUD_VERIFIER_URL    — full https URL of the verifier endpoint
   *   CLOUD_VERIFIER_TOKEN  — per-tenant random shared secret
   *
   * If either env var is missing, this tenant wasn't provisioned by the
   * cloud control plane and the endpoint shouldn't have been hit at all —
   * redirect back to login with a clear reason.
   */
  async publicActionClaim() {
    const token = String(this.query?.token || '').trim();
    if (!token) {
      return this.redirect('/auth/login?claim=missing_token');
    }

    const verifierUrl   = process.env.CLOUD_VERIFIER_URL;
    const verifierToken = process.env.CLOUD_VERIFIER_TOKEN;

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
      // Don't log the JWT — it's user-bound. The URL alone is enough to
      // debug the connectivity issue.
      console.error('[auth/claim] verifier call failed:', err.message, verifierUrl);
      return this.redirect('/auth/login?claim=verifier_unreachable');
    }

    if (!verifyResp?.valid) {
      const reason = encodeURIComponent(verifyResp?.reason || 'invalid');
      return this.redirect(`/auth/login?claim=${reason}`);
    }

    // Find the local user by email. Installer creates `Administrator` with
    // the customer's email, so this usually resolves to that row.
    const email = String(verifyResp.email || '').trim().toLowerCase();
    if (!email) {
      return this.redirect('/auth/login?claim=no_email');
    }

    const user = await loopar.db.getDoc('User', { email });
    if (!user) {
      console.warn(`[auth/claim] no User row found for email "${email}"`);
      return this.redirect('/auth/login?claim=user_not_found');
    }

    // Open a session — same code path used by the normal Login form.
    await loopar.auth.login(user);

    // Don't force `/auth/set-password` here — the desk shows a banner driven
    // by must_change_password and Profile has a "Reset by email" button.
    return this.redirect('/desk', { hard: true });
  }

  /**
   * POST /auth/requestReset   (authenticated)
   *
   * Triggered by the Profile "Reset by email" button. Doesn't require the
   * user to know their current password — they're already authenticated.
   * Sends the standard password-reset link to their email. Always returns
   * success even if the email lookup fails, to avoid leaking user existence.
   */
  async actionRequestReset() {
    // `loopar.auth.user()` returns the User row's `name` (or null) — that's
    // enough; we look up the email from the row ourselves.
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
   * GET /auth/oauth?provider=<google|github>
   *
   * Starts the social-login Authorization Code flow. Generates the CSRF `state`
   * (and PKCE verifier for OIDC providers), stashes them in a short-lived signed
   * cookie, and 302s the browser to the provider. The callback comes back to
   * this same installation (single domain → no wildcard problem).
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
   * GET /auth/oauthCallback?code=...&state=...
   *
   * Provider redirect target. Validates `state` against the transaction cookie,
   * exchanges the code for tokens, reads the verified email, links to a local
   * User (login-only by default; creates one when allow_signup is on), and
   * opens a session — same final step as password login and the claim flow.
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
    // System users → desk; Web users (e.g. self-signup) → website only.
    const landing = user.user_type === 'Web' ? (process.env.WEB_LANDING || '/') : '/desk';
    return this.redirect(landing, { hard: true });
  }

  /**
   * POST /auth/oauthProviders  (public)
   *
   * Lists the enabled + implemented providers so the login form can render the
   * matching buttons. Read-only; never exposes client secrets.
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
   * POST /auth/me  (public)
   *
   * Returns the current session's display info so the public website (top-nav)
   * can render a user menu. The login JWT is httpOnly, so the client can't read
   * it directly — this is the read-only bridge. Returns { logged:false } when
   * there's no session.
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