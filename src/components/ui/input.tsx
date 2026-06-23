import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-1.5 text-sm text-[#dbe5d9] transition-all duration-200 outline-none placeholder:text-[#859585] file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#dbe5d9] focus-visible:border-[#0068ed] focus-visible:shadow-[0_0_0_2px_rgba(0,104,237,0.2)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[#93000a] aria-invalid:shadow-[0_0_0_2px_rgba(255,180,171,0.15)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
