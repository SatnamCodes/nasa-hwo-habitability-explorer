export interface FindingMeta {
  filename: string;
  title: string;
  sections: string[];
  size: number;
  path: string;
}

export interface FindingSearchResultItem {
  filename: string;
  title: string;
  snippets: string[];
  sections: string[];
}

export interface FindingSearchResult {
  query: string;
  matches: number;
  results: FindingSearchResultItem[];
}

class FindingsService {
  baseUrl: string;
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  }
  async list(): Promise<FindingMeta[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/findings/list`);
    if (!res.ok) throw new Error(`Failed to list findings: ${res.status}`);
    const data = await res.json();
    return data.findings || [];
  }
  async search(q: string): Promise<FindingSearchResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/findings/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    return res.json();
  }
  async raw(filename: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/findings/raw/${filename}`);
    if (!res.ok) throw new Error(`Failed to fetch raw: ${res.status}`);
    const data = await res.json();
    return data.content;
  }
}

export const findingsService = new FindingsService();
