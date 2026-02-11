import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }: any) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "#0B0E14",
          "--normal-text": "#F4F6FA",
          "--normal-border": "rgba(255,255,255,0.1)",
          "--border-radius": "14px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
