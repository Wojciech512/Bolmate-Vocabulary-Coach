import { Button, ButtonProps } from "@mui/material";
import { forwardRef } from "react";

export type StyledButtonVariant = "primary" | "secondary" | "outlined" | "text" | "danger";

export interface StyledButtonProps extends Omit<ButtonProps, "variant" | "color"> {
  variant?: StyledButtonVariant;
  component?: React.ElementType;
  to?: string;
}

/**
 * Ustandaryzowany przycisk z predefiniowanymi wariantami.
 *
 * Warianty:
 * - primary: główna akcja (contained, primary color)
 * - secondary: akcja drugorzędna (contained, secondary color)
 * - outlined: akcja outline (outlined, primary color)
 * - text: akcja tekstowa (text, primary color)
 * - danger: akcja destrukcyjna (outlined, error color)
 */
const StyledButton = forwardRef<HTMLButtonElement, StyledButtonProps>(
  ({ variant = "primary", sx, children, ...props }, ref) => {
    const getVariantStyles = (): Pick<ButtonProps, "variant" | "color"> => {
      switch (variant) {
        case "primary":
          return { variant: "contained", color: "primary" };
        case "secondary":
          return { variant: "contained", color: "secondary" };
        case "outlined":
          return { variant: "outlined", color: "primary" };
        case "text":
          return { variant: "text", color: "primary" };
        case "danger":
          return { variant: "outlined", color: "error" };
        default:
          return { variant: "contained", color: "primary" };
      }
    };

    const variantStyles = getVariantStyles();

    return (
      <Button
        ref={ref}
        {...variantStyles}
        sx={{
          textTransform: "none",
          fontWeight: variant === "text" ? 500 : 600,
          ...sx,
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

StyledButton.displayName = "StyledButton";

export default StyledButton;
