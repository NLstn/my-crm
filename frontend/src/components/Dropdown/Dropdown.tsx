import { FC, ReactNode, useState, useRef, useEffect, KeyboardEvent } from 'react';
import './Dropdown.css';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: FC<DropdownProps> = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <div className="dropdown__trigger" onClick={handleTriggerClick}>
        {trigger}
      </div>
      {isOpen && (
        <div className={`dropdown__content dropdown__content--${align}`}>
          {children}
        </div>
      )}
    </div>
  );
};
