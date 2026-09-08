import { useMemo } from "react";
import qrcode from "qrcode-generator";

// 2026-09-08: QR «перейти в мобильную версию» (вариант A UX-проверки: карточка
// в rail главной между Daily Challenge и книгой). Без внешних API: матрица
// считается локально (qrcode-generator), рисуется SVG-rect'ами.
// URL на мобильных = production (dev-ссылку сканировать бессмысленно).
export const MOBILE_URL = "https://syntax-sooty.vercel.app/";

export default function QrCode({
  value = MOBILE_URL,
  size = 64,
  className = "",
}) {
  const rects = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    const out = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) out.push([c, r]);
      }
    }
    return { n, cells: out };
  }, [value]);

  const { n, cells } = rects;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR code: ${value}`}
    >
      <rect width={n} height={n} fill="#ffffff" rx={0} />
      {cells.map(([c, r], i) => (
        <rect key={i} x={c} y={r} width={1} height={1} fill="#0a1622" />
      ))}
    </svg>
  );
}
