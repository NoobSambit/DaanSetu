"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import DonationModal from "./DonationModal";
import Toast from "./Toast";

interface DonateButtonProps {
  ngoId: string | null;
  ngoName: string;
  isAuthenticated: boolean;
  campaignId?: string;
  campaignTitle?: string;
  className?: string;
  icon?: React.ReactNode;
  text?: string;
}

export default function DonateButton({
  ngoId,
  ngoName,
  isAuthenticated,
  campaignId,
  campaignTitle,
  className,
  icon,
  text,
}: DonateButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleDonateClick = () => {
    if (!isAuthenticated) {
      const nextPath = campaignId
        ? `/campaigns/${campaignId}`
        : `/ngos/${ngoId}`;
      router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setIsModalOpen(true);
  };

  const handleDonationSuccess = () => {
    setIsModalOpen(false);
    setToast({
      message: "Thank you! Your donation was successful.",
      type: "success",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDonateClick}
        className={
          className ||
          "flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        }
      >
        {icon || <Heart className="h-4 w-4" />}
        {text || "Donate Now"}
      </button>

      {isAuthenticated && (
        <DonationModal
          ngoName={ngoName}
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleDonationSuccess}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
