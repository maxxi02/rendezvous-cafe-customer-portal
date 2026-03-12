"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL || "https://rendezvous-server-gpmv.onrender.com";

const HEARTBEAT_INTERVAL = 30000;          // 30 seconds
const ACTIVITY_DEBOUNCE = 5000;            // 5 seconds
const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserStatusUpdate {
    userId: string;
    isOnline: boolean;
    lastSeen: Date;
}

export interface UserActivityUpdate {
    userId: string;
    lastSeen: Date;
}

export interface AttendanceApprovedData {
    attendanceId: string;
    userId: string;
    status: string;
    totalHours?: number;
    approvedBy: string;
}

export interface AttendanceRejectedData {
    attendanceId: string;
    userId: string;
    status: string;
    rejectionReason: string;
    rejectedBy: string;
}

export interface AttendanceStatusChangedData {
    attendanceId: string;
    userId: string;
    status: string;
}

export interface CustomerOrderItem {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    description?: string;
    category?: string;
    menuType?: 'food' | 'drink';
    imageUrl?: string;
    ingredients: Array<{ name: string; quantity: string; unit: string }>;
}

export interface CustomerOrder {
    orderId: string;
    customerName: string;
    items: CustomerOrderItem[];
    orderNote?: string;
    orderType: 'dine-in' | 'takeaway';
    tableNumber?: string;
    subtotal: number;
    total: number;
    timestamp: Date;
}

export interface OrderSubmittedPayload {
    orderId: string;
    orderNumber: string;
    queueStatus: string;
}

export interface OrderStatusChangedPayload {
    orderId: string;
    orderNumber: string;
    queueStatus: string;
}


// ─── Context ──────────────────────────────────────────────────────────────────

interface SocketContextValue {
    socket: Socket | null;
    isConnected: boolean;
    isActive: boolean;

    // ─── Presence ────────────────────────────────────────────────
    emitOnline: () => void;
    emitActivity: () => void;

    // ─── Status listeners ─────────────────────────────────────────
    onStatusChanged: (cb: (data: UserStatusUpdate) => void) => void;
    offStatusChanged: (cb?: (data: UserStatusUpdate) => void) => void;
    onActivityUpdated: (cb: (data: UserActivityUpdate) => void) => void;
    offActivityUpdated: (cb?: (data: UserActivityUpdate) => void) => void;

    // ─── Attendance listeners ─────────────────────────────────────
    onAttendanceApproved: (cb: (data: AttendanceApprovedData) => void) => void;
    offAttendanceApproved: (cb?: (data: AttendanceApprovedData) => void) => void;
    onAttendanceRejected: (cb: (data: AttendanceRejectedData) => void) => void;
    offAttendanceRejected: (cb?: (data: AttendanceRejectedData) => void) => void;
    onAttendanceStatusChanged: (cb: (data: AttendanceStatusChangedData) => void) => void;
    offAttendanceStatusChanged: (cb?: (data: AttendanceStatusChangedData) => void) => void;

    // ─── Order emitters ───────────────────────────────────────────
    emitPosJoin: () => void;
    emitCustomerOrder: (order: CustomerOrder) => void;
    emitCustomerMarkDone: (orderId: string) => void;

    // ─── Order listeners ──────────────────────────────────────────
    onNewCustomerOrder: (cb: (order: CustomerOrder) => void) => void;
    offNewCustomerOrder: (cb?: (order: CustomerOrder) => void) => void;
    onOrderSubmitted: (cb: (data: OrderSubmittedPayload) => void) => void;
    offOrderSubmitted: (cb?: (data: OrderSubmittedPayload) => void) => void;
    onOrderStatusChanged: (cb: (data: OrderStatusChangedPayload) => void) => void;
    offOrderStatusChanged: (cb?: (data: OrderStatusChangedPayload) => void) => void;
}

