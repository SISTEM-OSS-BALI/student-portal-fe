"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import { getChatSocket } from "@/lib/socket";

import type { ChatMessage, ChatSendPayload } from "../models/chat";

type SocketAck = {
  ok: boolean;
  error?: string;
  message?: ChatMessage;
};

export const useChatSocket = ({
  conversation_id,
  onMessage,
}: {
  conversation_id?: string;
  onMessage?: (message: ChatMessage) => void;
}) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getChatSocket();
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleMessage = (payload: ChatMessage) => {
      onMessage?.(payload);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("message:new", handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("message:new", handleMessage);
    };
  }, [onMessage]);

  const join = useCallback(async (id: string) => {
    const socket = socketRef.current;
    if (!socket) throw new Error("Socket not connected");
    return new Promise<SocketAck>((resolve) => {
      socket.emit("join", { conversation_id: id }, (ack: SocketAck) => {
        if (!ack.ok) setLastError(ack.error ?? "join failed");
        resolve(ack);
      });
    });
  }, []);

  const leave = useCallback(async (id: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    return new Promise<SocketAck>((resolve) => {
      socket.emit("leave", { conversation_id: id }, (ack: SocketAck) => {
        resolve(ack);
      });
    });
  }, []);

  const sendMessage = useCallback(async (payload: ChatSendPayload) => {
    const socket = socketRef.current;
    if (!socket) throw new Error("Socket not connected");
    return new Promise<ChatMessage | null>((resolve, reject) => {
      socket.emit(
        "message:send",
        {
          conversation_id: payload.conversation_id,
          type: payload.type ?? "text",
          text: payload.text,
          reply_to_id: payload.reply_to_id,
          mention_user_ids: payload.mention_user_ids ?? [],
          attachments: payload.attachments ?? [],
          context_user_id: payload.context_user_id,
          context_type: payload.context_type,
        },
        (ack: SocketAck) => {
          if (!ack.ok) {
            const message = ack.error ?? "send failed";
            setLastError(message);
            reject(new Error(message));
            return;
          }
          resolve(ack.message ?? null);
        },
      );
    });
  }, []);

  const markRead = useCallback(async (id: string, at?: Date) => {
    const socket = socketRef.current;
    if (!socket) return;
    return new Promise<SocketAck>((resolve) => {
      socket.emit(
        "message:read",
        {
          conversation_id: id,
          at: at ? at.toISOString() : undefined,
        },
        (ack: SocketAck) => {
          resolve(ack);
        },
      );
    });
  }, []);

  useEffect(() => {
    if (!conversation_id) return;
    join(conversation_id).catch(() => undefined);
    return () => {
      leave(conversation_id).catch(() => undefined);
    };
  }, [conversation_id, join, leave]);

  return {
    connected,
    lastError,
    join,
    leave,
    sendMessage,
    markRead,
  };
};
