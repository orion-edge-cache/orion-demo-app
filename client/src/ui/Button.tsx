import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'border-none rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
    secondary: 'bg-slate-700 text-white hover:bg-slate-600 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-500 focus:ring-yellow-500'
  }

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
