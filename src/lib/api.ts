const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string;
  primaryLanguage: string;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  commits: number;
  pullRequests: number;
  issues: number;
  contributors: number;
  dnaContribution: number;
  visibility: string;
  codeQuality: number;
  testCoverage: number;
  documentation: number;
  complexity: number;
}

interface DnaProfile {
  id: number;
  userId: number;
  score: number;
  label: string;
  strongestArea: string;
  recommendedSkill: string;
  archetype: string;
  calculatedAt: string;
}

interface Analytics {
  activityTrends: Array<{ date: string; commits: number; pullRequests: number }>;
  languageDistribution: Record<string, number>;
  qualityTrends: Array<{ month: string; quality: number }>;
  complexityAnalysis: Array<{ repo: string; complexity: number }>;
  contributionHeatmap: Array<{ date: string; count: number }>;
  collaborationStats: {
    totalPullRequests: number;
    mergedPullRequests: number;
    codeReviews: number;
    collaborators: number;
  };
}

interface Recommendation {
  id: number;
  userId: number;
  title: string;
  reason: string;
  difficulty: string;
  duration: string;
  category: string;
  matchScore: number;
  tags: string[];
}

class ApiClient {
  private token: string | null = null;
  private userId: number | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    this.userId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')!) : null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Record<string, string> rather than HeadersInit: HeadersInit is a union that
    // includes string[][] and Headers, neither of which can be index-assigned.
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.userId) {
      headers['X-User-Id'] = this.userId.toString();
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    this.token = response.token;
    this.userId = response.userId;
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.userId.toString());

    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    this.userId = response.userId;
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.userId.toString());

    return response;
  }

  logout() {
    this.token = null;
    this.userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUserId(): number | null {
    return this.userId;
  }

  async syncRepositories(githubToken: string): Promise<{ message: string }> {
    return this.request('/repositories/sync', {
      method: 'POST',
      headers: {
        'X-GitHub-Token': githubToken,
      },
    });
  }

  async getRepositories(): Promise<Repository[]> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/repositories/user/${this.userId}`);
  }

  async getDnaProfile(): Promise<DnaProfile> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/dna/user/${this.userId}`);
  }

  async calculateDna(): Promise<DnaProfile> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/dna/calculate/${this.userId}`, {
      method: 'POST',
    });
  }

  async getAnalytics(): Promise<Analytics> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/analytics/user/${this.userId}`);
  }

  async getRecommendations(): Promise<Recommendation[]> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/recommendations/user/${this.userId}`);
  }

  async generateRecommendations(): Promise<Recommendation[]> {
    if (!this.userId) throw new Error('User not authenticated');
    return this.request(`/recommendations/generate/${this.userId}`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
export type { AuthResponse, Repository, DnaProfile, Analytics, Recommendation };
