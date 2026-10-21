import adminBg from "@/assets/admin-bg.jpg";

export function AdminBgLayer({ overlayClassName }: { overlayClassName: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${adminBg.src})` }}
      />
      <div className={`absolute inset-0 ${overlayClassName}`} />
    </div>
  );
}
