'use client';

interface ToastProps {
  message: string;
}

export default function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className="toast-msg">{message}</div>
    </div>
  );
}
