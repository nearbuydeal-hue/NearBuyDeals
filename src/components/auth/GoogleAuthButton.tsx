import { googleAuthAction } from "@/app/actions/auth";

export function GoogleAuthButton() {
  return (
    <form action={googleAuthAction}>
      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
      >
        Continue with Google
      </button>
    </form>
  );
}
