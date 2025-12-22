import React from 'react'
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}
export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-white/70 backdrop-blur-xl
            border border-white/80 
            rounded-xl
            px-4 py-2.5
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
            transition-all duration-200
            shadow-sm
            ${icon ? 'pl-10' : ''}
            ${error ? 'ring-2 ring-red-500/50 border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500 ml-1">{error}</p>}
    </div>
  )
}

