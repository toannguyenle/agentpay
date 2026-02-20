import SetupForm from "./setup-form";

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-base px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold text-white">First-time setup</h1>
        <p className="mt-2 text-white/70">
          Create your first agent, connect Telegram, and grab your API key.
        </p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-card/90 p-6">
          <SetupForm />
        </div>
      </div>
    </main>
  );
}
