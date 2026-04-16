'use client';

import { useEffect, useState } from 'react';

export default function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Already dismissed or installed?
    if (localStorage.getItem('pwa-prompt-dismissed')) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Detect if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) { setIsInstalled(true); return; }

    if (ios) {
      // On iOS Safari we can't auto-prompt, show manual instructions after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Chrome/Edge/Firefox — capture beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after short delay so it's not jarring on load
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setShow(false);
      setIsInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', '1');
  };

  if (!show || isInstalled) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      width: 'min(420px, calc(100vw - 2rem))',
      background: 'rgba(19,10,34,0.97)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,153,79,0.4)',
      borderRadius: '18px', padding: '1.25rem 1.5rem',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,153,79,0.1)',
      zIndex: 9999, animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* App icon */}
        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.5rem' }}>
          ⚡
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>Install Quantumard OS</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.4 }}>
            {isIOS
              ? 'Tap the share icon → "Add to Home Screen" for the best experience'
              : 'Get the full app experience — works offline & gets push notifications'}
          </p>
        </div>

        <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, padding: '4px' }}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      {!isIOS && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button onClick={handleDismiss} style={{ flex: 1, padding: '9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            Not Now
          </button>
          <button onClick={handleInstall} style={{ flex: 2, padding: '9px', background: 'linear-gradient(135deg, var(--orange), var(--pink))', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <i className="fas fa-download"></i> Install App
          </button>
        </div>
      )}

      {isIOS && (
        <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(255,153,79,0.07)', borderRadius: '10px', border: '1px solid rgba(255,153,79,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text2)' }}>
            <span>1.</span>
            <span>Tap <strong style={{ color: 'var(--blue)' }}><i className="fas fa-share-square"></i> Share</strong> in Safari</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text2)', marginTop: '4px' }}>
            <span>2.</span>
            <span>Select <strong style={{ color: 'var(--orange)' }}>Add to Home Screen</strong></span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
