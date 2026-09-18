'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {return <main id="main" className="page-width empty-result"><h1>Có chút gián đoạn</h1><p>Tiến độ đã lưu vẫn ở trên thiết bị. Hãy thử tải lại nhé.</p><button className="button button-primary" onClick={reset}>Thử lại</button><a className="back-link" href="/vi">Về chọn bộ</a></main>;}
