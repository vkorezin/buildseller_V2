import React, { useState } from "react";

const CORRECT_PIN = "2159";

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "30px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  title: {
    margin: "0 0 20px 0",
    fontSize: "1.3em",
    color: "#333",
  },
  input: {
    padding: "12px",
    fontSize: "1.2em",
    border: "2px solid #007bff",
    borderRadius: "8px",
    textAlign: "center",
    width: "150px",
    letterSpacing: "8px",
    marginBottom: "20px",
  },
  button: {
    padding: "10px 25px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
    marginRight: "10px",
  },
  cancelButton: {
    padding: "10px 25px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1em",
  },
  error: {
    color: "#dc3545",
    marginBottom: "15px",
    fontSize: "0.9em",
  },
  icon: {
    fontSize: "3em",
    marginBottom: "15px",
  },
};

export default function PinProtectedSection({ children, onCancel, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleSubmit = () => {
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      setError("");
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError("❌ Неверный PIN-код");
      setPin("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.icon}>🔒</div>
        <h3 style={styles.title}>Введите PIN-код</h3>
        {error && <div style={styles.error}>{error}</div>}
        <input
          type="password"
          maxLength="4"
          style={styles.input}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyPress={handleKeyPress}
          placeholder="****"
          autoFocus
        />
        <div>
          <button style={styles.button} onClick={handleSubmit}>
            Подтвердить
          </button>
          <button style={styles.cancelButton} onClick={onCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
