// Re-mounts on every top-level navigation, so pages crossfade in like turning a page.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
