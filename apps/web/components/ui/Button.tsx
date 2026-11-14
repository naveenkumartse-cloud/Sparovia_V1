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
    primary: 'bg-[#011E75] hover:bg-[#01185E] active:bg-[#011247] text-white border border-[#011E75] shadow-xs hover:shadow-subtle',
    secondary: 'bg-[#FAF8F2] hover:bg-[#F5EEDC] text-[#011E75] border border-[#EBDEBA]',
    outline: 'bg-white hover:bg-[#FAF8F2] text-[#011E75] border border-[#CBD5E1] hover:border-[#CE9E34] shadow-xs',
    ghost: 'bg-transparent hover:bg-[#EEF2FC] text-[#475569] hover:text-[#011E75]',
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
