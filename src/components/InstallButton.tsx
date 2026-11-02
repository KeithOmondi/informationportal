import { useInstallPrompt } from '../hooks/useInstallPrompt'

// These helper functions are "pure" in terms of data fetching, 
// so they can be called during render.
function isIOS() {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallButton() {
  const { isInstallable, install } = useInstallPrompt() // Android/Desktop

  // Calculate the "Show Hint" logic directly in the body of the function.
  // This is faster and avoids cascading renders.
  const showIOSHint = isIOS() && !isInStandaloneMode()

  // 1. Android/Desktop — normal install button
  if (isInstallable) {
    return (
      <button 
        onClick={install}
        className="px-4 py-2 bg-[#355E3B] text-white rounded-lg font-bold"
      >
        Install App
      </button>
    )
  }

  // 2. iOS — manual instruction hint
  if (showIOSHint) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-sm text-slate-600">
          To install: tap the <strong>Share</strong> button in Safari, 
          then <strong>"Add to Home Screen"</strong>
        </p>
      </div>
    )
  }

  return null
}