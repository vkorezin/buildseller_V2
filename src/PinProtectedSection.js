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

export default function PinProtectedSection({
  children,
  onCancel,
  onSuccess,
  expectedPin = CORRECT_PIN,
  title = "Введите PIN-код",
  subtitle = null,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isNumericOnly = /^\d+$/.test(expectedPin);

  const handleSubmit = () => {
    if (pin === expectedPin) {
      setIsUnlocked(true);
      setError("");
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError(isNumericOnly ? "❌ Неверный PIN-код" : "❌ Неверный пароль доступа");
      setPin("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.icon}>🔒</div>
        <h3 style={styles.title}>{title}</h3>
        {subtitle && (
          <div style={{ fontSize: "0.88em", color: "#64748b", marginBottom: "15px" }}>
            {subtitle}
          </div>
        )}
        {error && <div style={styles.error}>{error}</div>}
        <div
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <input
            type={showPassword ? "text" : "password"}
            maxLength={isNumericOnly ? expectedPin.length : 32}
            style={{
              ...styles.input,
              width: isNumericOnly ? "150px" : "220px",
              letterSpacing: isNumericOnly ? "8px" : "2px",
              marginBottom: 0,
              paddingRight: isNumericOnly ? "12px" : "38px",
            }}
            value={pin}
            onChange={(e) => {
              const val = isNumericOnly
                ? e.target.value.replace(/\D/g, "")
                : e.target.value;
              setPin(val);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && onCancel) onCancel();
            }}
            onKeyPress={handleKeyPress}
            placeholder={isNumericOnly ? "*".repeat(expectedPin.length) : "Введите пароль"}
            autoFocus
          />
          {!isNumericOnly && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.1em",
                color: "#64748b",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={showPassword ? "Скрыть" : "Показать"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          )}
        </div>
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
