"use client";

import { useEffect, useMemo, useState } from "react";
import Vapi from "@vapi-ai/web";

interface VoiceCallButtonProps {
  onCallStateChange?: (inCall: boolean) => void;
}

export default function VoiceCallButton({ onCallStateChange }: VoiceCallButtonProps) {
  const [inCall, setInCall] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const vapi = useMemo(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) {
      console.error("⚠️ NEXT_PUBLIC_VAPI_PUBLIC_KEY is not defined");
      return null;
    }
    return new Vapi(publicKey);
  }, []);

  useEffect(() => {
    if (!vapi) return;

    const handleCallStart = () => {
      setInCall(true);
      setIsStarting(false);
      onCallStateChange?.(true);
    };

    const handleCallEnd = () => {
      setInCall(false);
      setIsStarting(false);
      onCallStateChange?.(false);
    };

    const handleError = (error: any) => {
      console.error("❌ Vapi error:", error);
      setIsStarting(false);
      setInCall(false);
      onCallStateChange?.(false);
      alert("Erreur lors de l'appel vocal. Vérifiez votre connexion et réessayez.");
    };

    const handleMessage = (msg: any) => {
      if (msg?.type === "transcript") {
        console.log(`${msg.role}:`, msg.transcript);
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("error", handleError);
    vapi.on("message", handleMessage);

    return () => {
      vapi.stop();
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("error", handleError);
      vapi.off("message", handleMessage);
    };
  }, [vapi, onCallStateChange]);

  const startCall = async () => {
    if (!vapi) {
      alert("Configuration Vapi manquante. Vérifiez vos variables d'environnement.");
      return;
    }

    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) {
      alert("Configuration Vapi manquante. Vérifiez vos variables d'environnement.");
      return;
    }

    setIsStarting(true);
    try {
      await vapi.start(assistantId);
    } catch (error) {
      console.error("❌ Error starting call:", error);
      setIsStarting(false);
      alert("Erreur lors du démarrage de l'appel. Réessayez.");
    }
  };

  const stopCall = () => {
    if (!vapi) return;
    vapi.stop();
    setInCall(false);
    setIsStarting(false);
    onCallStateChange?.(false);
  };

  if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || !process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
    return null; // Ne pas afficher le bouton si les variables ne sont pas configurées
  }

  return (
    <button
      onClick={inCall ? stopCall : startCall}
      disabled={isStarting}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full font-medium
        transition-all duration-300
        ${inCall
          ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50 animate-pulse"
          : "bg-[#e31fc1] text-white hover:opacity-90 hover:shadow-lg hover:shadow-[#e31fc1]/50"
        }
        ${isStarting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      title={inCall ? "Raccrocher" : "Appeler"}
    >
      <span className="text-lg">{inCall ? "📞" : "📞"}</span>
      <span>{inCall ? "Raccrocher" : isStarting ? "Connexion..." : "Appeler"}</span>
      {inCall && (
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
    </button>
  );
}

