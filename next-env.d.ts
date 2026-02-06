/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.

// Allow importing CSS files in TypeScript
declare module '*.css' {
  const content: string;
  export default content;
}

// Type declarations for Next.js
declare module 'next' {
  interface Metadata {
    title?: string | null | undefined;
    description?: string | null | undefined;
    keywords?: string[] | null | undefined;
    authors?: { name: string }[] | null | undefined;
    openGraph?: {
      title?: string | null | undefined;
      description?: string | null | undefined;
      url?: string | null | undefined;
      siteName?: string | null | undefined;
      images?: { url: string; width: number; height: number; alt: string }[] | null | undefined;
      locale?: string | null | undefined;
      type?: string | null | undefined;
    } | null | undefined;
  }
}
