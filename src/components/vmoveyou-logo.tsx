import logoUrl from "@/assets/vmy-icon.png";

type Props = { className?: string; size?: number };

export function UTransferLogo({ className, size = 32 }: Props) {
  return (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain" }}
      loading="eager"
      decoding="async"
    />
  );
}
