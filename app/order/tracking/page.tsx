"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
    Clock,
    ChefHat,
    CheckCircle,
    Package,
    MessageSquare,
    ArrowLeft,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { QueueStatus } from "@/app/types/order.type";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.SOCKET_URL ||
    "https://rendezvous-server-gpmv.onrender.com";

const QUEUE_STEPS: { status: QueueStatus; label: string; icon: typeof Clock }[] = [
    { status: "paid", label: "Payment Confirmed", icon: CheckCircle },
    { status: "preparing", label: "Preparing", icon: ChefHat },
    { status: "ready", label: "Ready for Pickup", icon: Package },
    { status: "served", label: "Served", icon: CheckCircle },
];

function TrackingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const socketRef = useRef<Socket | null>(null);

    const [currentStatus, setCurrentStatus] = useState<QueueStatus>("pending_payment");
    const [orderNumber, setOrderNumber] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;

        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        // Retrieve session data
        const sessionData = sessionStorage.getItem("orderSession");
        const sessionId = sessionData
            ? JSON.parse(sessionData).sessionId
            : undefined;

        if (sessionId) {
            socket.emit("table:session:join", { sessionId });
        }

        // Fetch order status
        socket.emit("order:get", { orderId });
        socket.on("order:get:result", (order: any) => {
            setCurrentStatus(order.queueStatus || "pending_payment");
            setOrderNumber(order.orderNumber || "");
            setIsLoading(false);
        });

        // Listen for status changes
        socket.on(
            "order:status:changed",
            (data: { orderId: string; queueStatus: QueueStatus; orderNumber?: string }) => {
                if (data.orderId === orderId) {
                    setCurrentStatus(data.queueStatus);
                    if (data.orderNumber) setOrderNumber(data.orderNumber);
                }
            },
        );

        socket.on("order:payment:success", (data: { orderId: string; queueStatus: QueueStatus }) => {
            if (data.orderId === orderId) {
                setCurrentStatus(data.queueStatus);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [orderId]);

    const currentStepIndex = QUEUE_STEPS.findIndex(
        (s) => s.status === currentStatus,
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-white/30 text-sm">
                    Loading order status...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-md mx-auto pt-8">
                {/* Back */}
                <button
                    onClick={() => router.push("/menu")}
                    className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider mb-8 hover:text-white/60 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Menu
                </button>

                {/* Order Info */}
                <div className="text-center mb-10">
                    <h1 className="text-white font-black text-3xl">Order {orderNumber}</h1>
                    <p className="text-white/40 text-xs uppercase tracking-widest mt-2">
                        {currentStatus === "pending_payment"
                            ? "Awaiting Payment"
                            : currentStatus === "completed"
                                ? "Order Complete!"
                                : "Tracking your order"}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-0 mb-10">
                    {QUEUE_STEPS.map((step, index) => {
                        const isComplete = currentStepIndex >= index;
                        const isCurrent = currentStepIndex === index;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.status} className="flex items-start gap-4">
                                {/* Line + Circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCurrent
                                                ? "bg-primary text-background shadow-lg shadow-primary/30 scale-110"
                                                : isComplete
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-white/5 text-white/20"
                                            }`}
                                    >
                                        <StepIcon className="w-5 h-5" />
                                    </div>
                                    {index < QUEUE_STEPS.length - 1 && (
                                        <div
                                            className={`w-0.5 h-12 transition-colors duration-500 ${isComplete ? "bg-primary/40" : "bg-white/10"
                                                }`}
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <div className="pt-2">
                                    <p
                                        className={`font-bold text-sm transition-colors ${isCurrent
                                                ? "text-primary"
                                                : isComplete
                                                    ? "text-white"
                                                    : "text-white/20"
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-white/40 text-xs mt-0.5 animate-pulse">
                                            In progress...
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Completed State */}
                {currentStatus === "completed" && (
                    <div className="text-center bg-primary/10 border border-primary/20 rounded-2xl p-6">
                        <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
                        <p className="text-white font-bold">Order Complete!</p>
                        <p className="text-white/50 text-sm mt-1">
                            Thank you for ordering with us.
                        </p>
                    </div>
                )}

                {/* Pending Payment */}
                {currentStatus === "pending_payment" && (
                    <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-pulse" />
                        <p className="text-white font-bold">Awaiting Payment</p>
                        <p className="text-white/50 text-sm mt-1">
                            Please complete your GCash payment to proceed.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackingPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-pulse text-white/30 text-sm">Loading...</div>
                </div>
            }
        >
            <TrackingContent />
        </Suspense>
    );
}
