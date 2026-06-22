import logoAsset from "@/assets/vmy-icon-v3-cropped.png.asset.json";

type Props = { className?: string; size?: number };

export function UTransferLogo({ className, size = 48 }: Props) {
  return (
    <img
      src={logoAsset.url}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        background: "transparent",
      }}
      loading="eager"
      decoding="async"
    />
  );
}
