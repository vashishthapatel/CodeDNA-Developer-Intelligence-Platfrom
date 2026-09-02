/**
 * Optional Spring-backend facade.
 *
 * The dashboard itself no longer goes through here — it reads GitHub directly in
 * the browser (see `github.ts` → `githubProfile.ts` → `ProfileContext.tsx`), so a
 * fresh clone works without Docker, Postgres or the five services in `backend/`.
 *
 * This module survives as the seam for the backend in `backend/`: when it is
 * running, `syncRepositories` hands it the GitHub token so it can persist and
 * re-analyse server-side. The mock data path that used to live here is gone —
 * that flag was why the dashboard showed a stranger's numbers.
 */

import { apiClient } from './api';
import { loadProfile } from './githubProfile';
import { getToken } from './github';
import type { Profile } from './githubProfile';

export const dataService = {
  /** The whole dashboard in one object, read live from GitHub. */
  async getProfile(): Promise<Profile> {
    const token = getToken();
    if (!token) throw new Error('No GitHub token — connect an account first.');
    return loadProfile(token);
  },

  isAuthenticated(): boolean {
    return !!getToken();
  },

  /* ---- backend-only operations, no-ops until `backend/` is running --------- */

  async syncRepositories(githubToken: string) {
    return apiClient.syncRepositories(githubToken);
  },

  async refreshAnalytics() {
    await apiClient.calculateDna();
    return apiClient.generateRecommendations();
  },
};
