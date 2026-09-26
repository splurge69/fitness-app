import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-display text-sm uppercase tracking-[0.2em] text-accent">
        Members only
      </p>
      <h1 className="chrome mt-2 font-display text-6xl uppercase italic tracking-tight">
        Club Serginho
      </h1>
      <span className="stripes mt-3" aria-hidden />
      <p className="mt-5 max-w-sm text-muted">
        Pick the programme, lift the weight, log the reps.
      </p>
      <div className="mt-10">
        <LoginForm />
      </div>
    </main>
  );
}
