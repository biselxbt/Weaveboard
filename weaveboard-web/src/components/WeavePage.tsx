import { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  Upload,
  Gauge,
  Wallet,
  Server,
  Coins,
  Globe,
  Key,
  Rocket,
  Shield
} from 'lucide-react';
import { WEAVE_TOKEN } from '../config/token';
import logoUrl from '../assets/logo.png';

interface WeavePageProps {
  onBack?: () => void;
}

export const WeavePage = ({ onBack }: WeavePageProps) => {
  const [copied, setCopied] = useState(false);

  const copyCA = () => {
    navigator.clipboard.writeText(WEAVE_TOKEN.CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-void text-white">
      <div className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Weaveboard" className="w-6 h-6 rounded-lg" />
            <span className="font-semibold">Weaveboard</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        <section className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass border border-white/10 mb-6">
            <img src={logoUrl} alt="$WEAVE" className="w-12 h-12 rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold mb-3">
            $WEAVE
          </h1>
          <p className="text-white/60 mb-6">
            The Native Fuel of Weaveboard
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 glass border border-white/10 rounded-xl max-w-[90vw] overflow-hidden">
            <span className="text-white/50 text-sm whitespace-nowrap">Contract:</span>
            <code className="font-mono text-white/80 text-sm truncate max-w-[200px] sm:max-w-xs">{WEAVE_TOKEN.CA}</code>
            <button
              onClick={copyCA}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-white/80" /> : <Copy className="w-4 h-4 text-white/50" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <a
              href={WEAVE_TOKEN.LINKS.PUMP_FUN}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all"
            >
              Buy on Pump.fun <ExternalLink className="w-4 h-4" />
            </a>
            {WEAVE_TOKEN.LINKS.TWITTER !== '#' && (
              <a
                href={WEAVE_TOKEN.LINKS.TWITTER}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 glass border border-white/10 hover:bg-white/5 rounded-xl font-medium transition-colors"
              >
                X (Twitter)
              </a>
            )}
          </div>
        </section>

        <section className="py-6">
          <div className="glass border border-white/10 rounded-2xl p-8">
            <p className="text-lg text-white/80 leading-relaxed mb-4">
              Weaveboard is becoming a <span className="text-white font-semibold">self-sustaining, token-powered developer ecosystem</span> on Solana.
            </p>
            <p className="text-white/60 leading-relaxed">
              $WEAVE was designed from day one to align incentives between users, developers, and infrastructure — so the more the platform grows, the better it gets for everyone.
            </p>
          </div>
        </section>

        <section className="py-6">
          <h2 className="text-xl font-semibold mb-6">Gradual Integration Roadmap</h2>
          
          <div className="space-y-6">
            <div className="glass border border-white/10 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phase 1 – Live Now (Infrastructure Sustainability)</h3>
                  <p className="text-white/60 text-sm mb-3">
                    Every $WEAVE trade on pump.fun automatically routes a portion of fees to the official Weaveboard Treasury wallet via Solana's native mechanisms.
                  </p>
                  <p className="text-white/50 text-sm">
                    These funds are used <span className="text-white">100% transparently</span> for:
                  </p>
                  <ul className="mt-2 space-y-1 text-white/50 text-sm">
                    <li>• High-performance GPU clusters</li>
                    <li>• LLM inference costs</li>
                    <li>• Indexing servers, storage, and global MCP relay</li>
                    <li>• Open-source bounties and new language support</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass border border-white/10 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phase 2 – Rolling Out Next (Built-in AI & Native Payments)</h3>
                  <p className="text-white/60 text-sm mb-4">
                    We are shipping <span className="text-white">native hosted models</span> directly inside Weaveboard — no more copying API keys.
                  </p>
                  <p className="text-white/50 text-sm mb-3">
                    This built-in AI layer uses Solana-native payment rails:
                  </p>
                  <ul className="space-y-2 text-white/50 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">•</span>
                      <span><span className="text-white">x402 Pay-Per-Use</span> — pay instantly with micro-transactions in $WEAVE for complex queries or full-repo analysis.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">•</span>
                      <span><span className="text-white">Wallet-native integration</span> — connect your Solana wallet once and use AI with zero extra setup.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-white mt-0.5">•</span>
                      <span><span className="text-white">Priority access</span> — $WEAVE holders receive faster response times, higher limits, and enhanced features.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="glass border border-white/10 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Coins className="w-5 h-5 text-white/80" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phase 3 – Coming Soon</h3>
                  <p className="text-white/60 text-sm">
                    More exciting features on the way. Stay tuned for updates!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="glass border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-white/60 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Free tier stays forever</h3>
                <p className="text-white/60 text-sm">
                  You can always bring your own API keys — no token required. Premium features are completely optional and powered by the community-driven treasury.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6">
          <h2 className="text-xl font-semibold mb-6">Why This Tech Stack is Perfect for Developers</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 glass border border-white/10 rounded-xl">
              <Globe className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">Solana = Sub-second Finality</h4>
                <p className="text-white/50 text-xs">Near-zero fees → AI calls feel instant.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 glass border border-white/10 rounded-xl">
              <Zap className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">x402 + Wallet Connect</h4>
                <p className="text-white/50 text-xs">True micro-payments without credit cards or subscriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 glass border border-white/10 rounded-xl">
              <Coins className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">Transparent Treasury</h4>
                <p className="text-white/50 text-xs">Every trade you make directly improves the tool you use daily.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 glass border border-white/10 rounded-xl">
              <Key className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">Real Utility</h4>
                <p className="text-white/50 text-xs">$WEAVE becomes more valuable the more you code with Weaveboard.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center py-8">
          <a
            href={WEAVE_TOKEN.LINKS.PUMP_FUN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium transition-all"
          >
            Get $WEAVE Now <ExternalLink className="w-5 h-5" />
          </a>
        </section>
      </div>
    </div>
  );
};