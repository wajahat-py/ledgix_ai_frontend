"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/services/api";
import { useAppSocket } from "./useAppSocket";
import type { AppNotification, NotificationsResponse } from "@/types/notification";

export function useNotifications() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get<NotificationsResponse>("/api/notifications/");
            setNotifications(data.results);
            setUnreadCount(data.unread_count);
        } catch { /* non-fatal */ }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Real-time push: prepend new notification when it arrives over WebSocket.
    useAppSocket("notification", (raw) => {
        const notif = raw as unknown as AppNotification;
        setNotifications((prev) => [notif, ...prev].slice(0, 20));
        setUnreadCount((n) => n + 1);
    });

    const markAllRead = useCallback(async () => {
        try {
            await api.post("/api/notifications/mark-read/");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* non-fatal */ }
    }, []);

    return { notifications, unreadCount, markAllRead };
}
