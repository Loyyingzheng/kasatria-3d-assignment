/** One small module owns session state; access tokens are memory-only. */
export function createSessionStore() {
  let state = Object.freeze({
    accessToken: '', expiresAt: 0, tokenClient: null,
    preview: false, busy: false, profile: null,
  });
  return Object.freeze({
    get: () => state,
    set: (patch) => { state = Object.freeze({ ...state, ...patch }); return state; },
    reset: () => {
      state = Object.freeze({ accessToken: '', expiresAt: 0, tokenClient: null, preview: false, busy: false, profile: null });
      return state;
    },
  });
}
