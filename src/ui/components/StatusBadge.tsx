
import React from 'react';
import { getStatusColor, getStatusLabel } from '../../core/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    return (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${getStatusColor(status)} ${className}`}>
            {getStatusLabel(status)}
        </span>
    );
};
