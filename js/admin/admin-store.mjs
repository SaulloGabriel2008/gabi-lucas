import {
  loadAdminProfile,
  loadSiteSettings,
  loginAdmin,
  logoutAdmin,
  observeAuthState
} from "../firebase/client.mjs";
import { mergeDeep } from "../ui/shared-ui.mjs";
import { defaultSiteConfig } from "../config/site-config.mjs";

/**
 * Centralized admin state and data subscriptions.
 * Uses a snapshot approach — all writes go through applyBatch()
 * so render triggers only once per microtask.
 */

const DEFAULT_CONFIG = buildMergedConfig();

function buildMergedConfig(override) {
  return mergeLean(defaultSiteConfig, override || {});
}

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function mergeLean(base, override) {
  if (isPlainObject(override)) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
      result[key] = (key in base)
        ? mergeLean(base[key], override[key])
        : override[key];
    }
    return result;
  }
  return override !== undefined ? override : base;
}

class AdminStore {
  constructor() {
    this._listeners = new Set();
    this._families = [];
    this._gifts = [];
    this._tables = [];
    this._user = null;
    this._adminProfile = null;
    this._authenticated = false;
    this._config = { ...DEFAULT_CONFIG };
    this._unsubscribeFamilies = null;
    this._unsubscribeGifts = null;
    this._unsubscribeTables = null;
    this._pendingFlag = false;
  }

  get families()   { return this._families; }
  get gifts()      { return this._gifts; }
  get tables()     { return this._tables; }
  get user()       { return this._user; }
  get adminProfile(){ return this._adminProfile; }
  get config()     { return this._config; }
  get isAuthenticated() { return this._authenticated; }

  getAllGuests() {
    return this._families.flatMap((family) => {
      return (family.guests || []).map((guest) => ({
        ...guest,
        familyId: family.id,
        familyName: family.familyName || ""
      }));
    });
  }

  getConfirmedGuests() {
    return this.getAllGuests()
      .filter((guest) => guest.responseStatus === "confirmed")
      .sort((a, b) => a.guestName.localeCompare(b.guestName));
  }

  getTableCaption(tableId) {
    const t = this._tables.find((item) => item.id === tableId);
    if (!tableId) return "Sem mesa";
    return t ? t.name : "Mesa removida";
  }

  resolveFamilyById(id) {
    return this._families.find((family) => family.id === id) || null;
  }

  scheduleRender() {
    if (this._pendingFlag) return;
    this._pendingFlag = true;
    queueMicrotask(() => {
      this._pendingFlag = false;
      const state = {
        families: this._families,
        gifts: this._gifts,
        tables: this._tables,
        config: this._config,
        user: this._user,
        adminProfile: this._adminProfile,
        isAuthenticated: this._authenticated
      };
      for (const fn of this._listeners) {
        fn(state);
      }
    });
  }

  /**
   * Update one slice of state and trigger one consolidated render.
   */
  applyBatch(patch) {
    Object.assign(this, patch);
    this.scheduleRender();
  }

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /* ── Auth ─────────────────────────────────────────── */

  async login(email, password) {
    return loginAdmin(String(email).trim(), String(password));
  }

  async logout() {
    await logoutAdmin();
    this.stopSubscriptions();
    this._user = null;
    this._adminProfile = null;
    this._authenticated = false;
    this._families = [];
    this._gifts = [];
    this._tables = [];
    this.scheduleRender();
  }

  async syncUser(user) {
    if (!user) {
      await this.logout();
      return null;
    }
    this._user = user;
    try {
      const profile = await loadAdminProfile(user);
      if (!profile?.active) {
        await this.logout();
        return null;
      }
      this._adminProfile = profile;
      this._authenticated = true;
      return profile;
    } catch {
      await this.logout();
      return null;
    }
  }

  /* ── Subscriptions ────────────────────────────────── */

  startSubscriptions() {
    if (this._unsubscribeFamilies) return; // already running

    this._unsubscribeFamilies = this._createFamiliesSubscription();
    this._unsubscribeGifts = this._createGiftSubscription();
    this._unsubscribeTables = this._createTableSubscription();
  }

  stopSubscriptions() {
    this._unsubscribeFamilies?.();
    this._unsubscribeGifts?.();
    this._unsubscribeTables?.();
    this._unsubscribeFamilies = null;
    this._unsubscribeGifts = null;
    this._unsubscribeTables = null;
  }

  _createFamiliesSubscription() {
    const { subscribeFamilies } = requireClient();
    return subscribeFamilies(
      (families) => this.applyBatch({ _families: families }),
      () => console.error("[store] families subscription error")
    );
  }

  _createGiftSubscription() {
    const { subscribeGiftItems } = requireClient();
    return subscribeGiftItems(
      (gifts) => this.applyBatch({ _gifts: gifts }),
      () => console.error("[store] gifts subscription error")
    );
  }

  _createTableSubscription() {
    const { subscribeTables } = requireClient();
    return subscribeTables(
      (tables) => this.applyBatch({ _tables: tables }),
      () => console.error("[store] tables subscription error")
    );
  }

  /* ── Settings ─────────────────────────────────────── */

  async loadRemoteSettings() {
    try {
      const remote = await loadSiteSettings();
      this._config = buildMergedConfig(remote);
      this.scheduleRender();
    } catch {
      this._config = buildMergedConfig();
    }
  }
}

/* Dynamic import to avoid circular dependency warning */
let clientModule = null;
function requireClient() {
  if (!clientModule) throw new Error("Client module not loaded — call setClientModule() first.");
  return clientModule;
}
export function setClientModule(mod) { clientModule = mod; }

export const adminStore = new AdminStore();
