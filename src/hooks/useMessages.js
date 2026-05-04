import { useCallback, useEffect, useMemo, useRef } from "react";
import { WS_BASE_URL } from "../constants";
import { readSessionTokens } from "../lib/api";
import { api } from "../lib/api";
import { useChatStore } from "../store/useChatStore";
import {
  createEncryptedPayload,
  decryptServerMessage,
  getPeerId,
  isValidMessageText,
  normalizeSocketMessage,
} from "../utils/helpers";

export function useMessages(session) {
  const socketRef = useRef(null);
  const activePeer = useChatStore((state) => state.activePeer);
  const addMessage = useChatStore((state) => state.addMessage);
  const busy = useChatStore((state) => state.busy);
  const composerError = useChatStore((state) => state.composerError);
  const conversations = useChatStore((state) => state.conversations);
  const draft = useChatStore((state) => state.draft);
  const messages = useChatStore((state) => state.messages);
  const notice = useChatStore((state) => state.notice);
  const searchResults = useChatStore((state) => state.searchResults);
  const searchTerm = useChatStore((state) => state.searchTerm);
  const setActivePeer = useChatStore((state) => state.setActivePeer);
  const setBusy = useChatStore((state) => state.setBusy);
  const setComposerError = useChatStore((state) => state.setComposerError);
  const setConversations = useChatStore((state) => state.setConversations);
  const setDraft = useChatStore((state) => state.setDraft);
  const setMessages = useChatStore((state) => state.setMessages);
  const setNotice = useChatStore((state) => state.setNotice);
  const setSearchResults = useChatStore((state) => state.setSearchResults);
  const setSearchTerm = useChatStore((state) => state.setSearchTerm);
  const setStatus = useChatStore((state) => state.setStatus);
  const status = useChatStore((state) => state.status);

  const currentUserId = session?.user.id;
  const canSend = Boolean(activePeer && isValidMessageText(draft) && !busy);
  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (left, right) => new Date(left.created_at) - new Date(right.created_at),
      ),
    [messages],
  );

  const decryptIncoming = useCallback(
    async (message) => {
      if (!session?.privateKey || !session?.user?.id) {
        return null;
      }

      return decryptServerMessage(message, session.user.id, session.privateKey);
    },
    [session],
  );

  const loadConversations = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      const items = await api.getConversations();
      setConversations(items);
    } catch (caught) {
      setNotice(caught.message || "Could not load conversations.");
    }
  }, [session, setConversations, setNotice]);

  const loadMessages = useCallback(
    async (peer) => {
      if (!peer || !session) {
        return;
      }

      setBusy(true);
      setComposerError("");

      try {
        const serverMessages = await api.getMessages(getPeerId(peer));
        const decrypted = await Promise.all(
          serverMessages.map((message) => decryptIncoming(message)),
        );
        setMessages(decrypted.filter(Boolean));
      } catch (caught) {
        setNotice(caught.message || "Could not load messages.");
      } finally {
        setBusy(false);
      }
    },
    [
      decryptIncoming,
      session,
      setBusy,
      setComposerError,
      setMessages,
      setNotice,
    ],
  );

  const selectPeer = useCallback(
    (peer) => {
      setActivePeer(peer);
      setSearchResults([]);
      setSearchTerm("");
    },
    [setActivePeer, setSearchResults, setSearchTerm],
  );

  const sendMessage = useCallback(
    async (event) => {
      event.preventDefault();

      if (!canSend) {
        return;
      }

      setBusy(true);
      setComposerError("");

      try {
        const peerId = getPeerId(activePeer);
        const publicKeyResponse = await api.getPublicKey(peerId);
        const payload = await createEncryptedPayload(
          draft,
          publicKeyResponse.public_key,
          session.user.public_key,
        );
        const socket = socketRef.current;
        let savedMessage = null;

        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "message.send",
              to: peerId,
              payload,
            }),
          );
        } else {
          savedMessage = await api.sendMessage(peerId, payload);
        }

        if (savedMessage) {
          const decrypted = await decryptIncoming(savedMessage);
          addMessage(decrypted);
        } else {
          addMessage({
            id: crypto.randomUUID(),
            from_user_id: currentUserId,
            to_user_id: peerId,
            payload,
            delivered: false,
            created_at: new Date().toISOString(),
            plaintext: draft.trim(),
            failed: false,
          });
        }

        setDraft("");
        loadConversations();
      } catch (caught) {
        setComposerError(caught.message || "Could not send encrypted message.");
      } finally {
        setBusy(false);
      }
    },
    [
      activePeer,
      addMessage,
      canSend,
      currentUserId,
      decryptIncoming,
      draft,
      loadConversations,
      session,
      setBusy,
      setComposerError,
      setDraft,
    ],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activePeer) {
      loadMessages(activePeer);
    }
  }, [activePeer, loadMessages]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const { accessToken } = readSessionTokens();

    if (!accessToken) {
      return undefined;
    }

    const socket = new WebSocket(
      `${WS_BASE_URL}/ws?token=${encodeURIComponent(accessToken)}`,
    );
    socketRef.current = socket;
    setStatus("connecting");

    socket.addEventListener("open", () => setStatus("online"));
    socket.addEventListener("close", () => setStatus("offline"));
    socket.addEventListener("error", () => setStatus("offline"));
    socket.addEventListener("message", async (event) => {
      const message = normalizeSocketMessage(event);

      if (!message) {
        return;
      }

      const decrypted = await decryptIncoming(message);

      if (!decrypted) {
        return;
      }

      const peerId =
        message.from_user_id === currentUserId
          ? message.to_user_id
          : message.from_user_id;

      if (peerId === getPeerId(activePeer)) {
        addMessage(decrypted);
      }

      loadConversations();
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [
    activePeer,
    addMessage,
    currentUserId,
    decryptIncoming,
    loadConversations,
    session,
    setStatus,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      if (!searchTerm.trim() || !session) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await api.searchUsers(searchTerm.trim());
        setSearchResults(results.filter((user) => user.id !== currentUserId));
      } catch (caught) {
        setNotice(caught.message || "Search failed.");
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [currentUserId, searchTerm, session, setNotice, setSearchResults]);

  return {
    activePeer,
    busy,
    canSend,
    composerError,
    conversations,
    currentUserId,
    draft,
    messages: sortedMessages,
    notice,
    searchResults,
    searchTerm,
    selectPeer,
    sendMessage,
    setDraft,
    setNotice,
    setSearchTerm,
    status,
  };
}
