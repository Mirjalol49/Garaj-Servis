import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#00e475]/40 active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#00e475] text-[#00210b] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#00ff85] hover:shadow-[0_0_18px_rgba(0,228,117,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
        secondary:
          "border border-[#0068ed] bg-transparent text-[#0068ed] hover:bg-[#0068ed]/10 hover:shadow-[0_0_12px_rgba(0,104,237,0.2)]",
        ghost:
          "bg-transparent text-[#bacbb9] hover:bg-[#232c24] hover:text-[#dbe5d9]",
        outline:
          "border border-[#3b4a3d] bg-transparent text-[#bacbb9] hover:bg-[#232c24] hover:border-[#859585]",
        destructive:
          "bg-[#93000a]/20 text-[#ffb4ab] border border-[#93000a] hover:bg-[#93000a]/30 focus-visible:ring-[#ffb4ab]/30",
        link: "text-[#00e475] underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 rounded-lg px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-lg px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-base rounded-xl",
        icon: "size-9 rounded-xl",
        "icon-xs": "size-6 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-lg",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
