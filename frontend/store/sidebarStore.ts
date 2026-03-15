import { create } from "zustand";
import apiClient from "@/lib/apiClient";

interface Section {
  id: number;
  title: string;
  order_index: number;
  videos: any[];
}

interface SubjectTree {
  id: number;
  title: string;
  sections: Section[];
}

interface SidebarState {
  tree: SubjectTree | null;
  loading: boolean;
  error: string | null;
  fetchTree: (subjectId: string) => Promise<void>;
  markVideoCompleted: (videoId: number) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  tree: null,
  loading: false,
  error: null,
  fetchTree: async (subjectId) => {
    set({ loading: true });
    try {
      const { data } = await apiClient.get(`/subjects/${subjectId}/tree`);
      set({ tree: data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false, tree: null });
    }
  },
  markVideoCompleted: (videoId) => {
    const { tree } = get();
    if (!tree) return;
    
    // We update tree in a simplistic way and recalculate locking client-side or just refetch.
    // Deep clone tree:
    const newTree = JSON.parse(JSON.stringify(tree));
    let flattened = [];
    for (const sec of newTree.sections) {
      for (const v of sec.videos) {
        if (v.id === videoId) v.is_completed = true;
        flattened.push(v);
      }
    }
    
    for (let i = 0; i < flattened.length; i++) {
        if (i > 0) {
            flattened[i].locked = !flattened[i-1].is_completed;
        }
    }
    set({ tree: newTree });
  }
}));
