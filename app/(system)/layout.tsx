import { DocumentLayout, documentMetadata } from '@/components/document-layout';
export { viewport } from '@/components/document-layout';
export const metadata = documentMetadata('vi');
export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <DocumentLayout locale="vi">{children}</DocumentLayout>;
}
