export function errorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/email-already-in-use": "Este e-mail já possui uma conta.",
    "auth/weak-password": "Use uma senha com pelo menos 8 caracteres.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/too-many-requests":
      "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "auth/network-request-failed":
      "Não foi possível conectar. Confira sua conexão.",
    "permission-denied":
      "Você não tem permissão para esta ação. Confira também as regras do Firebase.",
    unavailable:
      "Serviço indisponível. Tente novamente quando estiver conectado.",
    "failed-precondition": "Confira os índices e a configuração do Firestore.",
  };
  return code && messages[code]
    ? messages[code]
    : error instanceof Error
      ? error.message
      : "Não foi possível concluir. Tente novamente.";
}
