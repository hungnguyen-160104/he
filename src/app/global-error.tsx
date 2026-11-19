"use client";

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1>Đã có lỗi nghiêm trọng</h1>
        <p>Ứng dụng không thể hiển thị trang này. Vui lòng thử lại.</p>
        <button type="button" onClick={() => retry()} style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}>
          Thử lại
        </button>
      </body>
    </html>
  );
}
