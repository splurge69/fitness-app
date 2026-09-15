import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
        Personal rehab log
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">
        ACL tracker
      </h1>
      <p className="mt-3 max-w-sm text-muted">
        One password, stored in Vercel. Use this on the gym floor to see what is
        next and write down what you actually did.
      </p>
      <div className="mt-10">
        <LoginForm />
      </div>
    </main>
  );
}
