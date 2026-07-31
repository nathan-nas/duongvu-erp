import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/brand/slider-fields.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[oklch(0.14_0.03_230)] via-[oklch(0.16_0.03_230)/88%] to-[oklch(0.2_0.04_230)/55%]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-6 py-16 text-white">
        <div className="flex items-center gap-3 motion-enter">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-lg bg-white/95 object-contain p-1 shadow-md"
          />
          <p className="font-display text-sm font-semibold tracking-[0.18em] uppercase text-white/90">
            Dương Vũ
          </p>
        </div>

        <div className="flex max-w-xl flex-col gap-4 motion-enter">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Quản lý chi phí
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-white/80">
            Tải lên file Excel, phân tích theo nhà máy và mã chi. Hệ thống nội bộ
            của Công ty TNHH Dương Vũ.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 motion-enter">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-primary text-primary-foreground shadow-md",
            )}
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white",
            )}
          >
            Đăng ký
          </Link>
        </div>
      </div>
    </main>
  );
}
