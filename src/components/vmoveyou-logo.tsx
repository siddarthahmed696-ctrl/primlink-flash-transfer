import iconAsset from "@/assets/vmy-icon.png.asset.json";

type Props = { className?: string; size?: number };

export function UTransferLogo({ className, size = 32 }: Props) {
  return (
    <img
      src={iconAsset.url}
      alt="V Move You"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      loading="eager"
      decoding="async"
    />
  );
}
