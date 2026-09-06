import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

type ButtonBaseProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: boolean;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = false,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded-full focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-purple-glow hover:scale-[1.03]',
    secondary: 'bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200',
    outline: 'bg-white hover:bg-gray-50 text-charcoal-900 border border-gray-300 shadow-soft-sm',
    ghost: 'bg-transparent hover:bg-gray-100 text-charcoal-800',
  };

  const sizeStyles = {
    sm: 'px-5 py-2 text-[11px]',
    md: 'px-7 py-3.5 text-xs',
    lg: 'px-9 py-4 text-xs',
  };

  const combinedClasses = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

  if (props.href) {
    return (
      <a className={combinedClasses} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        <span>{children}</span>
        {icon && <ArrowUpRight className="w-4 h-4 ml-1.5 shrink-0" />}
      </a>
    );
  }

  return (
    <button className={combinedClasses} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      <span>{children}</span>
      {icon && <ArrowUpRight className="w-4 h-4 ml-1.5 shrink-0" />}
    </button>
  );
}
