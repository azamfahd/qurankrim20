import React from 'react';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = () => {
  return null;
};

