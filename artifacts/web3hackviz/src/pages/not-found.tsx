import { Link } from "wouter";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4 opacity-60" />
        <h1 className="text-4xl font-bold glow-cyan mb-2">404</h1>
        <p className="text-muted-foreground mb-6">Exploit not found in the ledger.</p>
        <Link href="/" className="text-primary hover:underline text-sm">
          Back to all exploits
        </Link>
      </div>
    </div>
  );
}
