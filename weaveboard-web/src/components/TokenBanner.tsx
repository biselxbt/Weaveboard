import { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { WEAVE_TOKEN } from '../config/token';
import logoUrl from '../assets/logo.png';

interface TokenBannerProps {
  onNavigate?: () => void;
}

export const TokenBanner = ({ onNavigate }: TokenBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-2 sm:pb-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <img src={logoUrl} alt="$WEAVE" className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-white text-sm whitespace-nowrap">{WEAVE_TOKEN.NAME}</span>
              <span className="text-[10px] sm:text-xs text-white/50 whitespace-nowrap">
                Every $WEAVE trade funds free AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onNavigate}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
            >
              Learn More
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};