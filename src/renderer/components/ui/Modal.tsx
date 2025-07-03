/*C:\Users\byott\Documents\OOMS\src\renderer\components\ui\Modal.tsx*/

import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "small" | "medium" | "large";
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = React.memo(
  ({
    isOpen,
    onClose,
    title,
    children,
    size = "medium",
    showCloseButton = true,
  }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isOpen) {
          onClose();
        }
      };

      const handleClickOutside = (event: MouseEvent) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(event.target as Node)
        ) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.addEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.removeEventListener("mousedown", handleClickOutside);
        document.body.style.overflow = "unset";
      };
    }, [isOpen, onClose]);

    if (!isOpen) {
      return null;
    }

    const sizeClasses = {
      small: "modal-small",
      medium: "",
      large: "modal-large",
    };

    return (
      <div className="modal-overlay">
        <div
          ref={modalRef}
          className={`modal-content ${sizeClasses[size]}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {title && (
            <div className="modal-header">
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
              {showCloseButton && (
                <button
                  className="modal-close-button"
                  onClick={onClose}
                  aria-label="閉じる"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {!title && showCloseButton && (
            <div className="modal-header">
              <button
                className="modal-close-button"
                onClick={onClose}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          )}
          <div className="modal-body">{children}</div>
        </div>
      </div>
    );
  }
);

export default Modal;
