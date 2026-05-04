import { create } from "zustand";

export const useChatStore = create((set) => ({
  activePeer: null,
  busy: false,
  composerError: "",
  conversations: [],
  draft: "",
  messages: [],
  notice: "",
  searchResults: [],
  searchTerm: "",
  status: "offline",
  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((item) => item.id === message.id)) {
        return state;
      }

      return { messages: [...state.messages, message] };
    }),
  clearChat: () =>
    set({
      activePeer: null,
      busy: false,
      composerError: "",
      conversations: [],
      draft: "",
      messages: [],
      notice: "",
      searchResults: [],
      searchTerm: "",
      status: "offline",
    }),
  setActivePeer: (activePeer) => set({ activePeer }),
  setBusy: (busy) => set({ busy }),
  setComposerError: (composerError) => set({ composerError }),
  setConversations: (conversations) => set({ conversations }),
  setDraft: (draft) => set({ draft }),
  setMessages: (messages) => set({ messages }),
  setNotice: (notice) => set({ notice }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatus: (status) => set({ status }),
}));
