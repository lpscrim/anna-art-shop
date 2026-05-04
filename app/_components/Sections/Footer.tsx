export function Footer() {
  return (
      <footer className="mt-24 py-4 px-6 flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
      <p className="text-muted-foreground">© {new Date().getFullYear()} ANNAMAIAART. ALL RIGHTS RESERVED.</p>
      <p className="text-muted-foreground text-sm">
        Site by{' '}
        <a href="https://lpscrim.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Lewis Scrimgeour
        </a>
      </p>
    </footer>
  );
}