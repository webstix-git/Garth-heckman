export function isSampleCheckoutClient() {
  const flag = process.env.NEXT_PUBLIC_SAMPLE_CHECKOUT;
  return flag === "1" || flag === "true";
}

export function isSampleCheckoutServer() {
  const flag = process.env.SAMPLE_CHECKOUT;
  return flag === "1" || flag === "true";
}
