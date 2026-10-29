import Script from "next/script";

/**
 * Google Analytics 4 + optional Google Tag Manager.
 * Create a GA4 property → Admin → Data streams → Web → copy Measurement ID (G-XXXX).
 * Create Search Console property for the domain and paste the HTML-tag verification token
 * into NEXT_PUBLIC_GSC_VERIFICATION (wired via root metadata.verification).
 */
export function Analytics() {
  // GA4 Measurement ID — env override, else Garth live property.
  const gaId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-4KN6XGHGLR").trim();
  const gtmId = (process.env.NEXT_PUBLIC_GTM_ID || "").trim();

  if (!gaId && !gtmId) return null;

  return (
    <>
      {gtmId ? (
        <>
          <Script id="gtm-loader" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4-config" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { anonymize_ip: true });
          `}</Script>
        </>
      ) : null}
    </>
  );
}
