const en = {
  meta: {
    title: "Add any card to Apple Wallet and Google Wallet — free",
    description:
      "Turn loyalty, membership and gift card barcodes into Apple Wallet and Google Wallet passes in seconds. Free, no sign-up.",
  },
  hero: {
    tagline:
      "A simple utility to convert physical barcodes into digital passes for Apple Wallet and Google Wallet. Entirely free and runs directly from your browser.",
    steps: [
      "Enter your membership or loyalty card barcode data.",
      "Configure the appearance and titles for your pass.",
      "Download the Apple pass or open the Google Wallet save link.",
    ],
  },
  theme: { toggle: "Toggle theme", light: "Light", dark: "Dark", system: "System" },
  tabs: { apple: "Apple Wallet", google: "Google Wallet" },
  code: {
    heading: "Scan or Upload Code",
    processedLocally: "Processed locally",
    scan: "Scan with Camera",
    upload: "Upload Image",
    orManual: "or enter manually",
    dataLabel: "Barcode Data",
    dataPlaceholder: "123456789",
    formatLabel: "Output Format",
    formatHint: "Not sure? Select QR for square codes or Code 128 for typical barcodes.",
    detected: "Detected {format}",
    notFound: "No barcode found in this image. Try a sharper photo or enter the code manually.",
    cameraTitle: "Scan a barcode",
    cameraHint: "Point the camera at the barcode and hold steady.",
    cameraError: "Can’t access the camera. Allow camera access or upload a photo instead.",
    cancel: "Cancel",
    ean13Apple:
      "iPhones on iOS 27+ show EAN-13 natively; older iPhones get the same number as Code 128.",
  },
  design: {
    titleLabel: "Pass Title",
    titlePlaceholder: "e.g. Korzinka",
    logoLabel: "Pass Logo",
    optional: "(Optional)",
    uploadLogo: "Upload Logo",
    removeLogo: "Remove",
    logoHint: "Converted to PNG and embedded in the pass.",
    labelLabel: "Label",
    labelPlaceholder: "Member ID",
    valueLabel: "Value",
    valuePlaceholder: "12345",
    colorLabel: "Color",
    customColor: "Custom color",
  },
  preview: { heading: "Preview" },
  actions: {
    addApple: "Add to Apple Wallet",
    addGoogle: "Add to Google Wallet",
    working: "Creating pass…",
  },
  errors: {
    empty: "Enter the barcode data.",
    tooLong: "This code is too long for the selected format.",
    digitsOnly: "This format only allows digits.",
    length: "Wrong number of digits for this format.",
    checksum: "The last digit (checksum) doesn’t match. Check the number.",
    charset: "This format doesn’t support some of these characters. Try QR Code.",
    titleRequired: "Enter a pass title.",
    logoInvalid: "Couldn’t read this image. Try a PNG or JPG.",
    apple_not_configured: "Apple Wallet passes are not available yet. Please try again later.",
    google_not_configured: "Google Wallet passes are not available yet. Please try again later.",
    apple_failed: "Couldn’t create the Apple pass. Please try again.",
    google_failed: "Couldn’t create the Google pass. Please try again.",
    invalid_input: "Some fields are invalid. Check the form and try again.",
    network: "Network error. Check your connection and try again.",
  },
  inApp: {
    body: "To add passes to Apple Wallet, open this page in Safari.",
    copy: "Copy link",
    copied: "Link copied",
  },
  privacy:
    "We don’t store your card data. Codes are read on your device; the pass is signed on our server and immediately discarded.",
  footer: "Not affiliated with Apple, Google or any store whose card you add.",
}

export default en
export type Dictionary = typeof en
