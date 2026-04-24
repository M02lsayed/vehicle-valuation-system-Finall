import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../css/custom-dropdown.css";

function normalizeOptions(options) {
    return (options || []).map((option) => {
        if (typeof option === "object" && option !== null) {
            return {
                label: String(option.label ?? option.value ?? ""),
                value: String(option.value ?? option.label ?? ""),
            };
        }

        return {
            label: String(option),
            value: String(option),
        };
    });
}

function CustomDropdown({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    maxHeight = 260,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({
        top: 0,
        left: 0,
        width: 0,
    });

    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);

    const normalizedOptions = useMemo(
        () => normalizeOptions(options),
        [options],
    );

    const selectedLabel = useMemo(() => {
        const selected = normalizedOptions.find((item) => item.value === value);
        return selected ? selected.label : placeholder;
    }, [normalizedOptions, placeholder, value]);

    const updateMenuPosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 6,
            left: rect.left,
            width: rect.width,
        });
    };

    const handleToggle = () => {
        if (disabled) return;
        if (!isOpen) {
            updateMenuPosition();
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (nextValue) => {
        onChange(nextValue);
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (
                containerRef.current?.contains(event.target) ||
                menuRef.current?.contains(event.target)
            ) {
                return;
            }

            setIsOpen(false);
        };

        const handleReposition = () => {
            updateMenuPosition();
        };

        document.addEventListener("mousedown", handleOutsideClick);
        window.addEventListener("resize", handleReposition);
        window.addEventListener("scroll", handleReposition, true);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            window.removeEventListener("resize", handleReposition);
            window.removeEventListener("scroll", handleReposition, true);
        };
    }, [isOpen]);

    return (
        <div
            className={`custom-dropdown ${isOpen ? "is-open" : ""} ${
                disabled ? "is-disabled" : ""
            }`}
            ref={containerRef}
        >
            <button
                type="button"
                className="custom-dropdown__trigger"
                ref={triggerRef}
                onClick={handleToggle}
                disabled={disabled}
            >
                <span>{selectedLabel}</span>
                <i className="custom-dropdown__arrow" />
            </button>

            {isOpen &&
                createPortal(
                    <div
                        className="custom-dropdown__menu"
                        ref={menuRef}
                        style={{
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            width: `${menuPosition.width}px`,
                            maxHeight: `${maxHeight}px`,
                        }}
                    >
                        {normalizedOptions.length === 0 ? (
                            <div className="custom-dropdown__empty">
                                No options available
                            </div>
                        ) : (
                            normalizedOptions.map((item) => (
                                <button
                                    key={`${item.value}-${item.label}`}
                                    type="button"
                                    className={`custom-dropdown__item ${
                                        item.value === value
                                            ? "is-selected"
                                            : ""
                                    }`}
                                    onClick={() => handleSelect(item.value)}
                                >
                                    {item.label}
                                </button>
                            ))
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}

export default CustomDropdown;
