import Image from "next/image";

type AuthBrandPanelProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
};

export function AuthBrandPanel({
  eyebrow = "Dương Vũ",
  title,
  subtitle,
}: AuthBrandPanelProps) {
  return (
    <div className="relative hidden min-h-full overflow-hidden bg-[oklch(0.18_0.03_230)] lg:flex lg:flex-col lg:justify-end">
      <Image
        src="/brand/hero-rice.png"
        alt=""
        fill
        priority
        className="object-cover opacity-70"
        sizes="50vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[oklch(0.14_0.03_230)] via-[oklch(0.18_0.03_230)/70%] to-[oklch(0.22_0.04_230)/40%]"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-4 p-10 text-white motion-enter">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-md bg-white/95 object-contain p-0.5 shadow-sm"
          />
          <p className="font-display text-sm font-semibold tracking-wide uppercase text-white/90">
            {eyebrow}
          </p>
        </div>
        <h1 className="max-w-md font-display text-3xl font-semibold leading-tight tracking-tight text-balance">
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-white/80">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
