import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useState, useEffect } from 'react'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
}

export default function InstallButton() {
  const { isInstallable, install } = useInstallPrompt() // Android/Desktop
  const [showIOSHint, setShowIOSHint] = useState(false)

  useEffect(() => {
    // Show iOS hint only if on iOS and not already installed
    if (isIOS() && !isInStandaloneMode()) {
      setShowIOSHint(true)
    }
  }, [])

  // Android/Desktop — normal install button
  if (isInstallable) {
    return <button onClick={install}>Install App</button>
  }

  // iOS — manual instruction hint
  if (showIOSHint) {
    return (
      <div>
        <p>
          To install: tap the <strong>Share</strong> button in Safari, 
          then <strong>"Add to Home Screen"</strong>
        </p>
      </div>
    )
  }

  return null
}