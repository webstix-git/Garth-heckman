/**
 * Google Analytics 4 + optional Google Tag Manager.
 * Scripts must render in <head> for Google Search Console "GA verification".
 */
export function Analytics() {
  // GA4 Measurement ID — env override, else Garth live property.
  const gaId = (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-4KN6XGHGLR").trim();
  const gtmId = (process.env.NEXT_PUBLIC_GTM_ID || "").trim();

  if (!gaId && !gtmId) return null;

  return (
    <>
      {gtmId ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      ) : null}

      {gaId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`,
            }}
          />
        </>
      ) : null}
    </>
  );
}
