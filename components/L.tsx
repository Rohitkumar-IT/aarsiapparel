"use client";
import NextLink from "next/link";
import { forwardRef, type ComponentProps } from "react";
import { useLocalePath } from "./I18nProvider";

/** Drop-in for next/link that keeps the visitor in their language. */
const L = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function L({ href, ...rest }, ref) {
  const lp = useLocalePath();
  return <NextLink ref={ref} href={typeof href === "string" ? lp(href) : href} {...rest} />;
});
export default L;
