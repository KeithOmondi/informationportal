import React from "react";

interface Props {
  isOpen: boolean;
  onInstall: () => void;
  onClose: () => void;
  isIOS: boolean;
}

const InstallModal: React.FC<Props> = ({ isOpen, onInstall, onClose, isIOS }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Install App</h2>

        {isIOS ? (
          <p>
            Tap <b>Share</b> → <b>Add to Home Screen</b>
          </p>
        ) : (
          <p>Install this app for a better experience 🚀</p>
        )}

        <div style={styles.actions}>
          {!isIOS && (
            <button onClick={onInstall} style={styles.installBtn}>
              Install
            </button>
          )}
          <button onClick={onClose}>Later</button>
        </div>
      </div>
    </div>
  );
};

const styles: any = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },
  modal: {
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    width: 300,
    textAlign: "center"
  },
  actions: {
    marginTop: 20,
    display: "flex",
    justifyContent: "space-around"
  },
  installBtn: {
    background: "#000",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 6
  }
};

export default InstallModal;