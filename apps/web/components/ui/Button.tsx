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
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold text-xs uppercase tracking-wider transition-colors duration-200 rounded-[6px] focus-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs';

  const variantStyles = {
    primary: 'bg-[#315FEA] hover:bg-[#254EDB] active:bg-[#1E40AF] text-white border border-transparent shadow-xs hover:shadow-subtle',
    secondary: 'bg-[#F3F6FA] hover:bg-[#E3E7ED] text-[#172033] border border-[#CBD5E1]',
    outline: 'bg-white hover:bg-[#F3F6FA] text-[#172033] border border-[#CBD5E1] shadow-xs',
    ghost: 'bg-transparent hover:bg-[#F3F6FA] text-[#475569] hover:text-[#172033]',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs min-h-[36px]',
    md: 'px-6 py-2.5 text-xs min-h-[40px]',
    lg: 'px-8 py-3 text-sm min-h-[44px]',
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
