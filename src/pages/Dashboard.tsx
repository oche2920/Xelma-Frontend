import { useEffect, useState, useRef } from "react";
import { ChatSidebar } from "../components/ChatSidebar";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import type { PredictionData } from "../components/PredictionControls";
import BetModal from "../components/BetModal";
import { useRoundStore } from "../store/useRoundStore";
import PredictionHistory from "../components/PredictionHistory";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { predictionsApi, ApiError } from "../lib/api-client";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { Link } from "react-router-dom";

interface DashboardProps {
  showNewsRibbon?: boolean;
}

const Dashboard = ({ showNewsRibbon = true }: DashboardProps) => {
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const isWalletConnecting = useWalletStore(
    (s) => s.status === "connecting" || s.status === "checking"
  );
  const publicKey = useWalletStore((s) => s.publicKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { isConnected: isSocketConnected } = useConnectionStatus();

  useEffect(() => {
    const { fetchActiveRound, subscribeToRoundEvents } = useRoundStore.getState();
    void fetchActiveRound();
    const unsubscribe = subscribeToRoundEvents();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePrediction = (data: PredictionData) => {
    setPendingPrediction(data);
    setIsBetModalOpen(true);
  };

  return (
    <div className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {!isWalletConnected && (
          <div className="mb-6 rounded-xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 px-4 py-3 text-sm text-[#BEC7FE]">
            Connect your wallet to submit predictions.{' '}
            <Link to="/connect" className="font-semibold underline hover:text-white">
              Connect now
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
            <PredictionCard
              isWalletConnected={isWalletConnected}
              isRoundActive={isRoundActive}
              isConnecting={isWalletConnecting}
              isSubmittingPrediction={isSubmitting || isBetModalOpen}
              onPrediction={handlePrediction}
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
              <PriceChart height={280} />
            </div>
          </div>
        </div>
      </div>

      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setPendingPrediction(null);
        }}
        predictionData={pendingPrediction}
        onSuccess={(txHash) => {
          console.log("Prediction confirmed on-chain. TxHash:", txHash);
        }}
      />
    </div>
  );
};

export default Dashboard;