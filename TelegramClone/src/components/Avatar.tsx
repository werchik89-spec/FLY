import React from 'react';
import { getInitials } from '../utils/helpers';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
  fontSize?: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, color, size = 50, online, fontSize }) => {
  return (
    <div
      className="chat-avatar"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: fontSize || size * 0.38,
      }}
    >
      {getInitials(name)}
      {online && <div className="online-dot" />}
    </div>
  );
};

export default Avatar;
