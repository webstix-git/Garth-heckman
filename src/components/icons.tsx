import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IconArrow(props: IconProps) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" {...props}>
      <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBag(props: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <path d="M3.4 5.5h11.2l-.9 9.3a1.2 1.2 0 0 1-1.2 1.1H5.5a1.2 1.2 0 0 1-1.2-1.1L3.4 5.5Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.3 7.3V4.9a2.7 2.7 0 0 1 5.4 0v2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 2.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 8l3.5 3.5L12.5 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M7.5 1.5 13 3.5v4c0 3.2-2.3 5.5-5.5 6.5C4.3 13 2 10.7 2 7.5v-4l5.5-2Z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconTruck(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M1.5 3.5h8v7h-8v-7ZM9.5 6h2.6l1.4 2.2v2.3h-4V6Z" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="4.3" cy="11.8" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="11" cy="11.8" r="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true" {...props}>
      <path d="M7.5 1.8v8m0 0L4.6 6.9M7.5 9.8l2.9-2.9M2 12.2h11" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconInfo(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2v4M8 4.9v.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="1.8" y="3.4" width="12.4" height="9.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="m2.2 4 5.8 4.3L13.8 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function IconPlay(props: IconProps) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 2.4v8.2l7-4.1z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="5.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.2 12.2 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M5.6 2.2 7 5.1 5.6 6.4a8.6 8.6 0 0 0 4 4l1.3-1.4 2.9 1.4v2.4c0 .6-.5 1-1.1 1A11.4 11.4 0 0 1 1.8 2.4c0-.6.4-1.1 1-1.1h2.8Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 14.4s5-4.2 5-8a5 5 0 0 0-10 0c0 3.8 5 8 5 8Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="8" cy="6.3" r="1.9" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function IconTrend(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M1.8 11.4 6 7.2l2.6 2.6 5.4-5.4M10.2 4.4H14v3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStore(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="2.2" y="2.2" width="4.6" height="4.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.2" y="2.2" width="4.6" height="4.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.2" y="9.2" width="4.6" height="4.6" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.2" y="9.2" width="4.6" height="4.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconPod(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="6" y="1.6" width="4" height="7.2" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconJournal(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2.4 12.4 3 9.6l7-7 2.4 2.4-7 7-2.8.6ZM9.4 3.4l2.4 2.4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPage(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3.4 1.8h6L13 5.4v8.8H3.4V1.8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.2 2v3.6H12.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
