import logoAsset from "@/assets/vmy-icon-v3-cropped.png";

type Props = { className?: string; size?: number; sizes?: string };

export function UTransferLogo({ className, size = 48, sizes }: Props) {
  return (
    <img
      src={logoAsset}
      alt="V Move You"
      width={size}
      height={size}
      className={`block max-h-full max-w-full object-contain ${className ?? ""}`}
      sizes={sizes}
      style={{
        width: size,
        height: size,
        background: "transparent",
      }}
      loading="eager"
      decoding="async"
    />
  );
}
