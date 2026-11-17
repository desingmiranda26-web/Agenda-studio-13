import React from 'react';

interface StarAccentProps {
  className?: string;
  size?: number;
}

export const StarAccent: React.FC<StarAccentProps> = ({
  className = 'text-white',
  size = 18,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 0L14.9 9.1L24 12L14.9 14.9L12 24L9.1 14.9L0 12L9.1 9.1L12 0Z" />
    </svg>
  );
};
