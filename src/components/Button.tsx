import { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-gradient-to-b from-primary-light to-primary text-black font-bold shadow-lg shadow-primary/20 active:from-primary active:to-primary-dark',
  secondary: 'glass-light text-white/90 active:bg-white/10',
  danger: 'bg-danger/10 text-danger border border-danger/20 active:bg-danger/20',
  ghost: 'text-muted active:text-white/80',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm rounded-xl',
  md: 'px-5 py-3 text-base rounded-2xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`${variants[variant]} ${sizes[size]} tap-scale transition-all touch-manipulation font-semibold ${className}`}
      {...props}
    />
  )
}
