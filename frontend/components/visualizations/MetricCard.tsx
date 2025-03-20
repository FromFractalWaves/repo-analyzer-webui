// components/visualizations/MetricCard.tsx
import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  className
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border ${className}`}>
      <div className="flex items-center">
        <div className={`${color} rounded-md p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
            {title}
          </p>
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-1">
              <span className={`text-xs ${
                trend.isPositive 
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="text-xs text-gray-500 ml-1">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;