const SocketContext = createContext<SocketContextValue>({
    socket: null,
    isConnected: false,
    isActive: true,
    emitOnline: () => { },
    emitActivity: () => { },
    onStatusChanged: () => { },
    offStatusChanged: () => { },
    onActivityUpdated: () => { },
    offActivityUpdated: () => { },
    onAttendanceApproved: () => { },
    offAttendanceApproved: () => { },
    onAttendanceRejected: () => { },
    offAttendanceRejected: () => { },
    onAttendanceStatusChanged: () => { },
    offAttendanceStatusChanged: () => { },
    emitPosJoin: () => { },
    emitCustomerOrder: () => { },
    emitCustomerMarkDone: () => { },
    onNewCustomerOrder: () => { },
    offNewCustomerOrder: () => { },
    onOrderSubmitted: () => { },
    offOrderSubmitted: () => { },
    onOrderStatusChanged: () => { },
    offOrderStatusChanged: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface SocketProviderProps {
    children: ReactNode;
    userId?: string;
    userName: string;
    userAvatar?: string;
    sessionId?: string; // optional: customer portal passes this so the socket joins session:{sessionId}
}

export function SocketProvider({
    children,
    userId,
    userName,
    userAvatar,
    sessionId,
}: SocketProviderProps) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const activityDebounceRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Socket Connection ────────────────────────────────────────
    useEffect(() => {
        // Require a userId to connect. Guests now have a real Better Auth session
        // via the anonymous plugin, so they will pass this check.
        if (!userId) return;

        const socket = io(SOCKET_URL, {
            auth: { userId, userName, userAvatar },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        const joinSessionRoom = () => {
            // Always join the socket's own ID room so status updates can reach this client
            socket.emit("session:join", { sessionId: socket.id });
            // Also join named session room if provided
            if (sessionId) {
                socket.emit("session:join", { sessionId });
                console.log("📦 Joined named session room:", sessionId);
            }
            console.log("📦 Joined socket session room:", socket.id);
        };

        socket.on("connect", () => {
            setIsConnected(true);
            if (userId) socket.emit("user:online");
            joinSessionRoom();
            console.log("✅ Connected to Socket.IO server:", socket.id);
        });

        socket.on("disconnect", (reason) => {
            setIsConnected(false);
            console.log("🔌 Disconnected:", reason);
            if (reason === "io server disconnect") {
                socket.connect();
            }
        });

        socket.on("reconnect", (attemptNumber) => {
            setIsConnected(true);
            if (userId) socket.emit("user:online");
            joinSessionRoom(); // Re-join after reconnect
            console.log("🔄 Reconnected after", attemptNumber, "attempts");
        });

        socket.on("connect_error", (error) => console.error("❌ Connection error:", error.message));
        socket.on("reconnect_attempt", (n) => console.log("🔄 Reconnection attempt", n));
        socket.on("reconnect_error", (error) => console.error("❌ Reconnection error:", error.message));
        socket.on("reconnect_failed", () => console.error("❌ Reconnection failed"));
        socket.on("error", (error) => console.error("❌ Socket error:", error));

        // ─── Heartbeat ───────────────────────────────────────────
        heartbeatRef.current = setInterval(() => {
            if (socket.connected) socket.emit("user:activity");
        }, HEARTBEAT_INTERVAL);

        // ─── Page Visibility ─────────────────────────────────────
        const handleVisibilityChange = () => {
            if (!document.hidden && socket.connected) {
                if (userId) socket.emit("user:online");
                joinSessionRoom();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            socket.disconnect();
            socket.removeAllListeners();
            socketRef.current = null;
        };
    }, [userId, userName, userAvatar, sessionId]);

    // ─── Activity Tracking ────────────────────────────────────────
    useEffect(() => {
        const handleActivity = () => {
            setIsActive(true);

            if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
            activityDebounceRef.current = setTimeout(() => {
                if (socketRef.current?.connected) {
                    socketRef.current.emit("user:activity");
                }
            }, ACTIVITY_DEBOUNCE);

            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            activityTimeoutRef.current = setTimeout(() => {
                setIsActive(false);
            }, INACTIVITY_TIMEOUT);
        };

        window.addEventListener("mousemove", handleActivity, { passive: true });
        window.addEventListener("keydown", handleActivity, { passive: true });
        window.addEventListener("click", handleActivity, { passive: true });
        window.addEventListener("scroll", handleActivity, { passive: true });
        window.addEventListener("touchstart", handleActivity, { passive: true });

        handleActivity();

        return () => {
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
            window.removeEventListener("scroll", handleActivity);
            window.removeEventListener("touchstart", handleActivity);
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
            if (activityDebounceRef.current) clearTimeout(activityDebounceRef.current);
        };
    }, []);

    // ─── Emitters ─────────────────────────────────────────────────

    const emitOnline = () => {
        if (socketRef.current?.connected) socketRef.current.emit("user:online");
    };
    const emitActivity = () => {
        if (socketRef.current?.connected) socketRef.current.emit("user:activity");
    };
    // ─── Listeners ────────────────────────────────────────────────

    const onStatusChanged = (cb: (data: UserStatusUpdate) => void) =>
        socketRef.current?.on("user:status:changed", cb);
    const offStatusChanged = (cb?: (data: UserStatusUpdate) => void) =>
        socketRef.current?.off("user:status:changed", cb);

    const onActivityUpdated = (cb: (data: UserActivityUpdate) => void) =>
        socketRef.current?.on("user:activity:updated", cb);
    const offActivityUpdated = (cb?: (data: UserActivityUpdate) => void) =>
        socketRef.current?.off("user:activity:updated", cb);

    const onAttendanceApproved = (cb: (data: AttendanceApprovedData) => void) =>
        socketRef.current?.on("attendance:approved", cb);
    const offAttendanceApproved = (cb?: (data: AttendanceApprovedData) => void) =>
        socketRef.current?.off("attendance:approved", cb);

    const onAttendanceRejected = (cb: (data: AttendanceRejectedData) => void) =>
        socketRef.current?.on("attendance:rejected", cb);
    const offAttendanceRejected = (cb?: (data: AttendanceRejectedData) => void) =>
        socketRef.current?.off("attendance:rejected", cb);

    const onAttendanceStatusChanged = (cb: (data: AttendanceStatusChangedData) => void) =>
        socketRef.current?.on("attendance:status:changed", cb);
    const offAttendanceStatusChanged = (cb?: (data: AttendanceStatusChangedData) => void) =>
        socketRef.current?.off("attendance:status:changed", cb);


    const emitPosJoin = () =>
        socketRef.current?.emit('pos:join');

    const emitCustomerOrder = (order: CustomerOrder) => {
        const socket = socketRef.current;
        if (!socket) return;
        // Inject socket.id as sessionId so the server can route status updates back
        const orderWithSession = {
            ...order,
            sessionId: socket.id,
        };
        socket.emit('order:submit', orderWithSession);
    };

    const emitCustomerMarkDone = (orderId: string) => {
        socketRef.current?.emit('order:customer:done', { orderId });
    };

    const onNewCustomerOrder = (cb: (order: CustomerOrder) => void) =>
        socketRef.current?.on('order:new', cb);

    const offNewCustomerOrder = (cb?: (order: CustomerOrder) => void) =>
        socketRef.current?.off('order:new', cb);

    const onOrderSubmitted = (cb: (data: OrderSubmittedPayload) => void) =>
        socketRef.current?.on('order:submitted', cb);
    const offOrderSubmitted = (cb?: (data: OrderSubmittedPayload) => void) =>
        socketRef.current?.off('order:submitted', cb);

    const onOrderStatusChanged = (cb: (data: OrderStatusChangedPayload) => void) =>
        socketRef.current?.on('order:status:changed', cb);
    const offOrderStatusChanged = (cb?: (data: OrderStatusChangedPayload) => void) =>
        socketRef.current?.off('order:status:changed', cb);

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                isConnected,
                isActive,
                emitOnline,
                emitActivity,
                onStatusChanged,
                offStatusChanged,
                onActivityUpdated,
                offActivityUpdated,
                onAttendanceApproved,
                offAttendanceApproved,
                onAttendanceRejected,
                offAttendanceRejected,
                onAttendanceStatusChanged,
                offAttendanceStatusChanged,
                emitPosJoin,
                emitCustomerOrder,
                emitCustomerMarkDone,
                onNewCustomerOrder,
                offNewCustomerOrder,
                onOrderSubmitted,
                offOrderSubmitted,
                onOrderStatusChanged,
                offOrderStatusChanged,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    return useContext(SocketContext);
}