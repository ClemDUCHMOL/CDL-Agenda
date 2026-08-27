interface WarningBannerProps {
  message: string;
}

export function WarningBanner({ message }: WarningBannerProps) {
  return (
    <div className="w-full rounded-md border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3 mb-4 text-center">
      ⚠️ {message}
    </div>
  );
}
