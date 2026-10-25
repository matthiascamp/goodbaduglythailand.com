"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import type { ClientEvent } from "@/lib/analytics";
import { reportEvent } from "@/lib/analytics-client";

/** Internal link that reports a name-only aggregate event on click. */
export function TrackedLink({ event, onClick, ...props }: ComponentProps<typeof Link> & { event: ClientEvent }) {
  return <Link {...props} onClick={(e) => { reportEvent(event); onClick?.(e); }} />;
}

/** Plain anchor (external links, in-page anchors) that reports a name-only aggregate event on click. */
export function TrackedAnchor({ event, onClick, ...props }: ComponentProps<"a"> & { event: ClientEvent }) {
  return <a {...props} onClick={(e) => { reportEvent(event); onClick?.(e); }} />;
}
