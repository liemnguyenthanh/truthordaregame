import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { isLocale } from '@/lib/i18n';

// Node allows loading bundled fonts without a network request.
export const runtime = 'nodejs';
const fonts = Promise.all([
  readFile(
    join(
      process.cwd(),
      'node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-latin-700-normal.woff',
    ),
  ),
  readFile(
    join(
      process.cwd(),
      'node_modules/@fontsource/be-vietnam-pro/files/be-vietnam-pro-vietnamese-700-normal.woff',
    ),
  ),
]);

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new Response('Not found', { status: 404 });
  const en = locale === 'en';
  const [latin, vietnamese] = await fonts;
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#f7f5f0',
        color: '#151d2b',
        padding: '68px 76px',
        fontFamily: 'Be Vietnam, Be Vietnam Vietnamese',
        fontWeight: 700,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 720,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: '#657063' }}>
          {en ? 'ONE PHONE. GOOD COMPANY.' : 'MỘT CHIẾC ĐIỆN THOẠI. CẢ CUỘC VUI.'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 32 }}>
          <div style={{ display: 'flex', fontSize: 84, lineHeight: 1.12 }}>
            {en ? 'Truth or Dare' : 'Thật hay Thách'}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              lineHeight: 1.45,
              color: '#647255',
              marginTop: 26,
              maxWidth: 670,
            }}
          >
            {en ? 'One question, a little closer.' : 'Chọn một câu, gần nhau hơn.'}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 22, marginTop: 46 }}>
          {en
            ? 'For friends and couples · Play in your browser'
            : 'Cho bạn bè và cặp đôi · Chơi trên trình duyệt'}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: 230,
          height: 270,
          background: '#e5eadb',
          borderRadius: 25,
          right: 77,
          top: 110,
          transform: 'rotate(-10deg)',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 35,
          color: '#44563d',
          border: '2px solid #d9e0cb',
        }}
      >
        {en ? 'TRUTH' : 'THẬT'}
      </div>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: 230,
          height: 270,
          background: '#f0ded6',
          borderRadius: 25,
          right: 47,
          top: 277,
          transform: 'rotate(9deg)',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 35,
          color: '#825947',
          border: '2px solid #e5cfc4',
        }}
      >
        {en ? 'DARE' : 'THÁCH'}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Be Vietnam', data: latin, weight: 700, style: 'normal' },
        { name: 'Be Vietnam Vietnamese', data: vietnamese, weight: 700, style: 'normal' },
      ],
      headers: {
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    },
  );
}
