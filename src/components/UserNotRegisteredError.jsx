import { useAuth } from "@/lib/AuthContext";

export default function UserNotRegisteredError() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50">
      <div className="w-full max-w-md rounded-lg border border-slate-100 bg-white p-8 shadow-lg">
        <div className="text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <svg
              className="h-8 w-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-slate-900">
            Acesso restrito
          </h1>
          <p className="mb-8 text-slate-600">
            Sua conta ainda nao esta habilitada para usar esta aplicacao.
            Entre em contato com o administrador.
          </p>
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            <p>Se isso parecer incorreto:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Confirme se voce entrou com a conta correta.</li>
              <li>Peca liberacao ao administrador da aplicacao.</li>
              <li>Saia e entre novamente.</li>
            </ul>
          </div>
          <button
            className="mt-6 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            onClick={() => logout(true)}
          >
            Sair desta conta
          </button>
        </div>
      </div>
    </div>
  );
}
