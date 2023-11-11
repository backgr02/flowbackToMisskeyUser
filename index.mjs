import * as Misskey from "misskey-js";

const misskeyAccount = (main, host, token) => {
  return {
    main: main,
    apiClient: new Misskey.api.APIClient({ origin: `https://${host}`, credential: token }),
  };
};

const misskeyAccounts = [
  misskeyAccount(true, process.env.MISSKEY_IO_HOST, process.env.MISSKEY_IO_TOKEN),
  misskeyAccount(true, process.env.BACKSPACE_FM_HOST, process.env.BACKSPACE_FM_TOKEN),
//   misskeyAccount(false, process.env.MISSKEY_IO_HOST, process.env.MISSKEY_IO_TOKEN_ORANGE_SAN),
  misskeyAccount(false, process.env.NIJIMISS_MOE_HOST, process.env.NIJIMISS_MOE_TOKEN),
  misskeyAccount(false, process.env.NINEVERSE_COM_HOST, process.env.NINEVERSE_COM_TOKEN),
  misskeyAccount(false, process.env.MISSKEY_SYSTEMS_HOST, process.env.MISSKEY_SYSTEMS_TOKEN),
];

export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if ("body" in event) {
      const body = JSON.parse(event.body);
      console.log(JSON.stringify(body));
      for (const account of misskeyAccounts) {
        if (account.main || `https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
          try {
            if (body.type === "followed") {
              await account.apiClient.request("following/create", { userId: body.body.user.id });
            } else if (body.type === "renote") {
              await account.apiClient.request("following/create", { userId: body.body.note.user.id });
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
    } else {
      response = { message: "no body" };
    }

    console.log(JSON.stringify(response));
    return {
      statusCode: 200,
      body: JSON.stringify(response, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify(err.message, null, 2),
      headers: { "Content-Type": "application/json" },
    };
  }
};
