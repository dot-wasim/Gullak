import React from 'react';
import { Download, X, Share2, PlusSquare, Smartphone } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deferredPrompt: any;
  onInstalled: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  if (!isOpen) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
  const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Twitter|Line/i.test(navigator.userAgent);

  const handleNativePrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onInstalled();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">Install Gullak App</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {deferredPrompt ? (
            /* Direct 1-tap install available (Android Chrome / Edge / Desktop) */
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">One-Tap Install</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Install Gullak directly onto your home screen. Works 100% offline.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNativePrompt}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Install on Device</span>
              </button>
            </div>
          ) : isInAppBrowser ? (
            /* User clicked link inside WhatsApp/Instagram */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
                <strong>You are in an in-app browser.</strong> To install the app, open this page in Chrome or Safari.
              </div>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                <li>Tap the <strong>three dots (⋮)</strong> or Share button in top right.</li>
                <li>Tap <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong>.</li>
                <li>Then tap Install App!</li>
              </ol>
            </div>
          ) : isIOS ? (
            /* iPhone Safari instructions */
            <div className="space-y-3.5">
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-800">Add to iPhone Home Screen</h4>
                <p className="text-xs text-slate-500 mt-0.5">Apple requires 2 quick taps to install:</p>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Tap the Safari <strong>Share button</strong></span>
                    <Share2 className="w-4 h-4 text-blue-600 inline shrink-0" />
                    <span>at the bottom</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Scroll down & tap</span>
                    <strong className="text-emerald-700 flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5" /> "Add to Home Screen"
                    </strong>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                It will appear on your home screen with the green Gullak icon!
              </p>
            </div>
          ) : (
            /* Android Chrome manual instructions if prompt already fired */
            <div className="space-y-3.5">
              <div className="text-center">
                <h4 className="text-sm font-bold text-slate-800">Install via Chrome Menu</h4>
                <p className="text-xs text-slate-500 mt-0.5">Two quick steps to install:</p>
              </div>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    1
                  </div>
                  <span>Tap Chrome's <strong>three dots menu (⋮)</strong> in top right.</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    2
                  </div>
                  <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                </div>
              </div>
            </div>
          )}

          {/* Direct Android APK download option */}
          <div className="pt-1 border-t border-slate-100">
            <a
              href="https://github.com/dot-wasim/Gullak/releases/latest/download/Gullak.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Android APK (.apk)</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
