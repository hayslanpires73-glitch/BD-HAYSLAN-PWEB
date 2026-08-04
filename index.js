const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// FUNÇÃO CALLABLE: exclui permanentemente a conta
// (Firebase Authentication + documento no Firestore)
//
// Recebe: { uid: "id_do_usuario" }
//
// IMPORTANTE (SEGURANÇA):
// Esta versão exige que quem chama a função esteja LOGADO
// (auth != null). Isso evita que qualquer pessoa anônima
// exclua contas alheias. Se quiser restringir só para
// administradores, veja o comentário mais abaixo.

exports.excluirContaPermanentemente = onCall(async (request) => {

  // Verifica se quem está chamando está autenticado
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Você precisa estar logado para excluir uma conta."
    );
  }

  const uid = request.data.uid;

  if (!uid) {
    throw new HttpsError(
      "invalid-argument",
      "É necessário informar o uid do usuário a ser excluído."
    );
  }

  // ----------------------------------------------------------------
  // OPCIONAL - RESTRINGIR A ADMINISTRADORES:
  // Descomente o bloco abaixo se quiser que SÓ um usuário admin
  // (definido por email) possa excluir contas de outras pessoas.
  //
  // const emailsAdmin = ["seuemail@exemplo.com"];
  // if (!emailsAdmin.includes(request.auth.token.email)) {
  //   throw new HttpsError(
  //     "permission-denied",
  //     "Você não tem permissão para excluir contas."
  //   );
  // }
  // ----------------------------------------------------------------

  try {

    // 1. Exclui a conta do Firebase Authentication
    await admin.auth().deleteUser(uid);

    // 2. Exclui o documento correspondente no Firestore
    await admin.firestore().collection("usuarios").doc(uid).delete();

    return { sucesso: true, mensagem: "Conta excluída permanentemente." };

  } catch (error) {

    throw new HttpsError("internal", error.message);

  }

});
