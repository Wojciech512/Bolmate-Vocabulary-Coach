import { Link, LinkProps } from "@mui/material";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { forwardRef } from "react";

export type StyledLinkVariant = "default" | "button" | "nav";

export interface StyledLinkProps extends Omit<LinkProps, "variant"> {
  to: string;
  variant?: StyledLinkVariant;
  isActive?: boolean;
}

/**
 * Ustandaryzowany link z predefiniowanymi wariantami.
 *
 * Warianty:
 * - default: standardowy link (underline hover)
 * - button: link wyglądający jak przycisk
 * - nav: link nawigacyjny (dla menu)
 */
const StyledLink = forwardRef<HTMLAnchorElement, StyledLinkProps>(
  ({ variant = "default", to, isActive = false, sx, children, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case "default":
          return {
            color: "primary.main",
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          };
        case "button":
          return {
            color: "primary.main",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: 1,
            fontWeight: 600,
            "&:hover": {
              bgcolor: "action.hover",
            },
          };
        case "nav":
          return {
            color: isActive ? "secondary.main" : "text.primary",
            textDecoration: "none",
            fontWeight: isActive ? 700 : 500,
            px: 2,
            py: 1,
            borderRadius: 1,
            bgcolor: isActive ? "secondary.main" : "transparent",
            "&:hover": {
              bgcolor: isActive ? "secondary.dark" : "action.hover",
            },
          };
        default:
          return {};
      }
    };

    const variantStyles = getVariantStyles();

    return (
      <Link
        ref={ref}
        component={RouterLink}
        to={to}
        sx={{
          ...variantStyles,
          ...sx,
        }}
        {...(props as Omit<RouterLinkProps, "to">)}
      >
        {children}
      </Link>
    );
  }
);

StyledLink.displayName = "StyledLink";

export default StyledLink;
