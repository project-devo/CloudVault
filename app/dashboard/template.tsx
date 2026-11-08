// Crossfades between dashboard pages (files <-> shared links) inside the persistent shell.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
