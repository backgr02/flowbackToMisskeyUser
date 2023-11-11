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
  misskeyAccount(false, process.env.NIJIMISS_MOE_HOST, process.env.NIJIMISS_MOE_TOKEN),
  misskeyAccount(false, process.env.NINEVERSE_COM_HOST, process.env.NINEVERSE_COM_TOKEN),
  misskeyAccount(false, process.env.MISSKEY_SYSTEMS_HOST, process.env.MISSKEY_SYSTEMS_TOKEN),
];

const searchUser = async (event, body, account, search) => {
  if (body.type === "followed") {
    if (`https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
      return body.body.user;
    } else {
      return await search(body.body.user);
    }
  } else if (body.type === "renote") {
    if (`https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
      return body.body.note.user;
    } else {
      return await search(body.body.note.user);
    }
  }
  throw new Error(`Unknown type: ${body.type}`);
};

export const handler = async (event, _context) => {
  try {
    console.log(JSON.stringify(event));
    let response = {};

    if ("body" in event) {
      const body = JSON.parse(event.body);
      console.log(JSON.stringify(body));
      for (const account of misskeyAccounts) {
        if (account.main || `https://${event.headers["x-misskey-host"]}` === account.apiClient.origin) {
          console.log("run: " + account.apiClient.origin);
          try {
            const user = await searchUser(event, body, account, async (user) => {
              console.log("search start: " + JSON.stringify(user));
              const users = await account.apiClient.request("users/search-by-username-and-host", {
                username: user.username,
                host: user.host,
                limit: 1,
                detail: false,
              });
              console.log("search end: " + JSON.stringify(users));
              return users[0];
            });
            console.log("user: " + JSON.stringify(user));
            await account.apiClient.request("following/create", { userId: user.id });
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
