import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="layout">
      <div className="layout-bg" />
      <main className="layout-content">{children}</main>
    </div>
  );
}
